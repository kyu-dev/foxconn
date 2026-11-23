import { z } from 'zod'

export const JiraIssueKeySchema = z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/)

export const BugSourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('direct') }),
  z.object({
    kind: z.literal('jira'),
    issueKey: JiraIssueKeySchema,
    comments: z.array(z.string()),
    // Metadata only: the content may hold client data (rule 7)
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
  description: z.string().trim().min(1),
  source: BugSourceSchema,
  // When foxconn received the report, not when it was created in Jira
  reportedAt: z.iso.datetime(),
})

export type BugReport = z.infer<typeof BugReportSchema>
