import Link from 'next/link'
import type { ReportRow } from '../../lib/api/business'
import { formatMoney } from '../../lib/format'
import { t } from '../../lib/captions/t'

// Each loan that paid on one day, net of reversals. A negative amount reverses an earlier day's payment.
export default function PaidList({ rows }: { rows: ReportRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map(row => (
        <li key={row.FinancingInformationID}>
          <Link
            href={`/loans/${row.LoanNo}`}
            className="-mx-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-xl px-3 py-4 hover:bg-elevated"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-ink">{row.PartnerName}</p>
              <p className="text-sm text-muted">{t('UI_LOAN_PAYMENTS_COUNT', { loanNo: row.LoanNo, count: row.Payments })}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-ink">{formatMoney(row.AmountPaid || '0', row.CurrencyCd?.trim() || 'PHP')}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
