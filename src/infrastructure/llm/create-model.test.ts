import { describe, expect, it } from 'vitest'
import { createModel, modelFromEnv } from './create-model'

function modelIdOf(model: unknown): unknown {
  return typeof model === 'object' && model !== null && 'modelId' in model ? model.modelId : undefined
}

function chatUrlOf(model: unknown): unknown {
  if (typeof model !== 'object' || model === null || !('config' in model)) return undefined
  const { config } = model
  if (typeof config !== 'object' || config === null || !('url' in config) || typeof config.url !== 'function') return undefined
  return Reflect.apply(config.url, config, [{ path: '/chat' }])
}

describe('createModel', () => {
  const keys = { OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k', XAI_API_KEY: 'k' }

  it.each(['openai', 'anthropic', 'xai'] as const)('routes %s through the Mastra model router', (provider) => {
    expect(createModel({ provider, model: 'some-model' }, keys)).toBe(`${provider}/some-model`)
  })

  it.each(['openai', 'anthropic', 'xai'] as const)('fails fast when the %s API key is missing or empty', (provider) => {
    expect(() => createModel({ provider, model: 'm' })).toThrow(/_API_KEY is required/)
    expect(() => createModel({ provider, model: 'm' }, { ...keys, OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', XAI_API_KEY: '' })).toThrow(/_API_KEY is required/)
  })

  it('builds an AI SDK model instance for ollama', () => {
    expect(modelIdOf(createModel({ provider: 'ollama', model: 'some-model' }))).toBe('some-model')
  })

  it.each([undefined, ''])('falls back to the local Ollama server when OLLAMA_BASE_URL is %j', (url) => {
    expect(chatUrlOf(createModel({ provider: 'ollama', model: 'm' }, { OLLAMA_BASE_URL: url }))).toBe('http://127.0.0.1:11434/api/chat')
  })

  it('uses OLLAMA_BASE_URL', () => {
    const env = { OLLAMA_BASE_URL: 'http://host.docker.internal:11434/api' }
    expect(chatUrlOf(createModel({ provider: 'ollama', model: 'm' }, env))).toBe('http://host.docker.internal:11434/api/chat')
  })
})

describe('modelFromEnv', () => {
  it('defaults to local Ollama Qwen', () => {
    expect(modelIdOf(modelFromEnv({}))).toBe('qwen3.8:27b-mlx')
  })

  it('uses FOXCONN_MODEL', () => {
    expect(modelFromEnv({ FOXCONN_MODEL: 'openai/gpt-5', OPENAI_API_KEY: 'k' })).toBe('openai/gpt-5')
  })

  it('fails fast on an unknown provider', () => {
    expect(() => modelFromEnv({ FOXCONN_MODEL: 'nope/x' })).toThrow(/Invalid model/)
  })

  it('fails fast on a missing API key, before any call', () => {
    expect(() => modelFromEnv({ FOXCONN_MODEL: 'openai/gpt-5' })).toThrow(/OPENAI_API_KEY is required/)
  })
})
