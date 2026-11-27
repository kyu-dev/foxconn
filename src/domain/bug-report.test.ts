import { describe, expect, it } from 'vitest'
import { BugReportSchema } from './bug-report'

const reportedAt = '2026-11-23T10:00:00Z'
const direct = { kind: 'direct' } as const
const jira = { kind: 'jira', issueKey: 'SHOP_2-42', comments: [], attachments: [], linkedIssues: [] }

describe('BugReportSchema', () => {
  it('accepts a free-text description', () => {
    const report = { description: 'Login button does nothing', source: direct, reportedAt }
    expect(BugReportSchema.parse(report)).toEqual(report)
  })

  it('trims the description', () => {
    expect(BugReportSchema.parse({ description: '  crash on save  ', source: direct, reportedAt }).description).toBe('crash on save')
  })

  it('rejects a blank description', () => {
    expect(BugReportSchema.safeParse({ description: '   ', source: direct, reportedAt }).success).toBe(false)
  })

  it('rejects a time without date', () => {
    expect(BugReportSchema.safeParse({ description: 'crash', source: direct, reportedAt: '10:00:00' }).success).toBe(false)
  })

  it('accepts a Jira source with a valid issue key', () => {
    expect(BugReportSchema.parse({ description: 'crash', source: jira, reportedAt }).source).toEqual(jira)
  })

  it.each(['shop-42', 'SHOP42', 'SHOP-', '../SHOP-1'])('rejects the invalid Jira issue key %s', (issueKey) => {
    expect(BugReportSchema.safeParse({ description: 'crash', source: { ...jira, issueKey }, reportedAt }).success).toBe(false)
  })

  it('rejects a Jira source without issue key', () => {
    expect(BugReportSchema.safeParse({ description: 'crash', source: { ...jira, issueKey: undefined }, reportedAt }).success).toBe(false)
  })
})

describe('BugReportSchema Jira context', () => {
  const parse = (source: unknown) => BugReportSchema.safeParse({ description: 'crash', source, reportedAt }).success

  it('accepts comments, attachments and linked issues', () => {
    expect(parse({
      ...jira,
      comments: ['Happens only on Safari'],
      attachments: [{ filename: 'screen.png', mimeType: 'image/png', size: 1024 }],
      linkedIssues: [{ key: 'SHOP-7', summary: 'Login rework', relation: 'is blocked by' }],
    })).toBe(true)
  })

  it('rejects a Jira source without its context lists', () => {
    expect(parse({ kind: 'jira', issueKey: 'SHOP-42' })).toBe(false)
  })

  it('rejects a linked issue with an invalid key', () => {
    expect(parse({ ...jira, linkedIssues: [{ key: 'nope', summary: 's', relation: 'blocks' }] })).toBe(false)
  })

  it('rejects a negative attachment size', () => {
    expect(parse({ ...jira, attachments: [{ filename: 'a.log', mimeType: 'text/plain', size: -1 }] })).toBe(false)
  })
})
