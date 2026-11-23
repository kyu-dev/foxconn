import { describe, expect, it } from 'vitest'
import { parseModelSpec } from './model-spec'

describe('parseModelSpec', () => {
  it('splits provider and model', () => {
    expect(parseModelSpec('openai/gpt-5')).toEqual({ provider: 'openai', model: 'gpt-5' })
  })

  it('keeps everything after the first slash as the model', () => {
    expect(parseModelSpec('ollama/library/qwen3:8b')).toEqual({ provider: 'ollama', model: 'library/qwen3:8b' })
  })

  it('rejects an unknown provider', () => {
    expect(() => parseModelSpec('mistral/large')).toThrow(/Invalid model "mistral\/large"/)
  })

  it('rejects a value without provider', () => {
    expect(() => parseModelSpec('sonnet')).toThrow(/expected "provider\/model"/)
  })

  it('rejects an empty model', () => {
    expect(() => parseModelSpec('openai/')).toThrow(/Invalid model/)
  })
})
