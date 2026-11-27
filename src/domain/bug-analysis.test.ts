import { describe, expect, it } from 'vitest'
import { BugAnalysisSchema, BugWorkflowOutputSchema } from './bug-analysis'

const bug = {
  summary: 'Saving a cart with an expired coupon throws and shows a blank page',
  expected: 'The coupon is dropped and the cart is saved',
  actual: 'A 500 error and a blank page',
  locations: ['src/cart/save.ts:42'],
  reproduction: { command: 'pnpm vitest run cart/save', output: 'TypeError: coupon.value is undefined' },
  openQuestions: [],
  media: [{ source: '/sandbox/screenshots/cart.png', caption: 'Blank page after Save' }],
  links: ['https://jira.example.com/browse/SHOP-41'],
}

describe('BugWorkflowOutputSchema', () => {
  it('is null when a human stopped the run, an analysis otherwise', () => {
    expect(BugWorkflowOutputSchema.parse(null)).toBeNull()
    expect(BugWorkflowOutputSchema.parse(bug)).toEqual(bug)
  })
})

describe('BugAnalysisSchema', () => {
  it('accepts a reproduced bug', () => {
    expect(BugAnalysisSchema.parse(bug)).toEqual(bug)
  })

  it('accepts an analysis that reproduced nothing', () => {
    const unproved = { ...bug, expected: null, reproduction: null, locations: [], media: [], links: [], openQuestions: ['Which browser?'] }
    expect(BugAnalysisSchema.safeParse(unproved).success).toBe(true)
  })

  it('rejects a blank summary', () => {
    expect(BugAnalysisSchema.safeParse({ ...bug, summary: '  ' }).success).toBe(false)
  })

  it('rejects a link that is not a URL', () => {
    expect(BugAnalysisSchema.safeParse({ ...bug, links: ['src/cart/save.ts'] }).success).toBe(false)
  })

  it('rejects a media without a caption', () => {
    expect(BugAnalysisSchema.safeParse({ ...bug, media: [{ source: 'cart.png', caption: '' }] }).success).toBe(false)
  })
})
