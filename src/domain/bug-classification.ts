import { z } from 'zod'

export const BugClassificationSchema = z.object({
  // null when the decision model refused to answer
  bugProbability: z.number().min(0).max(1).nullable(),
})

export type BugClassification = z.infer<typeof BugClassificationSchema>

// shortcut: fixed guess, tune it once human decisions on real reports are recorded
const BUG_THRESHOLD = 0.7

// Below the threshold, or on refusal, a human decides whether foxconn goes on
export function isConfidentBug({ bugProbability }: BugClassification): boolean {
  return bugProbability !== null && bugProbability >= BUG_THRESHOLD
}
