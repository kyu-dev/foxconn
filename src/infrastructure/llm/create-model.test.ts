import { describe, expect, it } from 'vitest'
import { createModel, modelFromEnv } from './create-model'

function modelIdOf(model: unknown): unknown {
  return typeof model === 'object' && model !== null && 'modelId' in model ? model.modelId : undefined
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

  it.each(['ollama', 'claude-code', 'codex'] as const)('builds an AI SDK model instance for %s', (provider) => {
    expect(modelIdOf(createModel({ provider, model: 'some-model' }))).toBe('some-model')
  })
})

describe('modelFromEnv', () => {
  it('defaults to Claude Code sonnet', () => {
    expect(modelIdOf(modelFromEnv({})())).toBe('sonnet')
  })

  it('uses FOXCONN_MODEL', () => {
    expect(modelFromEnv({ FOXCONN_MODEL: 'openai/gpt-5', OPENAI_API_KEY: 'k' })()).toBe('openai/gpt-5')
  })

  it('builds a fresh model on each call, so no CLI session is resumed across calls', () => {
    const model = modelFromEnv({})
    expect(model()).not.toBe(model())
  })

  it('fails fast on an unknown provider', () => {
    expect(() => modelFromEnv({ FOXCONN_MODEL: 'nope/x' })).toThrow(/Invalid model/)
  })

  it('fails fast on a missing API key, before any call', () => {
    expect(() => modelFromEnv({ FOXCONN_MODEL: 'openai/gpt-5' })).toThrow(/OPENAI_API_KEY is required/)
  })
})
