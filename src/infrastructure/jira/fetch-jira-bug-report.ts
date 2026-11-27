import { z } from 'zod'
import { BugReportSchema, JiraIssueKeySchema, LinkedIssueSchema, type BugReport } from '../../domain/bug-report'

export interface JiraConfig {
  baseUrl: string
  token: string
  // Custom field holding the steps to reproduce ("customfield_10112"): its id differs on every instance
  stepsToReproduceField?: string
}

const JiraLinkedIssueSchema = z.object({ key: z.string(), fields: z.object({ summary: z.string() }) })
const NamedSchema = z.object({ name: z.string() })

// Fields disabled on the instance are absent from the response; authors are dropped.
// Loose: custom fields are kept too, read by id below
const JiraIssueSchema = z.object({
  fields: z.looseObject({
    summary: z.string(),
    description: z.string().nullish(),
    environment: z.string().nullish(),
    versions: z.array(NamedSchema).default([]),
    components: z.array(NamedSchema).default([]),
    comment: z.object({ comments: z.array(z.object({ body: z.string() })) }).default({ comments: [] }),
    attachment: z.array(z.object({ filename: z.string(), mimeType: z.string(), size: z.number() })).default([]),
    issuelinks: z.array(z.object({
      type: z.object({ inward: z.string(), outward: z.string() }),
      inwardIssue: JiraLinkedIssueSchema.optional(),
      outwardIssue: JiraLinkedIssueSchema.optional(),
    })).default([]),
  }),
})

const FIELDS = ['summary', 'description', 'environment', 'versions', 'components', 'comment', 'attachment', 'issuelinks']

// Wiki markup mentions ("[~jdoe]") hold usernames: they stay out of prompts
const hideMentions = (text: string) => text.replace(/\[~[^\]]+\]/g, '@user')
// Jira gives null, '' or blanks for an empty text field: all mean "not said"
const optionalText = (text: string | null | undefined) => (text?.trim() ? hideMentions(text) : null)

export async function fetchJiraBugReport(issueKey: string, config: JiraConfig): Promise<BugReport> {
  const key = JiraIssueKeySchema.parse(issueKey) // also blocks path injection in the URL
  const stepsField = config.stepsToReproduceField
  const requested = stepsField ? [...FIELDS, stepsField] : FIELDS
  const url = `${config.baseUrl.replace(/\/+$/, '')}/rest/api/2/issue/${key}?fields=${requested.join(',')}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Jira ${key}: HTTP ${String(response.status)}`)

  const { fields } = JiraIssueSchema.parse(await response.json())
  // A field that is not text (wrong id in the config) fails here instead of being silently dropped
  const steps = stepsField ? z.string().nullish().parse(fields[stepsField]) : null
  const linkedIssues = fields.issuelinks.flatMap(({ type, inwardIssue, outwardIssue }) => {
    if (outwardIssue) return [{ key: outwardIssue.key, summary: outwardIssue.fields.summary, relation: type.outward }]
    if (inwardIssue) return [{ key: inwardIssue.key, summary: inwardIssue.fields.summary, relation: type.inward }]
    return []
  })

  return BugReportSchema.parse({
    source: { kind: 'jira', issueKey: key },
    description: hideMentions(fields.description ? `${fields.summary}\n\n${fields.description}` : fields.summary),
    stepsToReproduce: optionalText(steps),
    environment: optionalText(fields.environment),
    affectedVersions: fields.versions.map((v) => v.name),
    components: fields.components.map((c) => c.name),
    comments: fields.comment.comments.map((c) => hideMentions(c.body)),
    attachments: fields.attachment,
    // One odd link (custom key format, unnamed type) must not fail the whole report
    linkedIssues: linkedIssues.filter((l) => LinkedIssueSchema.safeParse(l).success),
    reportedAt: new Date().toISOString(),
  })
}
