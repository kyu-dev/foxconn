import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Mastra } from '@mastra/core'
import { modelFromEnv } from '../infrastructure/llm/create-model'
import { createBugAnalysisAgent } from './agents/bug-analysis-agent'
import { createBugWorkflow } from './workflows/bug-workflow'

// Composition root: the only place that reads process.env
const model = modelFromEnv(process.env)

// Skills live in src/mastra/public/, the working directory under `mastra dev`, copied into
// .mastra/output (working directory of `mastra start` and Docker) by `mastra build`
// A missing skill is silently ignored by Mastra: fail at startup instead
function skillDir(name: string): string {
  const dir = resolve('skills', name)
  if (!existsSync(join(dir, 'SKILL.md'))) throw new Error(`Skill not found: ${dir} (wrong working directory?)`)
  return dir
}

const bugAnalysisAgent = createBugAnalysisAgent(model, skillDir('bug-analysis'))

export const mastra = new Mastra({
  agents: { bugAnalysisAgent },
  workflows: { bugWorkflow: createBugWorkflow(bugAnalysisAgent) },
})
