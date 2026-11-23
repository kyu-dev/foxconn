import type { MastraModelConfig } from '@mastra/core/llm'
import { createOllama } from 'ollama-ai-provider-v2'
import { DEFAULT_MODEL, parseModelSpec, type ModelSpec } from './model-spec'

export interface ModelEnv {
  FOXCONN_MODEL?: string
  OLLAMA_BASE_URL?: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  XAI_API_KEY?: string
}

// Read by the Mastra model router at first call; checked here so a missing key fails at startup
const API_KEY_BY_PROVIDER = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  xai: 'XAI_API_KEY',
} as const satisfies Partial<Record<ModelSpec['provider'], keyof ModelEnv>>

export function createModel(spec: ModelSpec, env: ModelEnv = {}): MastraModelConfig {
  switch (spec.provider) {
    // Cloud APIs: Mastra's model router (reads OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY)
    case 'openai':
    case 'anthropic':
    case 'xai': {
      const key = API_KEY_BY_PROVIDER[spec.provider]
      if (!env[key]) throw new Error(`${key} is required for FOXCONN_MODEL=${spec.provider}/${spec.model}`)
      return `${spec.provider}/${spec.model}`
    }
    case 'ollama':
      // `OLLAMA_BASE_URL=` in .env gives '', which must fall back to the provider default
      return createOllama({ baseURL: env.OLLAMA_BASE_URL === '' ? undefined : env.OLLAMA_BASE_URL })(spec.model)
  }
}

// Model chosen with FOXCONN_MODEL ("provider/model")
export function modelFromEnv(env: ModelEnv): MastraModelConfig {
  return createModel(parseModelSpec(env.FOXCONN_MODEL ?? DEFAULT_MODEL), env)
}
