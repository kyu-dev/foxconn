import { describe, expect, it } from 'vitest'
import { modelFromEnv } from '../../infrastructure/llm/create-model'
import { createAssistantAgent } from './assistant-agent'

describe('assistantAgent', () => {
  it('returns text from the configured model', async () => {
    const result = await createAssistantAgent(modelFromEnv(process.env)).generate('Say hello.')
    // result.text is always a string, never null: an empty answer is ''
    expect(result.text.trim()).not.toBe('')
  })

//check potential issue in seconde run (can happens when using codex and claude code as llm provider)
  it('answers a second message with the same agent', async () => {
    const agent = createAssistantAgent(modelFromEnv(process.env))
    await agent.generate('Say hello.')
    const second = await agent.generate('Say goodbye.')
    expect(second.text.trim()).not.toBe('')
  })
})
