'use client'

import Link from 'next/link'
import { useState } from 'react'
import { closeLoan, processOverdue } from '../../app/loans/actions'
import type { Loan, LoanLookups, Option } from '../../lib/api/financing'
import { compareMoney, formatDate, formatMoney } from '../../lib/format'
import { can } from '../../lib/permissions'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import LoanForm from './LoanForm'
import { CLOSE_LOAN_MESSAGE } from './messages'

const STATUS_TONE = { Deleted: 'bad', Closed: 'neutral', Open: 'good' } as const
const statusLabel = (loan: Loan) => (loan.deleted ? 'Deleted' : loan.closed ? 'Closed' : 'Open')

const COLUMNS: Column<Loan>[] = [
  {
    key: 'partner',
    label: 'Partner',
    text: loan => `${loan.partnerName} ${loan.loanNo}`,
    render: loan => (
      <>
        <p className="whitespace-nowrap">{loan.partnerName}</p>
        <p className="text-sm font-normal text-muted">No. {loan.loanNo}</p>
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
    render: loan => <span className="whitespace-nowrap">{formatDate(loan.maturityDate)}</span>,
    compare: (a, b) => a.maturityDate.localeCompare(b.maturityDate),
  },
  {
    key: 'status',
    label: 'Status',
    filter: 'select',
    text: statusLabel,
    render: loan => <StatusBadge label={statusLabel(loan)} tone={STATUS_TONE[statusLabel(loan)]} />,
  },
  ...auditColumns<Loan>(),
]

interface LoansTableProps {
  loans: Loan[]
  verifiedPartners: Option[]
  lookups: LoanLookups
  permissions: string[]
}

export default function LoansTable({ loans, verifiedPartners, lookups, permissions }: LoansTableProps) {
  const [form, setForm] = useState<Loan | 'new' | null>(null)

  return (
    <>
      <DataTable
        rows={loans}
        columns={COLUMNS}
        rowKey={loan => loan.id}
        toolbar={
          <>
            {can(permissions, 'loan.add') && (
              <button
                onClick={() => setForm('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
              >
                Add
              </button>
            )}
            <RefreshButton />
            {can(permissions, 'overdue.process') && (
              <ConfirmAction
                label="Process overdue"
                title="Process overdue installments?"
                message="This marks every late installment as overdue and charges the late fee, as of today, across all open loans."
                action={processOverdue}
                triggerClass="rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated"
              />
            )}
          </>
        }
        searchLabel="Search loans"
        emptyText="No loans yet."
        minWidth="1600px"
        defaultSort={NEWEST_FIRST}
        rowActions={loan => (
          <div className="flex justify-end gap-2.5">
            <Link href={`/loans/${loan.loanNo}`} className={ROW_BUTTON_NEUTRAL} aria-label={`View loan ${loan.loanNo}`}>
              View
            </Link>
            {!loan.closed && !loan.deleted && (
              <>
                {can(permissions, 'loan.edit') && (
                  <button onClick={() => setForm(loan)} className={ROW_BUTTON_NEUTRAL} aria-label={`Edit loan ${loan.loanNo}`}>
                    Edit
                  </button>
                )}
                {can(permissions, 'loan.close') && (
                  <ConfirmAction
                    label="Close"
                    title={`Close loan ${loan.loanNo}?`}
                    message={CLOSE_LOAN_MESSAGE}
                    action={closeLoan.bind(null, loan.id)}
                    lock={{ type: 'LOAN', id: loan.id }}
                  />
                )}
              </>
            )}
          </div>
        )}
      />

      {form && (
        <LoanForm
          key={form === 'new' ? 'new' : form.id}
          loan={form === 'new' ? null : form}
          partners={verifiedPartners}
          lookups={lookups}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
