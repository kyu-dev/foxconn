import { describe, expect, it } from 'vitest'
import { decisionModelFromEnv } from './create-decision-model'

describe('decisionModelFromEnv', () => {
  it('builds the Jev decision model', () => {
    expect(decisionModelFromEnv({ TYPESAFE_AI_API_KEY: 'k' }).modelId).toBe('jev-latest')
  })

  it.each([undefined, ''])('fails fast when the API key is %j', (key) => {
    expect(() => decisionModelFromEnv({ TYPESAFE_AI_API_KEY: key })).toThrow(/TYPESAFE_AI_API_KEY is required/)
  })
})
