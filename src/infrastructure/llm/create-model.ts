import type { MastraModelConfig } from '@mastra/core/llm'
import { claudeCode } from 'ai-sdk-provider-claude-code'
import { codexExec } from 'ai-sdk-provider-codex-cli'
import { createOllama } from 'ollama-ai-provider-v2'
import { DEFAULT_MODEL, parseModelSpec, type ModelSpec } from './model-spec'

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/api'

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
      return createOllama({ baseURL: env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL })(spec.model)
    // Local CLIs, used as plain LLMs: no built-in tools, no file writes, no saved sessions
    case 'claude-code':
      return claudeCode(spec.model, { tools: [], persistSession: false })
    case 'codex':
      return codexExec(spec.model, {
        sandboxMode: 'read-only',
        approvalMode: 'never',
        skipGitRepoCheck: true,
      })
  }
}

// Model chosen with FOXCONN_MODEL ("provider/model"), validated now, built fresh on each call:
// claude-code/codex instances keep the CLI session id and resume it on the next call,
// which breaks (persistSession: false) and would leak context between runs. Mastra owns history.
export function modelFromEnv(env: ModelEnv): () => MastraModelConfig {
  const spec = parseModelSpec(env.FOXCONN_MODEL ?? DEFAULT_MODEL)
  createModel(spec, env) // fail fast at startup (missing API key…)
  return () => createModel(spec, env)
}
