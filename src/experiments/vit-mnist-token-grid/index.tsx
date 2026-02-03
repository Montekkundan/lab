'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ort from 'onnxruntime-web'
import { DefaultLayout } from '../../components/layouts/default-layout'

const CANVAS_SIZE = 280
const MODEL_INPUT_SIZE = 28
const PATCH_SIZE = 7
const PATCHES_PER_SIDE = MODEL_INPUT_SIZE / PATCH_SIZE
const TEST_ACCURACY = '97.73%'
const TARGET_INNER_SIZE = 20
const INK_THRESHOLD = 0.15
const BINARIZE_THRESHOLD = 0.08
const BLUR_PX = 0.6

const DIGITS = Array.from({ length: 10 }, (_, i) => i)

function softmax(logits: number[]) {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((v) => Math.exp(v - maxLogit))
  const sum = exps.reduce((acc, v) => acc + v, 0)
  return exps.map((v) => v / sum)
}

function getArgmax(values: number[]) {
  let maxIndex = 0
  let maxValue = values[0] ?? -Infinity
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > maxValue) {
      maxValue = values[i]
      maxIndex = i
    }
  }
  return maxIndex
}

function VitMnistTokenGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const inferTimeoutRef = useRef<number | null>(null)
  const sessionRef = useRef<ort.InferenceSession | null>(null)

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [prediction, setPrediction] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [distribution, setDistribution] = useState<number[]>(() => Array(10).fill(0))
  const [patchActivations, setPatchActivations] = useState<number[]>(() =>
    Array(PATCHES_PER_SIDE * PATCHES_PER_SIDE).fill(0)
  )

  const grid = useMemo(() => {
    return Array.from({ length: PATCHES_PER_SIDE * PATCHES_PER_SIDE }, (_, index) => index)
  }, [])

  const setCanvasDefaults = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 20
    ctx.imageSmoothingEnabled = true
  }, [])

  const clearCanvas = useCallback(() => {
    setCanvasDefaults()
    setPrediction(null)
    setConfidence(0)
    setDistribution(Array(10).fill(0))
    setPatchActivations(Array(PATCHES_PER_SIDE * PATCHES_PER_SIDE).fill(0))
  }, [setCanvasDefaults])

  const getCanvasPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(from.x, from.y, midX, midY)
    ctx.stroke()
  }, [])

  const captureInput = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const fullImage = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const { data } = fullImage

    let minX = canvas.width
    let minY = canvas.height
    let maxX = 0
    let maxY = 0
    let hasInk = false

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const idx = (y * canvas.width + x) * 4
        const value = data[idx] / 255
        if (value > INK_THRESHOLD) {
          hasInk = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    if (!hasInk) {
      return {
        floatData: new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE),
        patchValues: Array(PATCHES_PER_SIDE * PATCHES_PER_SIDE).fill(0)
      }
    }

    const boxWidth = Math.max(1, maxX - minX + 1)
    const boxHeight = Math.max(1, maxY - minY + 1)

    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = boxWidth
    cropCanvas.height = boxHeight
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return null
    cropCtx.drawImage(canvas, minX, minY, boxWidth, boxHeight, 0, 0, boxWidth, boxHeight)

    const normCanvas = document.createElement('canvas')
    normCanvas.width = MODEL_INPUT_SIZE
    normCanvas.height = MODEL_INPUT_SIZE
    const normCtx = normCanvas.getContext('2d')
    if (!normCtx) return null

    const scale = TARGET_INNER_SIZE / Math.max(boxWidth, boxHeight)
    const targetW = boxWidth * scale
    const targetH = boxHeight * scale
    const offsetX = (MODEL_INPUT_SIZE - targetW) / 2
    const offsetY = (MODEL_INPUT_SIZE - targetH) / 2

    normCtx.fillStyle = '#000'
    normCtx.fillRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
    normCtx.imageSmoothingEnabled = true
    normCtx.filter = `blur(${BLUR_PX}px)`
    normCtx.drawImage(cropCanvas, 0, 0, boxWidth, boxHeight, offsetX, offsetY, targetW, targetH)
    normCtx.filter = 'none'

    const imageData = normCtx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)

    const gray = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE)
    let mean = 0
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = imageData.data[i] / 255
      gray[i / 4] = value
      mean += value
    }
    mean /= gray.length

    const shouldInvert = mean > 0.5
    for (let i = 0; i < gray.length; i += 1) {
      let value = gray[i]
      if (shouldInvert) value = 1 - value
      value = value < BINARIZE_THRESHOLD ? 0 : value
      gray[i] = value
    }

    const floatData = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE)
    for (let y = 0; y < MODEL_INPUT_SIZE; y += 1) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x += 1) {
        let maxValue = 0
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || nx >= MODEL_INPUT_SIZE || ny < 0 || ny >= MODEL_INPUT_SIZE) continue
            const value = gray[ny * MODEL_INPUT_SIZE + nx]
            if (value > maxValue) maxValue = value
          }
        }
        floatData[y * MODEL_INPUT_SIZE + x] = maxValue
      }
    }

    const patchValues: number[] = []
    for (let py = 0; py < PATCHES_PER_SIDE; py += 1) {
      for (let px = 0; px < PATCHES_PER_SIDE; px += 1) {
        let sum = 0
        for (let y = 0; y < PATCH_SIZE; y += 1) {
          for (let x = 0; x < PATCH_SIZE; x += 1) {
            const index =
              (py * PATCH_SIZE + y) * MODEL_INPUT_SIZE + (px * PATCH_SIZE + x)
            sum += floatData[index]
          }
        }
        patchValues.push(sum / (PATCH_SIZE * PATCH_SIZE))
      }
    }

    return { floatData, patchValues }
  }, [])

  const runInference = useCallback(async () => {
    const session = sessionRef.current
    if (!session) return

    const captured = captureInput()
    if (!captured) return

    setPatchActivations(captured.patchValues)

    const inputTensor = new ort.Tensor('float32', captured.floatData, [
      1,
      1,
      MODEL_INPUT_SIZE,
      MODEL_INPUT_SIZE
    ])

    const inputName = session.inputNames[0] ?? 'input'
    const outputMap = await session.run({ [inputName]: inputTensor })
    const outputTensor = outputMap.logits ?? Object.values(outputMap)[0]
    if (!outputTensor) return

    const logits = Array.from(outputTensor.data as Float32Array)
    const probs = softmax(logits)
    const pred = getArgmax(probs)

    setDistribution(probs)
    setPrediction(pred)
    setConfidence(probs[pred] ?? 0)
  }, [captureInput])

  const scheduleInference = useCallback(() => {
    if (inferTimeoutRef.current) {
      window.clearTimeout(inferTimeoutRef.current)
    }
    inferTimeoutRef.current = window.setTimeout(() => {
      runInference().catch(() => null)
    }, 120)
  }, [runInference])

  useEffect(() => {
    setCanvasDefaults()

    const load = async () => {
      try {
        ort.env.logLevel = 'error'
        ort.env.wasm.wasmPaths = '/ort/'
        ort.env.wasm.numThreads = 1
        ort.env.wasm.simd = true
        ort.env.wasm.proxy = false
        sessionRef.current = await ort.InferenceSession.create('/models/vit-mnist.onnx', {
          executionProviders: ['wasm']
        })
        setStatus('ready')
      } catch (error) {
        console.error(error)
        setStatus('error')
      }
    }

    load()

    return () => {
      if (inferTimeoutRef.current) {
        window.clearTimeout(inferTimeoutRef.current)
      }
    }
  }, [setCanvasDefaults])

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-[980px]">
        <div className="rounded-3xl border border-black/10 bg-white/70 p-6 shadow-[0_40px_90px_-70px_rgba(15,23,42,0.5)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-1 flex-col gap-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500/80">
                ViT · Token Grid
              </div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="h-[320px] w-[320px] rounded-2xl border border-black/10 bg-black shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]"
                  onPointerDown={(event) => {
                    drawRef.current = true
                    const point = getCanvasPosition(event)
                    lastPointRef.current = point
                    drawLine(point, { x: point.x + 0.1, y: point.y + 0.1 })
                    scheduleInference()
                  }}
                  onPointerMove={(event) => {
                    if (!drawRef.current || !lastPointRef.current) return
                    const point = getCanvasPosition(event)
                    drawLine(lastPointRef.current, point)
                    lastPointRef.current = point
                    scheduleInference()
                  }}
                  onPointerUp={() => {
                    drawRef.current = false
                    lastPointRef.current = null
                  }}
                  onPointerLeave={() => {
                    drawRef.current = false
                    lastPointRef.current = null
                  }}
                />
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                  draw
                </div>
              </div>

              <div className="flex items-center gap-3 text-[12px] text-neutral-500/80">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-600 transition hover:border-black/20 hover:text-neutral-900"
                >
                  Clear
                </button>
                <span>
                  {status === 'loading' && 'Loading model…'}
                  {status === 'error' && 'Model failed to load.'}
                  {status === 'ready' && 'Model ready.'}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[360px] flex-col gap-6">
              <div className="grid grid-cols-4 gap-2 rounded-2xl border border-black/10 bg-white/60 p-4">
                {grid.map((index) => {
                  const value = patchActivations[index] ?? 0
                  const alpha = Math.min(0.85, 0.15 + value * 0.9)
                  return (
                    <div
                      key={index}
                      className="aspect-square rounded-md border border-black/10"
                      style={{ backgroundColor: `rgba(14, 116, 144, ${alpha})` }}
                    />
                  )
                })}
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500/70">
                  Prediction
                </div>
                <div className="mt-4 text-3xl font-semibold text-neutral-900">
                  {prediction ?? '—'}
                </div>
                <div className="mt-1 text-[13px] text-neutral-500">
                  Confidence {Math.round(confidence * 100)}%
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-neutral-500/80">
                  Test Acc {TEST_ACCURACY}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                <div className="grid grid-cols-5 gap-3 text-[11px] text-neutral-500">
                  {DIGITS.map((digit) => {
                    const value = distribution[digit] ?? 0
                    return (
                      <div key={digit} className="flex flex-col items-center gap-1.5">
                        <div className="text-[12px] font-medium text-neutral-700">{digit}</div>
                        <div className="flex h-12 w-2 items-end rounded-full bg-black/5">
                          <div
                            className="w-full rounded-full bg-neutral-900/70"
                            style={{ height: `${Math.max(6, value * 48)}px` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-neutral-500/70">
            <span>Trained for 5 epochs</span>
            <span className="h-1 w-1 rounded-full bg-neutral-300/80" />
            <span>No normalization (ToTensor only)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

VitMnistTokenGrid.Layout = DefaultLayout
VitMnistTokenGrid.Title = 'ViT Token Grid'
VitMnistTokenGrid.Description =
  'Minimal MNIST ViT demo with patch token visualization, ONNX export + browser inference, and MNIST-style preprocessing (center/scale to 20×20, threshold + invert, light blur/dilate for stroke normalization).'
VitMnistTokenGrid.Tags = ['ai', 'ui', 'canvas']

export default VitMnistTokenGrid
