import type { ReportRow } from '../../lib/api/business'
import { formatMoney } from '../../lib/format'
import { formatMonth, trimNumber } from './display'
import { t } from '../../lib/captions/t'

export interface ReportColumn {
  name: string
  label: string
  kind: 'month' | 'text' | 'money' | 'percent'
  // A total line, shown in bold.
  strong?: boolean
}

function show(column: ReportColumn, value: string): string {
  if (!value) return '—'
  if (column.kind === 'month') return formatMonth(value)
  if (column.kind === 'money') return formatMoney(value)
  if (column.kind === 'percent') return `${trimNumber(value)}%`
  return value
}

const negative = (column: ReportColumn, value: string) => column.kind === 'money' && value.startsWith('-')

// The first column stays in view when the table scrolls sideways.
export default function ReportTable({ columns, rows, keyOf }: { columns: ReportColumn[]; rows: ReportRow[]; keyOf: (row: ReportRow) => string }) {
  if (rows.length === 0) return <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>

  return (
    <div className="max-h-[calc(100vh-20rem)] overflow-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-base">
        <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]">
          <tr className="text-sm text-muted">
            {columns.map((column, index) => (
              <th
                key={column.name}
                className={`whitespace-nowrap px-5 py-4 font-medium ${column.kind === 'money' || column.kind === 'percent' ? 'text-right' : ''} ${index === 0 ? 'sticky left-0 bg-surface' : ''}`}
              >
                {t(column.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(row => (
            <tr key={keyOf(row)}>
              {columns.map((column, index) => {
                const value = row[column.name] ?? ''
                return (
                  <td
                    key={column.name}
                    className={[
                      'whitespace-nowrap px-5 py-4',
                      column.kind === 'money' || column.kind === 'percent' ? 'text-right tabular-nums' : '',
                      index === 0 ? 'sticky left-0 bg-surface font-medium text-ink' : 'text-body',
                      column.strong ? 'font-semibold text-ink' : '',
                      negative(column, value) ? 'text-bad' : '',
                    ].join(' ')}
                  >
                    {show(column, value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
