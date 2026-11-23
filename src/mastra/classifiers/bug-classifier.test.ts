import type { ClassifierModel } from '@mastra/core/classifier'
import { describe, expect, it } from 'vitest'
import { createBugClassifier, toBugClassification } from './bug-classifier'

describe('createBugClassifier', () => {
  it('asks the decision model the isBug boolean question', async () => {
    const received: unknown[] = []
    const model: ClassifierModel = {
      specificationVersion: 'v4',
      provider: 'fake',
      modelId: 'fake',
      supportedQuestionTypes: ['boolean'],
      doDecide: (options) => {
        received.push(options.questions)
        return Promise.resolve({ answers: { isBug: { type: 'boolean', probability: 0.9 } }, warnings: [] })
      },
    }
    const { answers } = await createBugClassifier(model).decide({ state: { description: 'Save shows a blank page' } })
    expect(received[0]).toMatchObject({ isBug: { type: 'boolean' } })
    expect(toBugClassification(answers)).toEqual({ bugProbability: 0.9 })
  })
})

describe('toBugClassification', () => {
  it('maps a refusal to a null probability', () => {
    expect(toBugClassification({ isBug: { type: 'refusal' } })).toEqual({ bugProbability: null })
  })
})
