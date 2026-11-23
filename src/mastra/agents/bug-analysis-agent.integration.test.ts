import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { modelFromEnv } from '../../infrastructure/llm/create-model'
import { createBugAnalysisAgent } from './bug-analysis-agent'

const skillDir = resolve('src/mastra/public/skills/bug-analysis')
const report = 'Clicking "Save" on the profile page does nothing. Expected: the profile is saved.'

describe('bugAnalysisAgent', () => {
  it('returns text from the configured model', async () => {
    const result = await createBugAnalysisAgent(modelFromEnv(process.env), skillDir).generate(report)
    // result.text is always a string, never null: an empty answer is ''
    expect(result.text.trim()).not.toBe('')
  })
})
