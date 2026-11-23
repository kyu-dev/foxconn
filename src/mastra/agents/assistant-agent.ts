import { Agent } from '@mastra/core/agent'
import type { MastraModelConfig } from '@mastra/core/llm'

export function createAssistantAgent(model: MastraModelConfig): Agent {
  return new Agent({
    id: 'assistant',
    name: 'Assistant',
    instructions: 'You are a concise assistant. Answer the question directly.',
    model,
  })
}
