import { describe, expect, it } from 'vitest'
import { modelFromEnv } from '../../infrastructure/llm/create-model'
import { createAssistantAgent } from './assistant-agent'

describe('assistantAgent', () => {
  it('returns text from the configured model', async () => {
    const result = await createAssistantAgent(modelFromEnv(process.env)).generate('Say hello.')
    // result.text is always a string, never null: an empty answer is ''
    expect(result.text.trim()).not.toBe('')
  })
})
