import { Classifier, type ClassifierAnswers, type ClassifierModel, type ClassifierQuestions } from '@mastra/core/classifier'
import type { BugClassification } from '../../domain/bug-classification'

const BUG_QUESTIONS = {
  isBug: {
    type: 'boolean',
    instructions: 'Does this report describe existing behavior that is broken?',
    criteria: {
      true: 'Something that should already work fails, crashes, or gives a wrong result.',
      false: 'A request for new behavior, a change of design, a question, or no clear problem.',
    },
  },
} as const satisfies ClassifierQuestions

export function createBugClassifier(model: ClassifierModel): Classifier<typeof BUG_QUESTIONS> {
  return new Classifier<typeof BUG_QUESTIONS>({ id: 'bug-classifier', model, questions: BUG_QUESTIONS })
}

export function toBugClassification(answers: ClassifierAnswers<typeof BUG_QUESTIONS>): BugClassification {
  return { bugProbability: answers.isBug.type === 'refusal' ? null : answers.isBug.probability }
}
