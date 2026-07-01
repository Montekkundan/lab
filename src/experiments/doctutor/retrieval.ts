export type LessonChunk = {
  id: string
  lessonNumber: number
  lessonTitle: string
  sourceFile: string
  heading: string
  part: number
  text: string
  summary: string
}

export type RankedChunk = LessonChunk & {
  score: number
}

export function toFloatVector(data: unknown) {
  if (data instanceof Float32Array) return data
  if (data instanceof Float64Array || data instanceof Int32Array || data instanceof Uint8Array) {
    return new Float32Array(Array.from(data))
  }
  return new Float32Array(Array.from(data as ArrayLike<number>))
}

export function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / ((Math.sqrt(normA) || 1) * (Math.sqrt(normB) || 1))
}

export function rankChunks(queryVector: Float32Array, chunks: LessonChunk[], embeddings: Float32Array[], topK = 5) {
  return chunks
    .map((chunk, index) => ({
      ...chunk,
      score: cosine(queryVector, embeddings[index] ?? new Float32Array(queryVector.length))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
