import type { Agent } from '@mastra/core/agent'
import { createStep } from '@mastra/core/workflows'
import { BugAnalysisSchema } from '../../domain/bug-analysis'
import { BugReportSchema } from '../../domain/bug-report'

export function createAnalyzeBugStep(agent: Agent) {
  return createStep({
    id: 'analyze-bug',
    inputSchema: BugReportSchema,
    outputSchema: BugAnalysisSchema,
    execute: async ({ inputData }) => {
      const { object } = await agent.generate(JSON.stringify(inputData), { structuredOutput: { schema: BugAnalysisSchema } })
      return object
    },
  })
}
