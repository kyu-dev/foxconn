import { z } from 'zod'
import { TextSchema } from './text'

export const JiraIssueKeySchema = z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/)

// Exported so a tracker can drop the links this schema refuses instead of failing the whole report
export const LinkedIssueSchema = z.object({
  key: JiraIssueKeySchema,
  summary: z.string(),
  relation: z.string().min(1),
})

// Tracker-neutral: each tracker is translated into this shape in src/infrastructure/<tracker>/
export const BugReportSchema = z.object({
  // Where the report comes from, to cite it and later post the story back there
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('direct') }),
    z.object({ kind: z.literal('jira'), issueKey: JiraIssueKeySchema }),
  ]),
  description: TextSchema,
  // null or empty when the report does not say
  stepsToReproduce: TextSchema.nullable().default(null),
  environment: TextSchema.nullable().default(null),
  affectedVersions: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  comments: z.array(z.string()).default([]),
  // Metadata only: reading the content is not built yet
  attachments: z.array(z.object({
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
  })).default([]),
  linkedIssues: z.array(LinkedIssueSchema).default([]),
  // When moltus received the report, not when it was created in the tracker
  reportedAt: z.iso.datetime(),
})

export type BugReport = z.infer<typeof BugReportSchema>
