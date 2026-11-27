import { z } from 'zod'

// Text someone must actually write: blank is not an answer
export const TextSchema = z.string().trim().min(1)
