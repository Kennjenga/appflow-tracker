import { describe, expect, it } from 'vitest'
import { STATUSES, getAvailableActions, isCommentRequired, isEditable } from './workflow'

describe('workflow helpers', () => {
  it('returns the allowed actions for each active status', () => {
    expect(getAvailableActions(STATUSES.DRAFT)).toEqual(['edit', 'submit'])
    expect(getAvailableActions(STATUSES.SUBMITTED)).toEqual(['startReview'])
    expect(getAvailableActions(STATUSES.UNDER_REVIEW)).toEqual(['decision'])
    expect(getAvailableActions(STATUSES.NEED_MORE_INFORMATION)).toEqual(['edit', 'resubmit'])
  })

  it('does not allow terminal statuses to be edited or actioned', () => {
    expect(isEditable(STATUSES.APPROVED)).toBe(false)
    expect(isEditable(STATUSES.REJECTED)).toBe(false)
    expect(getAvailableActions(STATUSES.APPROVED)).toEqual([])
    expect(getAvailableActions(STATUSES.REJECTED)).toEqual([])
  })

  it('requires comments for rejected and need-more-information decisions', () => {
    expect(isCommentRequired(STATUSES.APPROVED)).toBe(false)
    expect(isCommentRequired(STATUSES.REJECTED)).toBe(true)
    expect(isCommentRequired(STATUSES.NEED_MORE_INFORMATION)).toBe(true)
  })
})
