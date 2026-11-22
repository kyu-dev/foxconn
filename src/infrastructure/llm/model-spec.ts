import { z } from 'zod'

const MODEL_PROVIDERS = [
  'ollama',
  'openai',
  'anthropic',
  'xai',
  'claude-code',
  'codex',
] as const

const ModelProvider = z.enum(MODEL_PROVIDERS)

export const ModelSpec = z.object({
  provider: ModelProvider,
  model: z.string().min(1),
})
export type ModelSpec = z.infer<typeof ModelSpec>

export const DEFAULT_MODEL = 'claude-code/sonnet'

/** Parses "provider/model" (e.g. "claude-code/sonnet", "ollama/qwen3:8b"). */
export function parseModelSpec(value: string): ModelSpec {
  const slash = value.indexOf('/')
  if (slash === -1) {
    throw new Error(`Invalid model "${value}": expected "provider/model" (providers: ${MODEL_PROVIDERS.join(', ')})`)
  }
  const result = ModelSpec.safeParse({
    provider: value.slice(0, slash),
    model: value.slice(slash + 1),
  })
  if (!result.success) {
    throw new Error(`Invalid model "${value}": ${z.prettifyError(result.error)}`)
  }
  return result.data
}
