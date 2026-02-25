import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DEFAULT_TIMEOUT_MS = 2_000
const DEFAULT_MAX_BUFFER = 1024 * 64

export async function runMonty(code: string) {
  const binaryPath = process.env.MONTY_BIN_PATH || resolve(process.cwd(), 'bin/monty')

  if (!existsSync(binaryPath)) {
    throw new Error(`Monty binary not found at ${binaryPath}`)
  }

  const { stdout, stderr } = await execFileAsync(binaryPath, ['-e', code], {
    timeout: Number(process.env.MONTY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    maxBuffer: Number(process.env.MONTY_MAX_BUFFER || DEFAULT_MAX_BUFFER),
  })

  if (stderr?.trim()) {
    throw new Error(stderr.trim())
  }

  return stdout.trim()
}
