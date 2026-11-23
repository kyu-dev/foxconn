import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBugAnalysisAgent } from './bug-analysis-agent'

describe('bugAnalysisAgent', () => {
  // No LLM call: Mastra only reads and validates SKILL.md (name must match the folder)
  it('loads its bug-analysis skill', async () => {
    const agent = createBugAnalysisAgent('openai/unused', resolve('src/mastra/public/skills/bug-analysis'))
    expect((await agent.listSkills()).map((skill) => skill.name)).toEqual(['bug-analysis'])
  })
})
