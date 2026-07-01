import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

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
  thumbnail?: string | null
}

type DemoManifest = {
  schema: string
  metadata: {
    feature_names?: string[]
    retrieval_top1?: number
    retrieval_topk?: number
    top_k?: number
    n_test?: number
    n_voxels?: number
  }
  items: DemoItem[]
}

type DemoSummary = {
  feature_names?: string[]
  retrieval_top1?: number
  retrieval_topk?: number
  n_test?: number
  n_voxels?: number
  top_k?: number
}

const publicRoot = path.join(process.cwd(), 'public')
const demoRoot = path.join(publicRoot, 'experiments/brain2scene')
const manifestPath = path.join(demoRoot, 'brain2scene-demo.json')
const summaryPath = path.join(demoRoot, 'summary.json')
const componentPath = path.join(process.cwd(), 'src/experiments/brain2scene/index.tsx')
const expectedSchema = 'brain2scene.lab-demo.v1'
const expectedShowcaseClipIds = [
  'test_test_tr0043',
  'test_test_tr0021',
  'test_test_tr0100',
  'test_test_tr0016',
  'test_test_tr0185',
  'test_test_tr0216',
  'test_test_tr0039',
  'test_test_tr0195'
]

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function normalizeCaption(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

async function assertFileExists(filePath: string, label: string) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`${label} is missing: ${filePath}`)
  }
}

async function main() {
  const manifest = await readJson<DemoManifest>(manifestPath)
  const summary = await readJson<DemoSummary>(summaryPath)

  assert(manifest.schema === expectedSchema, `Expected schema ${expectedSchema}, got ${manifest.schema}`)
  assert(Array.isArray(manifest.items), 'Manifest items must be an array')
  assert(manifest.items.length > 0, 'Manifest must contain demo items')
  assert(summary.n_test === manifest.items.length, `summary.n_test (${summary.n_test}) must match item count (${manifest.items.length})`)
  assert(manifest.metadata.n_test === manifest.items.length, 'Manifest metadata.n_test must match item count')
  assert(manifest.metadata.n_voxels === summary.n_voxels, 'Manifest metadata.n_voxels must match summary')
  assert(manifest.metadata.top_k === summary.top_k, 'Manifest metadata.top_k must match summary')
  assert(manifest.metadata.retrieval_top1 === summary.retrieval_top1, 'Manifest top-1 must match summary')
  assert(manifest.metadata.retrieval_topk === summary.retrieval_topk, 'Manifest top-k must match summary')

  const seenClipIds = new Set<string>()
  let exact = 0
  let near = 0
  let miss = 0

  for (const [index, item] of manifest.items.entries()) {
    assert(typeof item.clip_id === 'string' && item.clip_id.length > 0, `Item ${index} is missing clip_id`)
    assert(!seenClipIds.has(item.clip_id), `Duplicate clip_id ${item.clip_id}`)
    seenClipIds.add(item.clip_id)

    assert(typeof item.actual_caption === 'string' && item.actual_caption.length > 0, `Item ${item.clip_id} is missing actual_caption`)
    assert(typeof item.decoded_caption === 'string' && item.decoded_caption.length > 0, `Item ${item.clip_id} is missing decoded_caption`)
    assert(typeof item.score === 'number' && Number.isFinite(item.score), `Item ${item.clip_id} has invalid score`)
    assert(Array.isArray(item.alternatives) && item.alternatives.length > 0, `Item ${item.clip_id} has no alternatives`)

    if (item.thumbnail) {
      assert(
        item.thumbnail.startsWith('/experiments/brain2scene/thumbnails/'),
        `Item ${item.clip_id} has unexpected thumbnail path ${item.thumbnail}`
      )
      await assertFileExists(path.join(publicRoot, item.thumbnail.slice(1)), `Thumbnail for ${item.clip_id}`)
    }

    const rank = item.alternatives.findIndex((candidate) => candidate.clip_id === item.clip_id)
    const sameCaption = normalizeCaption(item.actual_caption) === normalizeCaption(item.decoded_caption)
    if (rank === 0 || sameCaption) exact += 1
    else if (rank > 0) near += 1
    else miss += 1
  }

  for (const clipId of expectedShowcaseClipIds) {
    assert(seenClipIds.has(clipId), `Showcase clip ${clipId} is missing from the manifest`)
  }

  const componentSource = await readFile(componentPath, 'utf8')
  assert(!componentSource.includes('/Users/montekkundan/Developer/neuro/brain2scene'), 'Component must not reference the source repo path')

  console.log(
    `Brain2Scene demo OK: ${manifest.items.length} clips, ${exact} hits, ${near} near, ${miss} misses, ${summary.n_voxels} voxels`
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
