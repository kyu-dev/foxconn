import { z } from 'zod'
import { BugReportSchema, JiraIssueKeySchema, type BugReport } from '../../domain/bug-report'

export interface JiraConfig {
  baseUrl: string
  token: string
}

const LinkedIssueSchema = z.object({ key: z.string(), fields: z.object({ summary: z.string() }) })

// Fields disabled on the instance are absent from the response; authors are dropped
const JiraIssueSchema = z.object({
  fields: z.object({
    summary: z.string(),
    description: z.string().nullish(),
    comment: z.object({ comments: z.array(z.object({ body: z.string() })) }).default({ comments: [] }),
    attachment: z.array(z.object({ filename: z.string(), mimeType: z.string(), size: z.number() })).default([]),
    issuelinks: z.array(z.object({
      type: z.object({ inward: z.string(), outward: z.string() }),
      inwardIssue: LinkedIssueSchema.optional(),
      outwardIssue: LinkedIssueSchema.optional(),
    })).default([]),
  }),
})

const FIELDS = 'summary,description,comment,attachment,issuelinks'

// Wiki markup mentions ("[~jdoe]") hold usernames: they stay out of prompts
const hideMentions = (text: string) => text.replace(/\[~[^\]]+\]/g, '@user')

export async function fetchJiraBugReport(issueKey: string, config: JiraConfig): Promise<BugReport> {
  const key = JiraIssueKeySchema.parse(issueKey) // also blocks path injection in the URL
  const url = `${config.baseUrl.replace(/\/+$/, '')}/rest/api/2/issue/${key}?fields=${FIELDS}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Jira ${key}: HTTP ${String(response.status)}`)

  const { fields } = JiraIssueSchema.parse(await response.json())
  const linkedIssues = fields.issuelinks.flatMap(({ type, inwardIssue, outwardIssue }) => {
    if (outwardIssue) return [{ key: outwardIssue.key, summary: outwardIssue.fields.summary, relation: type.outward }]
    if (inwardIssue) return [{ key: inwardIssue.key, summary: inwardIssue.fields.summary, relation: type.inward }]
    return []
  })

  return BugReportSchema.parse({
    description: hideMentions(fields.description ? `${fields.summary}\n\n${fields.description}` : fields.summary),
    source: {
      kind: 'jira',
      issueKey: key,
      comments: fields.comment.comments.map((c) => hideMentions(c.body)),
      attachments: fields.attachment,
      // One odd link (custom key format, unnamed type) must not fail the whole report
      linkedIssues: linkedIssues.filter((l) => JiraIssueKeySchema.safeParse(l.key).success && l.relation !== ''),
    },
    reportedAt: new Date().toISOString(),
  })
}
