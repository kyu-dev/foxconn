import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'
import type { ClassifierModel } from '@mastra/core/classifier'

export interface DecisionModelEnv {
  TYPESAFE_AI_API_KEY?: string
}

export function decisionModelFromEnv(env: DecisionModelEnv): ClassifierModel {
  if (!env.TYPESAFE_AI_API_KEY) throw new Error('TYPESAFE_AI_API_KEY is required for the classifiers (Jev)')
  return createTypeSafeAi({ apiKey: env.TYPESAFE_AI_API_KEY }).decisionModel('jev-latest')
}
