import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJiraTicket } from './fetch-jira-ticket'

const config = { baseUrl: 'https://jira.example.com/jira/', token: 'secret' }

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchJiraTicket', () => {
  it('calls the Data Center REST API with the token', async () => {
    const fetchSpy = mockFetch({ fields: { summary: 'Crash', description: null } })
    await fetchJiraTicket('SHOP-42', config)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://jira.example.com/jira/rest/api/2/issue/SHOP-42?fields=summary,description,comment,attachment,issuelinks',
      expect.objectContaining({ headers: { Authorization: 'Bearer secret', Accept: 'application/json' } }),
    )
  })

  it('builds the description from summary and description', async () => {
    mockFetch({ fields: { summary: 'Crash on save', description: 'Click save, page goes blank.' } })
    const report = await fetchJiraTicket('SHOP-42', config)
    expect(report.description).toBe('Crash on save\n\nClick save, page goes blank.')
    expect(report.source).toEqual({ kind: 'jira', issueKey: 'SHOP-42', comments: [], attachments: [], linkedIssues: [] })
  })

  it('uses the summary alone when the description is empty', async () => {
    mockFetch({ fields: { summary: 'Crash on save', description: null } })
    expect((await fetchJiraTicket('SHOP-42', config)).description).toBe('Crash on save')
  })

  it('reads comment bodies, attachment metadata and linked issues', async () => {
    mockFetch({
      fields: {
        summary: 'Crash',
        description: null,
        comment: { comments: [{ body: 'Only on Safari', author: { displayName: 'Jane Doe' } }] },
        attachment: [{ filename: 'screen.png', mimeType: 'image/png', size: 1024, content: 'https://jira.example.com/secure/attachment/1' }],
        issuelinks: [
          { type: { inward: 'is blocked by', outward: 'blocks' }, outwardIssue: { key: 'SHOP-7', fields: { summary: 'Login rework' } } },
          { type: { inward: 'is duplicated by', outward: 'duplicates' }, inwardIssue: { key: 'SHOP-9', fields: { summary: 'Save broken' } } },
        ],
      },
    })
    expect((await fetchJiraTicket('SHOP-42', config)).source).toEqual({
      kind: 'jira',
      issueKey: 'SHOP-42',
      comments: ['Only on Safari'],
      attachments: [{ filename: 'screen.png', mimeType: 'image/png', size: 1024 }],
      linkedIssues: [
        { key: 'SHOP-7', summary: 'Login rework', relation: 'blocks' },
        { key: 'SHOP-9', summary: 'Save broken', relation: 'is duplicated by' },
      ],
    })
  })

  it('hides user mentions in the description and comments', async () => {
    mockFetch({
      fields: {
        summary: 'Crash',
        description: 'Seen by [~jdoe]',
        comment: { comments: [{ body: '[~jane.doe] can you check?' }] },
      },
    })
    const report = await fetchJiraTicket('SHOP-42', config)
    expect(report.description).toBe('Crash\n\nSeen by @user')
    expect(report.source).toMatchObject({ comments: ['@user can you check?'] })
  })

  it('accepts an issue whose description field is hidden', async () => {
    mockFetch({ fields: { summary: 'Crash on save' } })
    expect((await fetchJiraTicket('SHOP-42', config)).description).toBe('Crash on save')
  })

  it('drops linked issues the domain cannot represent instead of failing', async () => {
    mockFetch({
      fields: {
        summary: 'Crash',
        description: null,
        issuelinks: [
          { type: { inward: 'relates to', outward: 'relates to' }, outwardIssue: { key: 'legacy-7', fields: { summary: 'Odd key' } } },
          { type: { inward: '', outward: '' }, outwardIssue: { key: 'SHOP-8', fields: { summary: 'Unnamed link' } } },
          { type: { inward: 'is blocked by', outward: 'blocks' }, outwardIssue: { key: 'SHOP-9', fields: { summary: 'Kept' } } },
        ],
      },
    })
    const { source } = await fetchJiraTicket('SHOP-42', config)
    expect(source.kind === 'jira' && source.linkedIssues).toEqual([{ key: 'SHOP-9', summary: 'Kept', relation: 'blocks' }])
  })

  it('rejects an invalid issue key before calling Jira', async () => {
    const fetchSpy = mockFetch({})
    await expect(fetchJiraTicket('../admin', config)).rejects.toThrow()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fails on an HTTP error without leaking the token', async () => {
    mockFetch({ errorMessages: ['Issue does not exist'] }, 404)
    await expect(fetchJiraTicket('SHOP-42', config)).rejects.toThrow(/^Jira SHOP-42: HTTP 404$/)
  })

  it('fails on an unexpected response shape', async () => {
    mockFetch({ fields: {} })
    await expect(fetchJiraTicket('SHOP-42', config)).rejects.toThrow()
  })
})
