import { Mastra } from '@mastra/core'
import { modelFromEnv } from '../infrastructure/llm/create-model'
import { createAssistantAgent } from './agents/assistant-agent'

// Composition root: the only place that reads process.env
const model = modelFromEnv(process.env)

export const mastra = new Mastra({
  agents: { assistantAgent: createAssistantAgent(model) },
})
