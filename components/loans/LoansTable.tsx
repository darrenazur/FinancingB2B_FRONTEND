'use client'

import { closeLoan } from '../../app/loans/actions'
import type { Loan } from '../../lib/api/financing'
import { compareMoney, formatDate, formatMoney } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import StatusBadge from '../StatusBadge'
import DataTable, { Column } from '../table/DataTable'

const STATUS_TONE = { Deleted: 'bad', Closed: 'neutral', Open: 'good' } as const
const statusLabel = (loan: Loan) => (loan.deleted ? 'Deleted' : loan.closed ? 'Closed' : 'Open')

const COLUMNS: Column<Loan>[] = [
  {
    key: 'partner',
    label: 'Partner',
    text: loan => `${loan.partnerName} Loan ${loan.id}`,
    render: loan => (
      <>
        <p className="whitespace-nowrap">{loan.partnerName}</p>
        <p className="text-sm font-normal text-muted">Loan {loan.id}</p>
      </>
    ),
  },
  {
    key: 'principal',
    label: 'Principal',
    align: 'right',
    text: loan => formatMoney(loan.principal, loan.currency),
    compare: (a, b) => compareMoney(a.principal, b.principal),
  },
  {
    key: 'interest',
    label: 'Interest',
    align: 'right',
    text: loan => formatMoney(loan.interest, loan.currency),
    compare: (a, b) => compareMoney(a.interest, b.interest),
  },
  {
    key: 'terms',
    label: 'Terms',
    text: loan => `${loan.term} ${loan.monthlyRate}% a month, ${loan.durationMonths} months`,
    render: loan => (
      <>
        <p>{loan.term}</p>
        <p className="whitespace-nowrap text-sm text-muted">{loan.monthlyRate}% a month, {loan.durationMonths} months</p>
      </>
    ),
  },
  {
    key: 'maturity',
    label: 'Maturity',
    text: loan => formatDate(loan.maturityDate),
    compare: (a, b) => a.maturityDate.localeCompare(b.maturityDate),
  },
  {
    key: 'status',
    label: 'Status',
    filter: 'select',
    text: statusLabel,
    render: loan => <StatusBadge label={statusLabel(loan)} tone={STATUS_TONE[statusLabel(loan)]} />,
  },
]

export default function LoansTable({ loans }: { loans: Loan[] }) {
  return (
    <DataTable
      rows={loans}
      columns={COLUMNS}
      rowKey={loan => loan.id}
      toolbar={<RefreshButton />}
      searchLabel="Search loans"
      emptyText="No loans yet."
      minWidth="1100px"
      rowActions={loan => !loan.closed && !loan.deleted && (
        <ConfirmAction
          label="Close"
          title={`Close loan ${loan.id}?`}
          message="A fully paid loan closes. A loan with no payments is cancelled. A partly paid or overdue loan can't be closed. This can't be undone here."
          action={closeLoan.bind(null, loan.id)}
        />
      )}
    />
  )
}
