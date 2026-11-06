import { formatDateTime } from '../../lib/format'

export default function AuditCell({ date, by }: { date: string; by: string }) {
  if (!date && !by) return <span className="text-muted">None</span>

  return (
    <>
      <p className="whitespace-nowrap">{date && formatDateTime(date)}</p>
      <p className="text-sm text-muted">{by}</p>
    </>
  )
}
