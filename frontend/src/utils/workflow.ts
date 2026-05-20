export const STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  NEED_MORE_INFORMATION: 'Need More Information',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const

export const APPLICATION_TYPES = [
  'Recordation',
  'Renewal',
  'Change of Ownership',
  'Change of Name',
  'Discontinuation',
] as const

export const REVIEW_DECISIONS = [
  STATUSES.APPROVED,
  STATUSES.NEED_MORE_INFORMATION,
  STATUSES.REJECTED,
] as const

export const COMMENT_REQUIRED_DECISIONS = [STATUSES.NEED_MORE_INFORMATION, STATUSES.REJECTED] as const

type StatusKey = keyof typeof STATUSES

export const STATUS_META: Record<string, { label: string; tone: string }> = {
  [STATUSES.DRAFT]: { label: 'Draft', tone: 'neutral' },
  [STATUSES.SUBMITTED]: { label: 'Submitted', tone: 'info' },
  [STATUSES.UNDER_REVIEW]: { label: 'Under Review', tone: 'warning' },
  [STATUSES.NEED_MORE_INFORMATION]: { label: 'Need More Information', tone: 'attention' },
  [STATUSES.APPROVED]: { label: 'Approved', tone: 'success' },
  [STATUSES.REJECTED]: { label: 'Rejected', tone: 'danger' },
}

export function isEditable(status?: string | null): boolean {
  return status === STATUSES.DRAFT || status === STATUSES.NEED_MORE_INFORMATION
}

export function getAvailableActions(status?: string | null): string[] {
  switch (status) {
    case STATUSES.DRAFT:
      return ['edit', 'submit']
    case STATUSES.SUBMITTED:
      return ['startReview']
    case STATUSES.UNDER_REVIEW:
      return ['decision']
    case STATUSES.NEED_MORE_INFORMATION:
      return ['edit', 'resubmit']
    default:
      return []
  }
}

export function isCommentRequired(decision?: string | null): boolean {
  return COMMENT_REQUIRED_DECISIONS.includes(decision as any)
}
