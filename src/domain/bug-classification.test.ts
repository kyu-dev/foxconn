import { describe, expect, it } from 'vitest'
import { BugClassificationSchema, isConfidentBug } from './bug-classification'

describe('isConfidentBug', () => {
  it('is true at or above the threshold', () => {
    expect(isConfidentBug({ bugProbability: 0.7 })).toBe(true)
    expect(isConfidentBug({ bugProbability: 0.95 })).toBe(true)
  })

  it('is false below the threshold', () => {
    expect(isConfidentBug({ bugProbability: 0.69 })).toBe(false)
  })

  it('is false when the model refused to answer', () => {
    expect(isConfidentBug({ bugProbability: null })).toBe(false)
  })

})

describe('BugClassificationSchema', () => {
  it.each([-0.1, 1.1])('rejects the out-of-range probability %s', (bugProbability) => {
    expect(BugClassificationSchema.safeParse({ bugProbability }).success).toBe(false)
  })
})
