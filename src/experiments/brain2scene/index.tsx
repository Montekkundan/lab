'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Target,
  XCircle
} from 'lucide-react'

type RetrievalAlternative = {
  clip_id: string | null
  caption: string
  score: number
}

type DemoItem = {
  clip_id: string
  actual_caption: string
  decoded_caption: string
  score: number
  alternatives: RetrievalAlternative[]
  split?: string
  thumbnail?: string | null
  video?: string | null
}

type DemoManifest = {
  schema: string
  metadata: {
    source?: string
    feature_names?: string[]
    retrieval_top1?: number
    retrieval_topk?: number
    top_k?: number
    n_test?: number
    n_voxels?: number
  }
  items: DemoItem[]
}

type Mode = 'hits' | 'all' | 'misses'

const manifestUrl = '/experiments/brain2scene/brain2scene-demo.json'
const expectedSchema = 'brain2scene.lab-demo.v1'
const showcaseClipIds = [
  'test_test_tr0043',
  'test_test_tr0021',
  'test_test_tr0100',
  'test_test_tr0016',
  'test_test_tr0185',
  'test_test_tr0216',
  'test_test_tr0039',
  'test_test_tr0195'
]

function normalizeCaption(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function formatPercent(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`
}

function formatScore(value?: number) {
  return Math.round((value ?? 0) * 100)
}

function formatCount(value?: number) {
  return (value ?? 0).toLocaleString('en-US')
}

function statusFor(item: DemoItem | null) {
  if (!item) {
    return { label: 'Loading', tone: 'neutral' as const, rank: -1 }
  }

  const rank = item.alternatives.findIndex((candidate) => candidate.clip_id === item.clip_id)
  const sameCaption = normalizeCaption(item.actual_caption) === normalizeCaption(item.decoded_caption)

  if (rank === 0) return { label: 'Exact clip', tone: 'hit' as const, rank }
  if (sameCaption) return { label: 'Same gist', tone: 'hit' as const, rank }
  if (rank > 0) return { label: `Top-${rank + 1}`, tone: 'near' as const, rank }
  return { label: 'Miss', tone: 'miss' as const, rank }
}

function isValidManifest(value: unknown): value is DemoManifest {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<DemoManifest>
  if (candidate.schema !== expectedSchema || !candidate.metadata || !Array.isArray(candidate.items)) {
    return false
  }

  return candidate.items.every(
    (item) =>
      item &&
      typeof item.clip_id === 'string' &&
      typeof item.actual_caption === 'string' &&
      typeof item.decoded_caption === 'string' &&
      typeof item.score === 'number' &&
      Array.isArray(item.alternatives)
  )
}

function buildTrace(seed: string, score: number) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 29 + seed.charCodeAt(index)) % 997
  }

  return Array.from({ length: 38 }, (_, index) => {
    const wave = Math.sin((index + hash * 0.05) * 0.82)
    const fast = Math.sin((index + hash * 0.07) * 2.1)
    return 24 + (wave * 0.5 + fast * 0.5) * 12 * Math.max(0.4, score)
  })
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
      {children}
    </div>
  )
}

function MiniTrace({ item }: { item: DemoItem | null }) {
  const trace = useMemo(
    () => buildTrace(item?.clip_id ?? 'loading', item?.score ?? 0.3),
    [item]
  )
  const points = trace
    .map((value, index) => `${(index / (trace.length - 1)) * 180},${48 - value}`)
    .join(' ')

  return (
    <svg viewBox="0 0 180 56" className="h-10 w-28 overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="#0f766e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
    </svg>
  )
}

function CandidateList({
  item,
  byClipId
}: {
  item: DemoItem | null
  byClipId: Map<string, DemoItem>
}) {
  const status = statusFor(item)
  const alternatives = item?.alternatives.slice(0, 5) ?? []

  return (
    <section className="min-h-0 min-w-0 rounded-2xl border border-white/10 bg-neutral-950/80 p-3 text-neutral-100 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
            <Target size={16} />
            Top-{alternatives.length || 5} retrieval
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">Nearest caption candidates.</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status.tone === 'miss'
              ? 'bg-rose-500/15 text-rose-200'
              : status.tone === 'near'
                ? 'bg-amber-400/15 text-amber-200'
                : 'bg-emerald-400/15 text-emerald-200'
          }`}
        >
          {status.label}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {alternatives.map((alternative, alternativeIndex) => {
          const candidate = alternative.clip_id ? byClipId.get(alternative.clip_id) : null
          const isTop = alternativeIndex === 0
          const isActual = alternative.clip_id === item?.clip_id
          const tone = isActual
            ? 'border-emerald-400/60 bg-emerald-400/10'
            : 'border-white/10 bg-white/[0.035]'

          return (
            <div
              key={`${alternative.clip_id ?? alternative.caption}-${alternativeIndex}`}
              className={`grid grid-cols-[28px_52px_minmax(0,1fr)_42px] items-center gap-2 rounded-xl border p-2 transition ${tone}`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold ${
                  isTop ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-100' : 'border-white/10 text-neutral-400'
                }`}
              >
                {alternativeIndex + 1}
              </div>
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-900">
                {candidate?.thumbnail ? (
                  <Image src={candidate.thumbnail} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div
                  className="overflow-hidden text-sm font-medium leading-snug text-neutral-100"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {alternative.caption}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                  {isActual ? <CheckCircle2 size={13} /> : isTop ? <BarChart3 size={13} /> : null}
                  {isActual ? 'actual' : isTop ? 'top pick' : 'candidate'}
                </div>
              </div>
              <div className="text-right font-mono text-xs text-neutral-400">
                {formatScore(alternative.score)}%
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HiddenMovie({
  item,
  revealed,
  setRevealed
}: {
  item: DemoItem | null
  revealed: boolean
  setRevealed: (value: boolean) => void
}) {
  const status = statusFor(item)

  return (
    <section className="min-h-0 min-w-0 rounded-2xl border border-white/10 bg-neutral-950/80 p-3 text-neutral-100 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
            <Lock size={16} />
            Hidden clip
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">Held-out shortclip.</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status.tone === 'miss'
              ? 'bg-rose-500/15 text-rose-200'
              : status.tone === 'near'
                ? 'bg-amber-400/15 text-amber-200'
                : 'bg-emerald-400/15 text-emerald-200'
          }`}
        >
          {status.label}
        </span>
      </div>

      <div className="relative mx-auto mt-3 aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl bg-black">
        {item?.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, calc(100vw - 4rem)"
            className={`object-cover transition duration-500 ${
              revealed ? 'blur-0 scale-100 saturate-100' : 'blur-md scale-105 brightness-75 saturate-50'
            }`}
            priority
          />
        ) : null}
        {!revealed ? (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(135deg,rgba(0,0,0,0.38),rgba(0,0,0,0.12))] bg-[size:18px_18px,18px_18px,100%_100%]" />
        ) : null}
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="absolute bottom-3 left-3 inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100"
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          {revealed ? 'Hide actual' : 'Reveal actual'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <div>
          <Caption>decoder answer</Caption>
          <div className="mt-1 text-lg font-semibold leading-tight text-neutral-100">
            {item?.decoded_caption ?? 'loading retrieval'}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            status.tone === 'miss' ? 'bg-rose-500/15 text-rose-200' : 'bg-emerald-400/15 text-emerald-200'
          }`}
        >
          {status.tone === 'miss' ? <XCircle size={22} /> : <CheckCircle2 size={22} />}
        </div>
      </div>

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <Caption>actual caption</Caption>
        <div className="mt-1 text-base font-semibold leading-snug text-neutral-100">
          {revealed ? item?.actual_caption : 'Hidden until reveal'}
        </div>
      </div>
    </section>
  )
}

function Brain2SceneExperiment() {
  const [manifest, setManifest] = useState<DemoManifest | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('hits')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${manifestUrl}`)
        return response.json()
      })
      .then((data: unknown) => {
        if (!isValidManifest(data)) {
          throw new Error(`Invalid ${expectedSchema} manifest`)
        }
        if (!cancelled) {
          setManifest(data)
          setLoadError(null)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load demo manifest')
          setManifest(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => manifest?.items ?? [], [manifest])
  const byClipId = useMemo(() => new Map(items.map((item) => [item.clip_id, item])), [items])
  const bestItems = useMemo(() => {
    const curated = showcaseClipIds
      .map((clipId) => byClipId.get(clipId))
      .filter((item): item is DemoItem => Boolean(item))

    if (curated.length >= 4) return curated

    return items
      .filter((item) => statusFor(item).tone === 'hit')
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
  }, [byClipId, items])
  const missItems = useMemo(() => items.filter((item) => statusFor(item).tone === 'miss'), [items])
  const activeItems = mode === 'hits' ? bestItems : mode === 'misses' ? missItems : items
  const item = activeItems[index % Math.max(1, activeItems.length)] ?? null
  const metadata = manifest?.metadata ?? {}
  const status = statusFor(item)
  const isLoading = !manifest && !loadError
  const featureNames = metadata.feature_names ?? ['motion_energy', 'videomae_tr_windows']
  const sourceLabel = metadata.source ?? 'brain2scene likelihood decoder'
  const sampleCount = metadata.n_test ?? items.length
  const voxelCount = metadata.n_voxels
  const topK = metadata.top_k ?? 5

  const counts = useMemo(
    () =>
      items.reduce(
        (result, current) => {
          const currentStatus = statusFor(current)
          if (currentStatus.tone === 'miss') result.miss += 1
          else if (currentStatus.tone === 'near') result.near += 1
          else result.hit += 1
          return result
        },
        { hit: 0, near: 0, miss: 0 }
      ),
    [items]
  )

  const move = (direction: -1 | 1) => {
    if (!activeItems.length) return
    setIndex((current) => (current + direction + activeItems.length) % activeItems.length)
    setRevealed(false)
  }

  const setActiveMode = (nextMode: Mode) => {
    setMode(nextMode)
    setIndex(0)
    setRevealed(false)
  }

  return (
    <div className="w-full text-neutral-100">
      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/75 shadow-[0_45px_120px_-80px_rgba(0,0,0,1)] backdrop-blur">
        <header className="grid min-w-0 gap-3 border-b border-white/10 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Brain2Scene
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-neutral-50 md:text-3xl">
              fMRI → scene retrieval
            </h1>
            <p className="mt-0.5 max-w-2xl break-words text-sm leading-5 text-neutral-400">
              Static S01 shortclips semantic retrieval from held-out fMRI.
            </p>
            <div className="mt-2 hidden flex-wrap gap-2 text-[11px] font-medium text-neutral-500 md:flex">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {sourceLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {featureNames.join(' + ')}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                no live model call
              </span>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 text-sm min-[620px]:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
              <Caption>Top-1</Caption>
              <div className="mt-1 text-xl font-semibold text-neutral-50">{formatPercent(metadata.retrieval_top1)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
              <Caption>Top-{topK}</Caption>
              <div className="mt-1 text-xl font-semibold text-neutral-50">{formatPercent(metadata.retrieval_topk)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
              <Caption>Clips</Caption>
              <div className="mt-1 text-xl font-semibold text-neutral-50">{formatCount(sampleCount || items.length)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
              <Caption>Voxels</Caption>
              <div className="mt-1 text-xl font-semibold text-neutral-50">{voxelCount ? formatCount(voxelCount) : '-'}</div>
            </div>
          </div>
        </header>

        {loadError ? (
          <section className="border-b border-white/10 bg-rose-950/60 p-5 text-rose-100">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <XCircle size={20} />
              Demo data unavailable
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              The static Brain2Scene manifest did not pass the runtime check. Run{' '}
              <code className="border border-rose-300/30 bg-black/30 px-1.5 py-0.5">bun run validate:brain2scene</code>{' '}
              and verify {manifestUrl}.
            </p>
            <p className="mt-2 font-mono text-xs text-rose-200">{loadError}</p>
          </section>
        ) : isLoading ? (
          <section className="grid gap-4 p-3 lg:grid-cols-2">
            {[0, 1, 2].map((placeholder) => (
              <div key={placeholder} className="min-h-[220px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
            ))}
          </section>
        ) : (
          <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0">
              <HiddenMovie item={item} revealed={revealed} setRevealed={setRevealed} />
            </div>
            <CandidateList item={item} byClipId={byClipId} />
          </div>
        )}

        {!loadError && !isLoading ? (
          <footer className="grid gap-3 border-t border-white/10 bg-black/65 p-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="inline-flex w-full rounded-full border border-white/10 bg-white/[0.035] p-1 text-xs font-medium sm:w-auto">
              {(['hits', 'all', 'misses'] as const).map((nextMode) => {
                const label = nextMode === 'hits' ? 'Best' : nextMode === 'misses' ? 'Misses' : 'All'
                const count =
                  nextMode === 'hits' ? bestItems.length : nextMode === 'misses' ? counts.miss : items.length

                return (
                  <button
                    key={nextMode}
                    type="button"
                    onClick={() => setActiveMode(nextMode)}
                    className={`h-9 flex-1 rounded-full px-3 text-sm font-medium transition sm:flex-none ${
                      mode === nextMode
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:bg-white/10 hover:text-neutral-100'
                    }`}
                  >
                    {label} <span className="font-mono text-[11px] opacity-70">{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => move(-1)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-neutral-100 transition hover:bg-white/10"
                aria-label="Previous clip"
              >
                <ChevronLeft size={19} />
                <span className="hidden sm:inline">Previous clip</span>
              </button>
              <div className="min-w-[86px] text-center text-xs font-medium text-neutral-500 sm:min-w-[118px]">
                Clip {activeItems.length ? (index % activeItems.length) + 1 : 0} / {activeItems.length}
              </div>
              <button
                type="button"
                onClick={() => move(1)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-neutral-200"
                aria-label="Next clip"
              >
                <span className="hidden sm:inline">Next clip</span>
                <ChevronRight size={19} />
              </button>
            </div>

            <div className="flex justify-start lg:justify-end">
              <div className="grid w-full min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:min-w-[300px]">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    status.tone === 'miss' ? 'bg-rose-500/15 text-rose-200' : 'bg-emerald-400/15 text-emerald-200'
                  }`}
                >
                  {status.tone === 'miss' ? <XCircle size={19} /> : <CheckCircle2 size={19} />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-100">{status.label}</div>
                  <div className="text-xs text-neutral-500">
                    {counts.hit} hit / {counts.near} near / {counts.miss} miss
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MiniTrace item={item} />
                  <div className="font-mono text-sm text-neutral-400">{formatScore(item?.score)}%</div>
                </div>
              </div>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  )
}

Brain2SceneExperiment.Title = 'Brain2Scene'
Brain2SceneExperiment.Description =
  'An interactive semantic brain decoder demo using Gallant shortclips fMRI, voxelwise encoding models, and movie-caption retrieval.'
Brain2SceneExperiment.Tags = ['ai', 'neuro', 'fmri']
Brain2SceneExperiment.background = 'dots'

export default Brain2SceneExperiment
