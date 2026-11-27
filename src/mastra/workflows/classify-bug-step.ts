import { createStep } from '@mastra/core/workflows'
import { BugClassificationSchema, BugDecisionSchema, isConfidentBug } from '../../domain/bug-classification'
import { BugReportSchema } from '../../domain/bug-report'
import { type createBugClassifier, toBugClassification } from '../classifiers/bug-classifier'

export function createClassifyBugStep(classifier: ReturnType<typeof createBugClassifier>) {
  return createStep({
    id: 'classify-bug',
    inputSchema: BugReportSchema,
    outputSchema: BugReportSchema,
    suspendSchema: BugClassificationSchema,
    resumeSchema: BugDecisionSchema,
    execute: async (context) => {
      const { inputData, resumeData } = context
      // Resumed: a human decided. Not a bug ends the run without analysis
      if (resumeData) return resumeData.isBug ? inputData : context.bail(inputData)
      const classification = toBugClassification((await classifier.decide({ state: inputData })).answers)
      return isConfidentBug(classification) ? inputData : context.suspend(classification)
    },
  })
}
