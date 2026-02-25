import { runMonty } from '@/lib/monty'

type RunRequestBody = {
  code?: string
}

const MAX_CODE_SIZE = 50_000

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequestBody
    const code = (body?.code || '').trim()

    if (!code) {
      return Response.json({ error: 'Missing `code` in request body.' }, { status: 400 })
    }

    if (code.length > MAX_CODE_SIZE) {
      return Response.json(
        { error: `Code is too large. Max ${MAX_CODE_SIZE} characters.` },
        { status: 413 }
      )
    }

    const startedAt = Date.now()
    const output = await runMonty(code)

    return Response.json({
      ok: true,
      stdout: output,
      durationMs: Date.now() - startedAt,
      command: ['local', process.env.MONTY_BIN_PATH || 'bin/monty'],
      cwd: process.cwd(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Monty execution error.'
    return Response.json({ error: message }, { status: 500 })
  }
}
