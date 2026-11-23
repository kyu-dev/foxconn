import { describe, expect, it } from 'vitest'
import { UserStorySchema } from './user-story'

const story = {
  title: 'Log in from the home page',
  asA: 'registered customer',
  iWant: 'the login button to open the login form',
  soThat: 'I can access my account',
  acceptanceCriteria: ['Clicking the login button opens the login form'],
}

describe('UserStorySchema', () => {
  it('accepts a complete story', () => {
    expect(UserStorySchema.parse(story)).toEqual(story)
  })

  it('trims the text fields', () => {
    expect(UserStorySchema.parse({ ...story, title: '  Log in  ' }).title).toBe('Log in')
  })

  it.each(['title', 'asA', 'iWant', 'soThat'])('rejects a blank %s', (field) => {
    expect(UserStorySchema.safeParse({ ...story, [field]: '   ' }).success).toBe(false)
  })

  it('rejects a story without acceptance criteria', () => {
    expect(UserStorySchema.safeParse({ ...story, acceptanceCriteria: [] }).success).toBe(false)
  })

  it('rejects a blank acceptance criterion', () => {
    expect(UserStorySchema.safeParse({ ...story, acceptanceCriteria: [' '] }).success).toBe(false)
  })
})
