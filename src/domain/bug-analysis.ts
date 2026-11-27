import { z } from 'zod'
import { TextSchema } from './text'

export const BugAnalysisSchema = z.object({
  // What actually happens, checked against the code, not the report's wording
  summary: TextSchema,
  // null when the report does not say and the code does not tell
  expected: TextSchema.nullable(),
  actual: TextSchema.nullable(),
  // "path/to/file.ts:42"
  locations: z.array(TextSchema),
  // null when not reproduced: a reproduction is only claimed when it was run
  reproduction: z.object({ command: TextSchema, output: TextSchema }).nullable(),
  openQuestions: z.array(TextSchema),
  // Screenshots and recordings: a URL or a file path in the sandbox
  media: z.array(z.object({ source: TextSchema, caption: TextSchema })),
  links: z.array(z.url()),
})

export type BugAnalysis = z.infer<typeof BugAnalysisSchema>

// The workflow's result: null when a human said the report is not a bug
export const BugWorkflowOutputSchema = BugAnalysisSchema.nullable()
