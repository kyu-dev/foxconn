import { describe, expect, it } from 'vitest'
import { BugReportSchema } from './bug-report'

const reportedAt = '2026-11-23T10:00:00Z'
const jira = { kind: 'jira', issueKey: 'SHOP_2-42' } as const
const report = { source: { kind: 'direct' }, description: 'Login button does nothing', reportedAt } as const
const valid = (input: object) => BugReportSchema.safeParse({ ...report, ...input }).success

describe('BugReportSchema', () => {
  it('fills what a typed report leaves out with null or empty lists', () => {
    expect(BugReportSchema.parse(report)).toEqual({
      ...report,
      stepsToReproduce: null,
      environment: null,
      affectedVersions: [],
      components: [],
      comments: [],
      attachments: [],
      linkedIssues: [],
    })
  })

  it('accepts what a tracker can tell', () => {
    expect(valid({
      source: jira,
      stepsToReproduce: '1. Add a coupon\n2. Save',
      environment: 'Safari 17',
      affectedVersions: ['1.0'],
      components: ['Cart'],
      comments: ['Happens only on Safari'],
      attachments: [{ filename: 'screen.png', mimeType: 'image/png', size: 1024 }],
      linkedIssues: [{ key: 'SHOP-7', summary: 'Login rework', relation: 'is blocked by' }],
    })).toBe(true)
  })

  it('trims the description', () => {
    expect(BugReportSchema.parse({ ...report, description: '  crash on save  ' }).description).toBe('crash on save')
  })

  it.each(['description', 'stepsToReproduce', 'environment'])('rejects a blank %s', (field) => {
    expect(valid({ [field]: '   ' })).toBe(false)
  })

  it('rejects a time without date', () => {
    expect(valid({ reportedAt: '10:00:00' })).toBe(false)
  })

  it('keeps only the issue key in a Jira source', () => {
    expect(BugReportSchema.parse({ ...report, source: jira }).source).toEqual(jira)
  })

  it.each(['shop-42', 'SHOP42', 'SHOP-', '../SHOP-1', undefined])('rejects the invalid Jira issue key %s', (issueKey) => {
    expect(valid({ source: { ...jira, issueKey } })).toBe(false)
  })

  it('rejects a linked issue with an invalid key', () => {
    expect(valid({ linkedIssues: [{ key: 'nope', summary: 's', relation: 'blocks' }] })).toBe(false)
  })

  it('rejects a negative attachment size', () => {
    expect(valid({ attachments: [{ filename: 'a.log', mimeType: 'text/plain', size: -1 }] })).toBe(false)
  })
})
