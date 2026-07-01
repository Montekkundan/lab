import type { EncodedQuestion } from './tokenizer'
import type { RankedChunk } from './retrieval'

export type DebugStep = {
  label: string
  detail: string
}

export type ChatAnswer = {
  answer: string
  citation: string
  refused: boolean
}

const REFUSAL_SCORE = 0.32
const DOMAIN_TERMS = new Set([
  'attention',
  'batch',
  'batchnorm',
  'block',
  'bos',
  'concat',
  'concatenate',
  'cosine',
  'decoder',
  'deterministic',
  'dk',
  'd_k',
  'embedding',
  'embeddings',
  'encoder',
  'eos',
  'feed',
  'ffn',
  'forward',
  'frequency',
  'gamma',
  'head',
  'heads',
  'hidden',
  'id',
  'ids',
  'key',
  'keys',
  'layer',
  'layernorm',
  'learn',
  'learned',
  'mask',
  'mean',
  'multi',
  'normalization',
  'normalize',
  'norm',
  'padding',
  'pad',
  'positional',
  'position',
  'post',
  'projection',
  'q',
  'query',
  'queries',
  'relu',
  'relationship',
  'relationships',
  'residual',
  'rope',
  'scale',
  'scaled',
  'sinusoidal',
  'softmax',
  'sqrt',
  'subword',
  'subwords',
  'token',
  'tokenizer',
  'tokenization',
  'tokens',
  'transformer',
  'unk',
  'unknown',
  'value',
  'values',
  'variance',
  'vector',
  'vectors',
  'vocab',
  'vocabulary',
  'word',
  'words'
])

const WEAK_DOMAIN_TERMS = new Set([
  'block',
  'forward',
  'head',
  'heads',
  'key',
  'keys',
  'layer',
  'query',
  'queries',
  'scale',
  'value',
  'values',
  'vector',
  'vectors'
])

function cleanLessonText(text: string) {
  let cleaned = text
    .replace(/[\u200b\u2061\u2063]/g, ' ')
    .replace(/\bd\s+k\b/g, 'd_k')
    .replace(/\bq\s+T\s+k\b/g, 'q^T k')
    .replace(/\btanh\s+tanh\b/g, 'tanh')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned
    .replace(/\bd_k\s+d_k\b/g, 'd_k')
    .replace(/\bd_k\s*,/g, 'd_k,')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')

  const afterScalingIndex = cleaned.indexOf('After scaling,')
  if (afterScalingIndex > 0 && afterScalingIndex < 220) {
    cleaned = cleaned.slice(afterScalingIndex)
  }

  return cleaned
}

function compact(text: string, maxLength = 520) {
  const cleaned = cleanLessonText(text)
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1).trim()}...`
}

function displayHeading(chunk: RankedChunk) {
  if (!chunk.heading || chunk.heading === chunk.lessonTitle) return chunk.lessonTitle
  if (chunk.heading.length < 4 || chunk.heading.length > 74) return chunk.lessonTitle
  return chunk.heading.replace(/:$/, '')
}

function hasTransformerDomainSignal(tokens: string[]) {
  const matches = tokens.filter((token) => DOMAIN_TERMS.has(token))
  return matches.some((token) => !WEAK_DOMAIN_TERMS.has(token)) || matches.length >= 2
}

export function buildAnswer(encoded: EncodedQuestion, ranked: RankedChunk[]): ChatAnswer {
  const best = ranked[0]
  if (!best) {
    return {
      answer: "I could not retrieve a lesson chunk for that question.",
      citation: "No source",
      refused: true
    }
  }

  const contentTokenCount = encoded.knownContentTokens.length + encoded.unknownTokens.length
  const hasEnoughKnownTerms = contentTokenCount === 0 || encoded.knownContentTokens.length >= 2
  const hasDomainSignal = hasTransformerDomainSignal(encoded.rawTokens)
  const shouldRefuse = best.score < REFUSAL_SCORE || !hasEnoughKnownTerms || !hasDomainSignal

  if (shouldRefuse) {
    return {
      answer:
        "I do not know from the eight TensorTonic Transformer lessons. Try asking about tokenization, embeddings, positional encoding, attention, multi-head attention, FFN, LayerNorm, or encoder blocks.",
      citation: "Refusal: retrieval confidence or vocabulary coverage was too low.",
      refused: true
    }
  }

  const heading = displayHeading(best)
  return {
    answer: `This is covered in Lesson ${best.lessonNumber}: ${best.lessonTitle}, under "${heading}". ${compact(
      best.summary || best.text
    )}`,
    citation: `${best.sourceFile} -> ${heading} (${best.id}, score ${best.score.toFixed(3)})`,
    refused: false
  }
}

export function makeDebugSteps(args: {
  question: string
  encoded: EncodedQuestion
  dModel: number
  maxLength: number
  numLayers: number
  numHeads: number
  dFf: number
  queryVector: Float32Array
  ranked: RankedChunk[]
  answer: ChatAnswer
}): DebugStep[] {
  const topScores = args.ranked
    .slice(0, 3)
    .map((chunk) => `${chunk.id}:${chunk.score.toFixed(3)}`)
    .join(', ')

  return [
    {
      label: 'User question',
      detail: args.question
    },
    {
      label: 'tokenizer',
      detail: `tokens=${JSON.stringify(args.encoded.tokens.slice(0, 14))} ids=${JSON.stringify(
        args.encoded.ids.slice(0, 14)
      )} unknown=${JSON.stringify(args.encoded.unknownTokens)}`
    },
    {
      label: 'embedding layer',
      detail: `lookup shape [1, ${args.maxLength}, ${args.dModel}], scaled by sqrt(${args.dModel})`
    },
    {
      label: 'positional encoding',
      detail: `sin/cos position matrix shape [1, ${args.maxLength}, ${args.dModel}] added to embeddings`
    },
    {
      label: 'transformer encoder block(s)',
      detail: `${args.numLayers} block(s), ${args.numHeads} attention heads, FFN hidden size ${args.dFf}`
    },
    {
      label: 'pooled query vector',
      detail: `mean-pooled + projected vector first8=[${Array.from(args.queryVector.slice(0, 8))
        .map((value) => value.toFixed(4))
        .join(', ')}]`
    },
    {
      label: 'compare against lesson chunk vectors',
      detail: `cosine scores top3=${topScores}`
    },
    {
      label: 'retrieve best chunks',
      detail: args.ranked
        .slice(0, 3)
        .map((chunk) => `${chunk.id} Lesson ${chunk.lessonNumber} ${chunk.lessonTitle}`)
        .join(' | ')
    },
    {
      label: 'show short answer + citation',
      detail: `${args.answer.refused ? 'refused' : 'answered'}; ${args.answer.citation}`
    }
  ]
}
