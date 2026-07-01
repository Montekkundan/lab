# DocTutor Evaluation Report

Generated: `2026-06-07T23:17:51+00:00`

## Corpus

- Lessons: `8`
- Chunks: `254`
- Vocab size: `2329`
- Embedding dim: `64`

## Eval Set

- Total cases: `60`
- In-domain retrieval cases: `48`
- Out-of-domain refusal cases: `12`

## Retrieval Metrics

| Method | Lesson R@1 | Lesson R@3 | Chunk R@1 | Chunk R@3 | Lesson MRR | Chunk MRR | ms/query |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| lexical | 0.7500 | 0.8750 | 0.2917 | 0.4792 | 0.8269 | 0.4534 | 0.108 |
| tfidf | 0.7083 | 0.9375 | 0.3750 | 0.6667 | 0.8299 | 0.5561 | 0.222 |
| tiny_encoder | 0.7708 | 0.8542 | 0.3542 | 0.4167 | 0.8194 | 0.4167 | 0.777 |
| hybrid | 0.7917 | 0.8750 | 0.3958 | 0.5417 | 0.8436 | 0.4911 | 0.090 |

## Refusal Gate

- Threshold: `0.32`
- Precision: `1.0000`
- Recall / OOD refusal rate: `1.0000`
- In-domain false refusal rate: `0.0000`

## Why This Matters

This report turns DocTutor from a chatbot demo into a measured retrieval system. It shows the tiny encoder against lexical and TF-IDF baselines, checks citation ranking at lesson and chunk granularity, and measures whether the assistant refuses questions outside the eight TensorTonic lessons.
