import { Agent } from '@mastra/core/agent'
import type { MastraModelConfig } from '@mastra/core/llm'

// shortcut: no repo or sandbox tools yet, so the analysis rests on the bug report alone
export function createBugAnalysisAgent(model: MastraModelConfig, skillDir: string): Agent {
  return new Agent({
    id: 'bug-analysis',
    name: 'Bug analysis',
    instructions: 'You analyze bug reports for a software team.',
    model,
    skills: [skillDir],
  })
}
