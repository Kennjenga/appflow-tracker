import React from 'react'
import { STATUS_META } from '../utils/workflow'

type Props = { status?: string | null }

export default function StatusBadge({ status }: Props) {
  const meta = STATUS_META[status as string] || { label: status || 'Unknown', tone: 'neutral' }

  return (
    <span className={`status-badge status-badge--${meta.tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
