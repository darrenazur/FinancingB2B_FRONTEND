import { Audit } from '../../lib/audit'
import { formatDateTime } from '../../lib/format'
import AuditCell from './AuditCell'
import type { Column, Sort } from './DataTable'

export const NEWEST_FIRST: Sort = { key: 'created', direction: 'desc' }

const text = (date: string, by: string) => `${date && formatDateTime(date)} ${by}`.trim()

export function auditColumns<Row extends Audit>(): Column<Row>[] {
  return [
    {
      key: 'created',
      label: 'Created',
      text: row => text(row.createdAt, row.createdBy),
      render: row => <AuditCell date={row.createdAt} by={row.createdBy} />,
      compare: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      key: 'updated',
      label: 'Updated',
      text: row => text(row.updatedAt, row.updatedBy),
      render: row => <AuditCell date={row.updatedAt} by={row.updatedBy} />,
      compare: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
    },
  ]
}
