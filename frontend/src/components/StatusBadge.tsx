import React from 'react'
import { STATUS_META } from '../utils/workflow'

type Props = { status?: string | null }

const TONE_CLASSES: Record<string, { badge: string; dot: string }> = {
  neutral: {
    badge: 'bg-surface-container-highest text-on-surface-variant',
    dot: 'bg-outline',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-600',
  },
  interaction: {
    badge: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-600',
  },
  warning: {
    badge: 'bg-[#fef3c7] text-[#92400e]',
    dot: 'bg-[#d97706]',
  },
  attention: {
    badge: 'bg-[#fef3c7] text-[#92400e]',
    dot: 'bg-[#d97706]',
  },
  success: {
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-600',
  },
  danger: {
    badge: 'bg-error-container text-on-error-container',
    dot: 'bg-error',
  },
}

export default function StatusBadge({ status }: Props) {
  const meta = STATUS_META[status as string] || { label: status || 'Unknown', tone: 'neutral' }
  const classes = TONE_CLASSES[meta.tone] || TONE_CLASSES.neutral

  return (
    <span className={`inline-flex items-center gap-1.5 min-h-[26px] px-2.5 rounded text-xs font-semibold tracking-wide whitespace-nowrap ${classes.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${classes.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
