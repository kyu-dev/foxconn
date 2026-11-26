import { describe, expect, it } from 'vitest'
import { toBugClassification } from './bug-classifier'

describe('toBugClassification', () => {
  it('keeps the bug probability', () => {
    expect(toBugClassification({ isBug: { type: 'boolean', probability: 0.9 } })).toEqual({ bugProbability: 0.9 })
  })

  it('maps a refusal to a null probability', () => {
    expect(toBugClassification({ isBug: { type: 'refusal' } })).toEqual({ bugProbability: null })
  })
})
