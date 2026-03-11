export const IMG_SIZE = 32
export const EMBED_DIM = 32
export const DEFAULT_QUERY = 'red square left'

export type VocabPayload = {
  vocab: string[]
  word2idx: Record<string, number>
}

export type SearchResult<TItem = { caption: string; dataUrl: string }> = TItem & {
  score: number
}

export function l2Normalize(vec: Float32Array) {
  let sum = 0
  for (let i = 0; i < vec.length; i += 1) sum += vec[i] * vec[i]
  const norm = Math.sqrt(sum) || 1
  const out = new Float32Array(vec.length)
  for (let i = 0; i < vec.length; i += 1) out[i] = vec[i] / norm
  return out
}

export function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i]
  return dot
}

export function encodeCaptionToTokens(text: string, vocab: VocabPayload | null) {
  if (!vocab) return null

  const cls = vocab.word2idx['[CLS]']
  if (cls == null) return null

  const parts = text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length !== 3) return null

  const tokenIds = [cls]
  for (const word of parts) {
    const idx = vocab.word2idx[word]
    if (idx == null) return null
    tokenIds.push(idx)
  }

  return tokenIds
}

export function rankSearchResults<TItem extends { caption: string; dataUrl: string; embedding: Float32Array }>(
  textEmbedding: Float32Array,
  bank: TItem[],
  topK: number
): SearchResult<Pick<TItem, 'caption' | 'dataUrl'>>[] {
  return bank
    .map((item) => ({
      caption: item.caption,
      dataUrl: item.dataUrl,
      score: cosine(textEmbedding, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
