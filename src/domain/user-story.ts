import { z } from 'zod'
import { TextSchema } from './text'

export const UserStorySchema = z.object({
  title: TextSchema,
  asA: TextSchema,
  iWant: TextSchema,
  soThat: TextSchema,
  // A story without acceptance criteria cannot be checked
  acceptanceCriteria: z.array(TextSchema).min(1),
})

export type UserStory = z.infer<typeof UserStorySchema>
