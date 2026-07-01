export type VocabPayload = {
  special_tokens: string[]
  word_to_id: Record<string, number>
  id_to_word: Record<string, string>
  vocab_size: number
  token_pattern?: string
}

export type EncodedQuestion = {
  rawTokens: string[]
  tokens: string[]
  ids: number[]
  attentionMask: number[]
  unknownTokens: string[]
  knownContentTokens: string[]
}

const TOKEN_PATTERN = /[a-zA-Z0-9_<>]+(?:[-'][a-zA-Z0-9_<>]+)?/g
const CONTENT_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'the',
  'to',
  'we',
  'what',
  'where',
  'why',
  'with'
])

export function tokenize(text: string) {
  return text.toLowerCase().match(TOKEN_PATTERN) ?? []
}

export function encodeQuestion(text: string, vocab: VocabPayload, maxLength: number): EncodedQuestion {
  const rawTokens = tokenize(text)
  const tokens = ['<BOS>', ...rawTokens, '<EOS>'].slice(0, maxLength)
  const unkId = vocab.word_to_id['<UNK>'] ?? 1
  const padId = vocab.word_to_id['<PAD>'] ?? 0

  const ids = tokens.map((token) => vocab.word_to_id[token] ?? unkId)
  const attentionMask = ids.map(() => 1)

  while (ids.length < maxLength) {
    ids.push(padId)
    attentionMask.push(0)
    tokens.push('<PAD>')
  }

  const contentTokens = rawTokens.filter((token) => !CONTENT_STOP_WORDS.has(token))
  const unknownTokens = contentTokens.filter((token) => vocab.word_to_id[token] == null)
  const knownContentTokens = contentTokens.filter((token) => vocab.word_to_id[token] != null)

  return {
    rawTokens,
    tokens,
    ids,
    attentionMask,
    unknownTokens,
    knownContentTokens
  }
}
