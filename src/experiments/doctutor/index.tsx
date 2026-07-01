'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ort from 'onnxruntime-web'
import { DefaultLayout } from '../../components/layouts/default-layout'
import { buildAnswer, makeDebugSteps, type ChatAnswer, type DebugStep } from './chat'
import { encodeQuestion, type VocabPayload } from './tokenizer'
import { rankChunks, toFloatVector, type LessonChunk, type RankedChunk } from './retrieval'

type ConfigPayload = {
  max_length: number
  d_model: number
  num_heads: number
  d_ff: number
  num_layers: number
  vocab_size: number
  model_task: string
  corpus: string
}

type EvalMethodMetrics = {
  lesson_recall_at_1: number
  lesson_recall_at_3: number
  chunk_recall_at_1: number
  chunk_recall_at_3: number
  lesson_mrr: number
  chunk_mrr: number
  avg_ms_per_query: number
}

type EvalReportPayload = {
  generated_at: string
  corpus: {
    lessons: number
    chunks: number
    vocab_size: number
    embedding_dim: number
    model_task: string
  }
  eval_set: {
    cases: number
    in_domain: number
    out_of_domain: number
  }
  methods: Record<string, EvalMethodMetrics>
  refusal: {
    precision: number
    recall: number
    in_domain_false_refusal_rate: number
  }
}

type Status = 'loading' | 'ready' | 'error'

const MODEL_BASE = '/models/doctutor'
const DEFAULT_QUESTION = 'Why do we divide attention scores by sqrt d_k?'
const EXAMPLE_QUESTIONS = [
  'How do token ids become vectors?',
  'Why do Transformers need positional encoding?',
  'What is multi-head attention?',
  'How is the FFN different from attention?',
  'Where does LayerNorm appear in the encoder block?'
]

function getTensorOutput(outputs: ort.InferenceSession.OnnxValueMapType) {
  return outputs.embedding ?? Object.values(outputs)[0]
}

function DocTutor() {
  const sessionRef = useRef<ort.InferenceSession | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [question, setQuestion] = useState(DEFAULT_QUESTION)
  const [vocab, setVocab] = useState<VocabPayload | null>(null)
  const [config, setConfig] = useState<ConfigPayload | null>(null)
  const [chunks, setChunks] = useState<LessonChunk[]>([])
  const [embeddings, setEmbeddings] = useState<Float32Array[]>([])
  const [answer, setAnswer] = useState<ChatAnswer | null>(null)
  const [ranked, setRanked] = useState<RankedChunk[]>([])
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([])
  const [evalReport, setEvalReport] = useState<EvalReportPayload | null>(null)

  const ready = status === 'ready' && vocab && config && chunks.length > 0 && embeddings.length > 0

  const corpusStats = useMemo(() => {
    const lessons = new Set(chunks.map((chunk) => chunk.lessonNumber)).size
    return `${lessons} lessons · ${chunks.length} chunks · ${config?.vocab_size ?? 0} vocab`
  }, [chunks, config])

  const evalStats = useMemo(() => {
    if (!evalReport) return null
    const tiny = evalReport.methods.tiny_encoder
    const hybrid = evalReport.methods.hybrid
    return {
      cases: `${evalReport.eval_set.cases} eval cases`,
      tinyLesson: tiny ? `${Math.round(tiny.lesson_recall_at_1 * 100)}% tiny R@1` : 'tiny R@1 pending',
      hybridLesson: hybrid ? `${Math.round(hybrid.lesson_recall_at_1 * 100)}% hybrid R@1` : 'hybrid R@1 pending',
      refusal: `${Math.round(evalReport.refusal.recall * 100)}% OOD refusal`
    }
  }, [evalReport])

  useEffect(() => {
    const load = async () => {
      try {
        ort.env.logLevel = 'error'
        ort.env.wasm.wasmPaths = '/ort/'
        ort.env.wasm.numThreads = 1
        ort.env.wasm.simd = true
        ort.env.wasm.proxy = false

        const [session, vocabResponse, configResponse, chunksResponse, embeddingsResponse, evalResponse] =
          await Promise.all([
            ort.InferenceSession.create(`${MODEL_BASE}/doctutor.onnx`, {
              executionProviders: ['wasm']
            }),
            fetch(`${MODEL_BASE}/vocab.json`),
            fetch(`${MODEL_BASE}/config.json`),
            fetch(`${MODEL_BASE}/chunks.json`),
            fetch(`${MODEL_BASE}/chunk_embeddings.json`),
            fetch(`${MODEL_BASE}/eval_report.json`)
          ])

        for (const [label, response] of [
          ['vocab', vocabResponse],
          ['config', configResponse],
          ['chunks', chunksResponse],
          ['chunk_embeddings', embeddingsResponse]
        ] as const) {
          if (!response.ok) throw new Error(`${label} fetch failed with status ${response.status}`)
        }

        sessionRef.current = session
        setVocab((await vocabResponse.json()) as VocabPayload)
        setConfig((await configResponse.json()) as ConfigPayload)
        setChunks((await chunksResponse.json()) as LessonChunk[])
        const rawEmbeddings = (await embeddingsResponse.json()) as number[][]
        setEmbeddings(rawEmbeddings.map((row) => new Float32Array(row)))
        if (evalResponse.ok) {
          setEvalReport((await evalResponse.json()) as EvalReportPayload)
        }
        setStatus('ready')
      } catch (error) {
        console.error(error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : String(error))
      }
    }

    load()
  }, [])

  const runQuestion = useCallback(async () => {
    const session = sessionRef.current
    if (!session || !vocab || !config) return

    const encoded = encodeQuestion(question, vocab, config.max_length)
    const inputIds = BigInt64Array.from(encoded.ids.map((id) => BigInt(id)))
    const attentionMask = new Float32Array(encoded.attentionMask)

    const outputs = await session.run({
      input_ids: new ort.Tensor('int64', inputIds, [1, config.max_length]),
      attention_mask: new ort.Tensor('float32', attentionMask, [1, config.max_length])
    })

    const outputTensor = getTensorOutput(outputs)
    if (!outputTensor) throw new Error('ONNX model did not return an embedding tensor')

    const queryVector = toFloatVector(outputTensor.data)
    const nextRanked = rankChunks(queryVector, chunks, embeddings, 5)
    const nextAnswer = buildAnswer(encoded, nextRanked)
    const nextDebug = makeDebugSteps({
      question,
      encoded,
      dModel: config.d_model,
      maxLength: config.max_length,
      numLayers: config.num_layers,
      numHeads: config.num_heads,
      dFf: config.d_ff,
      queryVector,
      ranked: nextRanked,
      answer: nextAnswer
    })

    setRanked(nextRanked)
    setAnswer(nextAnswer)
    setDebugSteps(nextDebug)
  }, [chunks, config, embeddings, question, vocab])

  useEffect(() => {
    if (!ready || answer) return
    runQuestion().catch((error) => {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : String(error))
    })
  }, [answer, ready, runQuestion])

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 py-7 text-neutral-950 md:px-5">
      <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-[0_34px_90px_-76px_rgba(15,23,42,0.8)]">
        <header className="border-b border-black/10 bg-neutral-950 px-5 py-5 text-white md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                DocTutor
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Transformer lesson assistant
              </h2>
              <p className="mt-2 max-w-[760px] text-sm leading-6 text-neutral-300">
                A tiny encoder retrieves and cites the eight TensorTonic Transformer lessons. It is a grounded
                retrieval chatbot, not a generative LLM.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">
              <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Browser model</div>
              <div className="mt-1 font-medium">{status === 'ready' ? corpusStats : 'Loading ONNX artifacts'}</div>
              {evalStats ? (
                <div className="mt-1 text-xs leading-5 text-neutral-400">
                  {evalStats.cases} · {evalStats.hybridLesson} · {evalStats.refusal}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="border-b border-black/10 p-5 lg:border-b-0 lg:border-r md:p-6">
            <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Ask the lesson corpus
            </label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="mt-3 min-h-28 w-full resize-none rounded-xl border border-black/15 bg-white px-3 py-3 text-sm leading-6 text-neutral-950 outline-none transition focus:border-neutral-900"
            />

            <div className="mt-4 flex flex-wrap items-start gap-2">
              <button
                type="button"
                disabled={!ready}
                onClick={() => {
                  runQuestion().catch((error) => {
                    console.error(error)
                    setErrorMessage(error instanceof Error ? error.message : String(error))
                  })
                }}
                className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ask
              </button>
              <span className="min-w-0 basis-full max-w-[calc(100vw-6rem)] text-xs leading-5 text-neutral-500 sm:basis-auto sm:max-w-full">
                {status === 'loading' && 'Loading model, vocab, chunks, and embeddings...'}
                {status === 'ready' && 'Ready. Inference runs in the browser via ONNX Runtime Web.'}
                {status === 'error' && 'Failed to load DocTutor artifacts.'}
              </span>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  className="w-full max-w-[calc(100vw-6rem)] whitespace-normal break-words rounded-2xl border border-black/10 bg-neutral-50 px-3 py-1.5 text-left text-xs leading-5 text-neutral-700 transition hover:border-black/20 hover:bg-white sm:w-auto sm:max-w-full sm:rounded-full"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-black/10 bg-neutral-50 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Answer</div>
              <p className="mt-3 text-sm leading-6 text-neutral-800">
                {answer?.answer ?? 'Ask a question to retrieve a cited answer from the eight lessons.'}
              </p>
              {answer ? (
                <div className="mt-3 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs leading-5 text-neutral-600">
                  {answer.citation}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-2">
              {ranked.slice(0, 3).map((chunk) => (
                <div key={chunk.id} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Lesson {chunk.lessonNumber}
                    </div>
                    <div className="text-xs tabular-nums text-neutral-500">{chunk.score.toFixed(3)}</div>
                  </div>
                  <div className="mt-1 text-sm font-medium text-neutral-900">{chunk.lessonTitle}</div>
                  <div className="mt-1 text-xs text-neutral-500">{chunk.heading}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-neutral-50 p-5 md:p-6">
            {evalReport ? (
              <div className="mb-5 rounded-xl border border-black/10 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Evaluation
                    </div>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      Baselines, learned retrieval, hybrid ranking, and refusal checks over the lesson corpus.
                    </p>
                  </div>
                  <div className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
                    {evalReport.eval_set.in_domain} retrieval · {evalReport.eval_set.out_of_domain} refusal
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ['Tiny encoder R@1', evalReport.methods.tiny_encoder?.lesson_recall_at_1],
                    ['Hybrid R@1', evalReport.methods.hybrid?.lesson_recall_at_1],
                    ['OOD refusal', evalReport.refusal.recall],
                    ['False refusal', evalReport.refusal.in_domain_false_refusal_rate]
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        {label}
                      </div>
                      <div className="mt-1 text-xl font-semibold tabular-nums text-neutral-950">
                        {typeof value === 'number' ? `${Math.round(value * 100)}%` : '--'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-black/10">
                  {['lexical', 'tfidf', 'tiny_encoder', 'hybrid'].map((method) => {
                    const metrics = evalReport.methods[method]
                    if (!metrics) return null
                    return (
                      <div
                        key={method}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-black/10 bg-white px-3 py-2 text-xs last:border-b-0"
                      >
                        <div className="font-medium text-neutral-800">{method.replace('_', ' ')}</div>
                        <div className="tabular-nums text-neutral-500">
                          L@1 {Math.round(metrics.lesson_recall_at_1 * 100)}%
                        </div>
                        <div className="tabular-nums text-neutral-500">
                          C@3 {Math.round(metrics.chunk_recall_at_3 * 100)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Debug trace
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  The same teaching pipeline students see in the terminal.
                </p>
              </div>
              <div className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-neutral-600">
                {config ? `${config.num_layers}L · ${config.num_heads}H · d=${config.d_model}` : 'small encoder'}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {(debugSteps.length ? debugSteps : [
                { label: 'User question', detail: 'Waiting for model load...' },
                { label: 'tokenizer', detail: 'Token IDs will appear here.' },
                { label: 'embedding layer', detail: 'Embedding shape and scaling will appear here.' },
                { label: 'positional encoding', detail: 'Sinusoidal position details will appear here.' },
                { label: 'transformer encoder block(s)', detail: 'Attention + FFN + residual + LayerNorm.' },
                { label: 'pooled query vector', detail: 'Vector sample will appear here.' },
                { label: 'compare against lesson chunk vectors', detail: 'Cosine scores will appear here.' },
                { label: 'retrieve best chunks', detail: 'Top citations will appear here.' },
                { label: 'show short answer + citation', detail: 'Grounded answer will appear here.' }
              ]).map((step, index) => (
                <div key={`${step.label}-${index}`} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      {step.label}
                    </div>
                  </div>
                  <p className="mt-2 break-words font-mono text-[12px] leading-5 text-neutral-700">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

DocTutor.Layout = DefaultLayout
DocTutor.Title = 'DocTutor'
DocTutor.Description =
  'A tiny Transformer encoder retrieval chatbot over the eight TensorTonic lessons, exported to ONNX for browser inference with citations, eval baselines, refusal checks, and a visible debug trace.'
DocTutor.Tags = ['ai', 'onnx', 'transformer', 'ui']
DocTutor.Notebook = 'notebooks/doctutor.ipynb'

export default DocTutor
