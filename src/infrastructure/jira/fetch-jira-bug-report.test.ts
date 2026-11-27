import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJiraBugReport } from './fetch-jira-bug-report'

const config = { baseUrl: 'https://jira.example.com/jira/', token: 'secret' }

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchJiraBugReport', () => {
  it('calls the Data Center REST API with the token', async () => {
    const fetchSpy = mockFetch({ fields: { summary: 'Crash', description: null } })
    await fetchJiraBugReport('SHOP-42', config)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://jira.example.com/jira/rest/api/2/issue/SHOP-42?fields=summary,description,environment,versions,components,comment,attachment,issuelinks',
      expect.objectContaining({ headers: { Authorization: 'Bearer secret', Accept: 'application/json' } }),
    )
  })

  it('builds the description from summary and description, and keeps only the key as source', async () => {
    mockFetch({ fields: { summary: 'Crash on save', description: 'Click save, page goes blank.' } })
    const report = await fetchJiraBugReport('SHOP-42', config)
    expect(report.description).toBe('Crash on save\n\nClick save, page goes blank.')
    expect(report.source).toEqual({ kind: 'jira', issueKey: 'SHOP-42' })
  })

  it('uses the summary alone when the description is empty', async () => {
    mockFetch({ fields: { summary: 'Crash on save', description: null } })
    expect((await fetchJiraBugReport('SHOP-42', config)).description).toBe('Crash on save')
  })

  it('reads environment, affected versions and components', async () => {
    mockFetch({
      fields: {
        summary: 'Crash',
        environment: 'Safari 17, macOS 14',
        versions: [{ id: '10000', name: '1.0' }],
        components: [{ id: '10000', name: 'Cart' }],
      },
    })
    expect(await fetchJiraBugReport('SHOP-42', config)).toMatchObject({
      environment: 'Safari 17, macOS 14',
      affectedVersions: ['1.0'],
      components: ['Cart'],
    })
  })

  it('treats a blank environment as not said', async () => {
    mockFetch({ fields: { summary: 'Crash', environment: '  ' } })
    expect((await fetchJiraBugReport('SHOP-42', config)).environment).toBeNull()
  })

  it('reads the steps to reproduce from the configured custom field', async () => {
    const fetchSpy = mockFetch({ fields: { summary: 'Crash', customfield_10112: '1. Add a coupon\n2. Save' } })
    const report = await fetchJiraBugReport('SHOP-42', { ...config, stepsToReproduceField: 'customfield_10112' })
    expect(fetchSpy.mock.calls[0]?.[0]).toMatch(/,customfield_10112$/)
    expect(report.stepsToReproduce).toBe('1. Add a coupon\n2. Save')
  })

  it('has no steps when no custom field is configured', async () => {
    mockFetch({ fields: { summary: 'Crash', customfield_10112: '1. Add a coupon' } })
    expect((await fetchJiraBugReport('SHOP-42', config)).stepsToReproduce).toBeNull()
  })

  it('fails when the configured steps field is not text', async () => {
    mockFetch({ fields: { summary: 'Crash', customfield_10112: { value: 'High' } } })
    await expect(fetchJiraBugReport('SHOP-42', { ...config, stepsToReproduceField: 'customfield_10112' })).rejects.toThrow()
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
    expect(await fetchJiraBugReport('SHOP-42', config)).toMatchObject({
      comments: ['Only on Safari'],
      attachments: [{ filename: 'screen.png', mimeType: 'image/png', size: 1024 }],
      linkedIssues: [
        { key: 'SHOP-7', summary: 'Login rework', relation: 'blocks' },
        { key: 'SHOP-9', summary: 'Save broken', relation: 'is duplicated by' },
      ],
    })
  })

  it('hides user mentions in every text it reads', async () => {
    mockFetch({
      fields: {
        summary: 'Crash',
        description: 'Seen by [~jdoe]',
        environment: 'Laptop of [~jdoe]',
        customfield_10112: 'Ask [~jdoe]',
        comment: { comments: [{ body: '[~jane.doe] can you check?' }] },
      },
    })
    const report = await fetchJiraBugReport('SHOP-42', { ...config, stepsToReproduceField: 'customfield_10112' })
    expect(report).toMatchObject({
      description: 'Crash\n\nSeen by @user',
      environment: 'Laptop of @user',
      stepsToReproduce: 'Ask @user',
      comments: ['@user can you check?'],
    })
  })

  it('accepts an issue whose optional fields are hidden', async () => {
    mockFetch({ fields: { summary: 'Crash on save' } })
    expect(await fetchJiraBugReport('SHOP-42', config)).toMatchObject({
      description: 'Crash on save',
      environment: null,
      affectedVersions: [],
      components: [],
      comments: [],
    })
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
    const { linkedIssues } = await fetchJiraBugReport('SHOP-42', config)
    expect(linkedIssues).toEqual([{ key: 'SHOP-9', summary: 'Kept', relation: 'blocks' }])
  })

  it('rejects an invalid issue key before calling Jira', async () => {
    const fetchSpy = mockFetch({})
    await expect(fetchJiraBugReport('../admin', config)).rejects.toThrow()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fails on an HTTP error without leaking the token', async () => {
    mockFetch({ errorMessages: ['Issue does not exist'] }, 404)
    await expect(fetchJiraBugReport('SHOP-42', config)).rejects.toThrow(/^Jira SHOP-42: HTTP 404$/)
  })

  it('fails on an unexpected response shape', async () => {
    mockFetch({ fields: {} })
    await expect(fetchJiraBugReport('SHOP-42', config)).rejects.toThrow()
  })
})
