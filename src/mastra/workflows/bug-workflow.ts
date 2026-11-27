import type { Agent } from '@mastra/core/agent'
import { createWorkflow } from '@mastra/core/workflows'
import { BugAnalysisSchema } from '../../domain/bug-analysis'
import { BugReportSchema } from '../../domain/bug-report'
import type { createBugClassifier } from '../classifiers/bug-classifier'
import { createAnalyzeBugStep } from './analyze-bug-step'
import { createClassifyBugStep } from './classify-bug-step'

// shortcut: analysis only, the story writing and human validation steps come next
export function createBugWorkflow(classifier: ReturnType<typeof createBugClassifier>, analysisAgent: Agent) {
  return createWorkflow({ id: 'bug-to-story', inputSchema: BugReportSchema, outputSchema: BugAnalysisSchema })
    .then(createClassifyBugStep(classifier))
    .then(createAnalyzeBugStep(analysisAgent))
    .commit()
}
