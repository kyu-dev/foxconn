import { z } from 'zod'
import { TextSchema } from './text'

export const JiraIssueKeySchema = z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/)

export const BugReportSourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('direct') }),
  z.object({
    kind: z.literal('jira'),
    issueKey: JiraIssueKeySchema,
    comments: z.array(z.string()),
    // Metadata only: reading the content is not built yet
    attachments: z.array(z.object({
      filename: z.string().min(1),
      mimeType: z.string().min(1),
      size: z.number().int().nonnegative(),
    })),
    linkedIssues: z.array(z.object({
      key: JiraIssueKeySchema,
      summary: z.string(),
      relation: z.string().min(1),
    })),
  }),
])

export const BugReportSchema = z.object({
  description: TextSchema,
  source: BugReportSourceSchema,
  // When moltus received the report, not when it was created in Jira
  reportedAt: z.iso.datetime(),
})

export type BugReport = z.infer<typeof BugReportSchema>
