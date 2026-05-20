import { STATUS_META } from '../utils/workflow'

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', tone: 'neutral' }

  return <span className={`status-badge status-badge--${meta.tone}`}>{meta.label}</span>
}
