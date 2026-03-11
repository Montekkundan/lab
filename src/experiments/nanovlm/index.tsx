'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ort from 'onnxruntime-web'
import NextImage from 'next/image'
import { DefaultLayout } from '../../components/layouts/default-layout'
import {
  DEFAULT_QUERY,
  EMBED_DIM,
  encodeCaptionToTokens,
  IMG_SIZE,
  l2Normalize,
  rankSearchResults,
  type VocabPayload
} from './lib'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type ShapeType = 'square' | 'circle' | 'triangle'
type TabKey = 'search' | 'embedding'

type ConfigPayload = {
  img_size?: number
  embed_dim?: number
  attention_heads?: number
  context_window?: number
  metrics?: Record<string, number>
}

type EmbeddingPointPayload = {
  before?: number[][]
  after?: number[][]
  captions?: string[]
}

type SearchResult = {
  caption: string
  score: number
  dataUrl: string
}

type BankItem = {
  caption: string
  dataUrl: string
  embedding: Float32Array
}

const COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray']
const SHAPES: ShapeType[] = ['square', 'circle', 'triangle']
const POSITIONS = [
  'left',
  'center',
  'right',
  'top',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
]

function parseVector(data: ort.Tensor['data']) {
  if (
    data instanceof Float32Array ||
    data instanceof Float64Array ||
    data instanceof Int32Array ||
    data instanceof Uint8Array
  ) {
    return new Float32Array(Array.from(data as ArrayLike<number>))
  }
  return new Float32Array(Array.from(data as ArrayLike<number>))
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  color: string,
  shape: ShapeType,
  position: string,
  size = IMG_SIZE
) {
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, size, size)

  const margin = 6
  const h = size - 2 * margin
  const w = size - 2 * margin

  let x0: number
  let x1: number
  if (position.includes('left')) {
    x0 = margin
    x1 = margin + Math.floor(w / 2)
  } else if (position.includes('right')) {
    x0 = margin + Math.floor(w / 2)
    x1 = size - margin
  } else {
    x0 = margin + Math.floor(w / 4)
    x1 = margin + Math.floor((3 * w) / 4)
  }

  let y0: number
  let y1: number
  if (position.includes('top')) {
    y0 = margin
    y1 = margin + Math.floor(h / 2)
  } else if (position.includes('bottom')) {
    y0 = margin + Math.floor(h / 2)
    y1 = size - margin
  } else {
    y0 = margin + Math.floor(h / 4)
    y1 = margin + Math.floor((3 * h) / 4)
  }

  ctx.fillStyle = color
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 1

  if (shape === 'square') {
    ctx.beginPath()
    ctx.rect(x0, y0, x1 - x0, y1 - y0)
    ctx.fill()
    ctx.stroke()
    return
  }

  if (shape === 'circle') {
    ctx.beginPath()
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const rx = (x1 - x0) / 2
    const ry = (y1 - y0) / 2
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    return
  }

  ctx.beginPath()
  ctx.moveTo((x0 + x1) / 2, y0)
  ctx.lineTo(x0, y1)
  ctx.lineTo(x1, y1)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function canvasToCHWFloat(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Float32Array(3 * IMG_SIZE * IMG_SIZE)

  const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE)
  const { data } = imageData
  const out = new Float32Array(3 * IMG_SIZE * IMG_SIZE)

  for (let y = 0; y < IMG_SIZE; y += 1) {
    for (let x = 0; x < IMG_SIZE; x += 1) {
      const pixelIdx = (y * IMG_SIZE + x) * 4
      const r = data[pixelIdx] / 255
      const g = data[pixelIdx + 1] / 255
      const b = data[pixelIdx + 2] / 255

      const hwIndex = y * IMG_SIZE + x
      out[hwIndex] = r
      out[IMG_SIZE * IMG_SIZE + hwIndex] = g
      out[2 * IMG_SIZE * IMG_SIZE + hwIndex] = b
    }
  }

  return out
}

function getTensorByName(outputs: ort.InferenceSession.OnnxValueMapType, preferredName: string) {
  return outputs[preferredName] ?? Object.values(outputs)[0]
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  ])
}

function NanoVlm() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageSessionRef = useRef<ort.InferenceSession | null>(null)
  const textSessionRef = useRef<ort.InferenceSession | null>(null)

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [bankStatus, setBankStatus] = useState<'idle' | 'indexing' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabKey>('search')

  const [color, setColor] = useState('red')
  const [shape, setShape] = useState<ShapeType>('square')
  const [position, setPosition] = useState('left')

  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [topK, setTopK] = useState(3)
  const [results, setResults] = useState<SearchResult[]>([])

  const [bank, setBank] = useState<BankItem[]>([])
  const [vocab, setVocab] = useState<VocabPayload | null>(null)
  const [config, setConfig] = useState<ConfigPayload | null>(null)
  const [embeddingSpace, setEmbeddingSpace] = useState<EmbeddingPointPayload | null>(null)

  const metrics = useMemo(() => config?.metrics ?? {}, [config])

  const renderSyntheticPreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawShape(ctx, color, shape, position)
  }, [color, shape, position])

  const runImageEncoder = useCallback(async (chwData: Float32Array) => {
    const imageSession = imageSessionRef.current
    if (!imageSession) return null

    const inputName = imageSession.inputNames[0] ?? 'image'
    const input = new ort.Tensor('float32', chwData, [1, 3, IMG_SIZE, IMG_SIZE])
    const outputs = await imageSession.run({ [inputName]: input })
    const outTensor = getTensorByName(outputs, 'image_embedding')
    if (!outTensor) return null

    return l2Normalize(parseVector(outTensor.data))
  }, [])

  const runTextEncoder = useCallback(
    async (tokens: number[]) => {
      const textSession = textSessionRef.current
      if (!textSession) return null
      const inputName = textSession.inputNames[0] ?? 'tokens'

      try {
        const data = BigInt64Array.from(tokens.map((t) => BigInt(t)))
        const input = new ort.Tensor('int64', data, [1, tokens.length])
        const outputs = await textSession.run({ [inputName]: input })
        const outTensor = getTensorByName(outputs, 'text_embedding')
        if (!outTensor) return null
        return l2Normalize(parseVector(outTensor.data))
      } catch {
        const data = Int32Array.from(tokens)
        const input = new ort.Tensor('int32', data, [1, tokens.length])
        const outputs = await textSession.run({ [inputName]: input })
        const outTensor = getTensorByName(outputs, 'text_embedding')
        if (!outTensor) return null
        return l2Normalize(parseVector(outTensor.data))
      }
    },
    []
  )

  const buildSyntheticBank = useCallback(async () => {
    const localCanvas = document.createElement('canvas')
    localCanvas.width = IMG_SIZE
    localCanvas.height = IMG_SIZE
    const ctx = localCanvas.getContext('2d')
    if (!ctx) return [] as BankItem[]

    const items: BankItem[] = []
    for (const c of COLORS) {
      for (const s of SHAPES) {
        for (const p of POSITIONS) {
          drawShape(ctx, c, s, p)
          const tensor = canvasToCHWFloat(localCanvas)
          const embedding = await runImageEncoder(tensor)
          if (!embedding) continue

          items.push({
            caption: `${c} ${s} ${p}`,
            embedding,
            dataUrl: localCanvas.toDataURL('image/png')
          })
        }
      }
    }

    return items
  }, [runImageEncoder])

  const runSearch = useCallback(async () => {
    if (status !== 'ready') return

    const tokens = encodeCaptionToTokens(query, vocab)
    if (!tokens) {
      setErrorMessage('Query must be: "color shape position" using known words from vocab.')
      return
    }

    if (!bank.length) {
      setErrorMessage('Image bank is not ready yet.')
      return
    }

    setErrorMessage('')
    const textEmbedding = await runTextEncoder(tokens)
    if (!textEmbedding) {
      setErrorMessage('Failed to encode text query.')
      return
    }

    const scored = rankSearchResults(textEmbedding, bank, topK)

    setResults(scored)
  }, [bank, query, runTextEncoder, status, topK, vocab])

  useEffect(() => {
    renderSyntheticPreview()
  }, [renderSyntheticPreview])

  useEffect(() => {
    const load = async () => {
      try {
        ort.env.logLevel = 'error'
        ort.env.wasm.wasmPaths = '/ort/'
        ort.env.wasm.numThreads = 1
        ort.env.wasm.simd = true
        ort.env.wasm.proxy = false

        const [imageSession, textSession, vocabResponse, configResponse] =
          await Promise.all([
            withTimeout(
              ort.InferenceSession.create('/models/nanovlm/nanovlm-image-encoder.onnx', {
                executionProviders: ['wasm']
              }),
              20000,
              'image encoder session creation'
            ),
            withTimeout(
              ort.InferenceSession.create('/models/nanovlm/nanovlm-text-encoder.onnx', {
                executionProviders: ['wasm']
              }),
              20000,
              'text encoder session creation'
            ),
            withTimeout(fetch('/models/nanovlm/nanovlm-vocab.json'), 8000, 'vocab fetch'),
            withTimeout(fetch('/models/nanovlm/nanovlm-config.json'), 8000, 'config fetch')
          ])

        if (!vocabResponse.ok) {
          throw new Error(`vocab fetch failed with status ${vocabResponse.status}`)
        }
        if (!configResponse.ok) {
          throw new Error(`config fetch failed with status ${configResponse.status}`)
        }

        imageSessionRef.current = imageSession
        textSessionRef.current = textSession

        const vocabJson = (await vocabResponse.json()) as VocabPayload
        const configJson = configResponse.ok
          ? ((await configResponse.json()) as ConfigPayload)
          : ({ img_size: IMG_SIZE, embed_dim: EMBED_DIM } as ConfigPayload)

        setVocab(vocabJson)
        setConfig(configJson)

        setStatus('ready')

        withTimeout(fetch('/models/nanovlm/nanovlm-embeddings-2d.json'), 5000, 'embeddings fetch')
          .then(async (response) => {
            if (!response.ok) return null
            return (await response.json()) as EmbeddingPointPayload
          })
          .then((payload) => {
            if (payload) setEmbeddingSpace(payload)
          })
          .catch(() => null)

        setBankStatus('indexing')
        buildSyntheticBank()
          .then((generatedBank) => {
            setBank(generatedBank)
            setBankStatus('ready')
          })
          .catch((error) => {
            console.error(error)
            setBankStatus('error')
            const details = error instanceof Error ? error.message : String(error)
            setErrorMessage(`Bank indexing failed: ${details}`)
          })
      } catch (error) {
        console.error(error)
        setStatus('error')
        const details = error instanceof Error ? error.message : String(error)
        setErrorMessage(`Failed to load ONNX model artifacts: ${details}`)
      }
    }

    load()
  }, [buildSyntheticBank])

  const syntheticCaption = `${color} ${shape} ${position}`

  const embeddingPoints = useMemo(() => {
    if (!embeddingSpace?.before?.length && !embeddingSpace?.after?.length) return [] as Array<{
      x: number
      y: number
      label: string
      stage: 'before' | 'after'
    }>

    const before = (embeddingSpace.before ?? []).map((point, idx) => ({
      x: point[0] ?? 0,
      y: point[1] ?? 0,
      label: embeddingSpace.captions?.[idx] ?? `sample-${idx}`,
      stage: 'before' as const
    }))

    const after = (embeddingSpace.after ?? []).map((point, idx) => ({
      x: point[0] ?? 0,
      y: point[1] ?? 0,
      label: embeddingSpace.captions?.[idx] ?? `sample-${idx}`,
      stage: 'after' as const
    }))

    return [...before, ...after]
  }, [embeddingSpace])

  const xValues = embeddingPoints.map((p) => p.x)
  const yValues = embeddingPoints.map((p) => p.y)
  const minX = Math.min(...xValues, -1)
  const maxX = Math.max(...xValues, 1)
  const minY = Math.min(...yValues, -1)
  const maxY = Math.max(...yValues, 1)

  const jitterFromIndex = (idx: number, amount: number) => {
    // Deterministic jitter keeps overlap visible without changing data semantics.
    const x = Math.sin((idx + 1) * 12.9898) * 43758.5453
    const y = Math.sin((idx + 1) * 78.233) * 12345.6789
    const jx = (x - Math.floor(x) - 0.5) * amount
    const jy = (y - Math.floor(y) - 0.5) * amount
    return { jx, jy }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6">
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-[0_45px_100px_-80px_rgba(2,6,23,0.55)] backdrop-blur">
        <div className="border-b border-black/10 bg-gradient-to-r from-amber-50 via-white to-teal-50 px-5 py-4 md:px-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-neutral-500">NanoVLM</div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">
            Text ↔ Image Retrieval Playground
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Synthetic shape world with ONNX encoders running fully in the browser.
          </p>
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
            This demo predicts the closest caption for an image using similarity search, not image generation. Try
            creating one on the left and run caption search.
          </p>
        </div>

        <div className="border-b border-black/10 px-5 py-3 md:px-6">
          <div className="inline-flex rounded-full border border-black/10 bg-white p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`rounded-full px-3 py-1.5 transition ${
                activeTab === 'search' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('embedding')}
              className={`rounded-full px-3 py-1.5 transition ${
                activeTab === 'embedding' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Embedding Space
            </button>
          </div>
        </div>

        {activeTab === 'search' ? (
          <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[1.05fr_1fr] md:p-6">
            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Left Panel</h3>
                <div className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                  Synthetic
                </div>
              </div>

              <div className="mt-4 flex items-start gap-4">
                <canvas
                  ref={previewCanvasRef}
                  width={IMG_SIZE}
                  height={IMG_SIZE}
                  className="h-48 w-48 rounded-xl border border-black/10 bg-white object-contain"
                />
                <div className="grid flex-1 gap-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Color</label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="h-10 rounded-lg border-black/15 bg-white text-sm text-black">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-500">Shape</label>
                  <Select value={shape} onValueChange={(value) => setShape(value as ShapeType)}>
                    <SelectTrigger className="h-10 rounded-lg border-black/15 bg-white text-sm text-black">
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHAPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-500">Position</label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="h-10 rounded-lg border-black/15 bg-white text-sm text-black">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuery(syntheticCaption)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700"
                >
                  Use Caption in Query
                </button>
                <div className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
                  {syntheticCaption}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Right Panel</h3>

              <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-neutral-500">Text query</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-2 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black placeholder:text-neutral-500"
                placeholder="red square left"
              />

              <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-neutral-500">Top-k: {topK}</label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="mt-2 w-full"
              />

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    runSearch().catch(() => setErrorMessage('Text-to-image search failed.'))
                  }}
                  disabled={status !== 'ready'}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
                >
                  Search
                </button>
                <span className="text-xs text-neutral-500">
                  {status === 'loading' && 'Loading models...'}
                  {status === 'ready' && bankStatus === 'indexing' && 'Models ready. Indexing synthetic bank...'}
                  {status === 'ready' && bankStatus === 'ready' && `Ready. Bank size: ${bank.length}`}
                  {status === 'ready' && bankStatus === 'error' && 'Models ready, but bank indexing failed.'}
                  {status === 'error' && 'Failed to load artifacts.'}
                </span>
              </div>

              {errorMessage ? <div className="mt-4 text-xs text-red-600">{errorMessage}</div> : null}

              <div className="mt-5 grid gap-3">
                {results.map((item) => {
                  const pct = Math.max(0, Math.min(100, Math.round(((item.score + 1) / 2) * 100)))
                  return (
                    <div key={`${item.caption}-${item.score}`} className="rounded-xl border border-black/10 p-3">
                      <div className="flex gap-3">
                        <NextImage
                          src={item.dataUrl}
                          alt={item.caption}
                          width={64}
                          height={64}
                          unoptimized
                          className="h-16 w-16 rounded-lg border border-black/10 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-neutral-900">{item.caption}</div>
                          <div className="mt-1 text-xs text-neutral-500">cosine: {item.score.toFixed(3)}</div>
                          <div className="mt-2 h-2 rounded-full bg-neutral-100">
                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="p-5 md:p-6">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Embedding Space (2D)</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Orange points are embeddings before training and blue points are after training. A tight orange
                cluster and more separated blue points indicate the model learned a more discriminative representation.
              </p>
              {embeddingPoints.length ? (
                <div className="mt-4 overflow-auto rounded-xl border border-black/10 bg-neutral-50 p-3">
                  <svg viewBox="0 0 640 420" className="h-[380px] w-full">
                    <rect x="0" y="0" width="640" height="420" fill="#f8fafc" />
                    {embeddingPoints.map((point, idx) => {
                      const nx = (point.x - minX) / (maxX - minX || 1)
                      const ny = (point.y - minY) / (maxY - minY || 1)
                      const cx = 30 + nx * 580
                      const cy = 390 - ny * 360
                      const jitter = point.stage === 'before' ? jitterFromIndex(idx, 4.5) : { jx: 0, jy: 0 }

                      return (
                        <circle
                          key={`${point.stage}-${idx}`}
                          cx={cx + jitter.jx}
                          cy={cy + jitter.jy}
                          r={point.stage === 'before' ? 4.5 : 3}
                          fill={point.stage === 'before' ? '#f97316' : '#0ea5e9'}
                          opacity={point.stage === 'before' ? 0.95 : 0.8}
                        />
                      )
                    })}
                  </svg>
                  <div className="mt-2 flex gap-3 text-xs text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-400" /> before
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-sky-500" /> after
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-black/15 bg-neutral-50 p-4 text-sm text-neutral-600">
                  Add optional `public/models/nanovlm-embeddings-2d.json` with `before` and `after` point arrays to render this chart.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-black/10 bg-neutral-50 px-5 py-3 md:px-6">
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-600">
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1">
              embed_dim {config?.embed_dim ?? EMBED_DIM}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1">
              heads {config?.attention_heads ?? 4}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1">
              R@1 i2t {((metrics['R@1 i2t'] ?? 0) * 100).toFixed(1)}%
            </span>
            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1">
              R@5 i2t {((metrics['R@5 i2t'] ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

NanoVlm.Layout = DefaultLayout
NanoVlm.Title = 'NanoVLM'
NanoVlm.Description =
  'Synthetic text-image retrieval playground with ONNX browser inference, top-k search, and optional embedding-space visualization.'
NanoVlm.Tags = ['ai', 'onnx', 'canvas', 'ui']
NanoVlm.Notebook = 'notebooks/NanoVLM.ipynb'

export default NanoVlm
