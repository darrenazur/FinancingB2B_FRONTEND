import { Audit } from '../../lib/audit'
import { formatDateTime } from '../../lib/format'
import AuditCell from './AuditCell'
import type { Column, Sort } from './DataTable'
import { t } from '../../lib/captions/t'

export const NEWEST_FIRST: Sort = { key: 'created', direction: 'desc' }

const text = (date: string, by: string) => `${date && formatDateTime(date)} ${by}`.trim()

export function auditColumns<Row extends Audit>(): Column<Row>[] {
  return [
    {
      key: 'created',
      label: t('UI_CREATED'),
      text: row => text(row.createdAt, row.createdBy),
      render: row => <AuditCell date={row.createdAt} by={row.createdBy} />,
      compare: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      key: 'updated',
      label: t('UI_UPDATED'),
      text: row => text(row.updatedAt, row.updatedBy),
      render: row => <AuditCell date={row.updatedAt} by={row.updatedBy} />,
      compare: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
    },
  ]
}
