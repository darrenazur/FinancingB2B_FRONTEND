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
import { t } from '../../lib/captions/t'

const statusLabel = (loan: Loan) => (loan.deleted ? t('UI_DELETED_2') : loan.closed ? t('UI_CLOSED_2') : t('UI_OPEN'))

const COLUMNS: Column<Loan>[] = [
  {
    key: 'partner',
    label: 'UI_PARTNER',
    text: loan => `${loan.partnerName} ${loan.loanNo}`,
    render: loan => (
      <>
        <p className="whitespace-nowrap">{loan.partnerName}</p>
        <p className="text-sm font-normal text-muted">{t('UI_NO')}{' '}{loan.loanNo}</p>
      </>
    ),
  },
  {
    key: 'principal',
    label: 'UI_PRINCIPAL',
    align: 'right',
    text: loan => formatMoney(loan.principal, loan.currency),
    compare: (a, b) => compareMoney(a.principal, b.principal),
  },
  {
    key: 'interest',
    label: 'UI_INTEREST',
    align: 'right',
    text: loan => formatMoney(loan.interest, loan.currency),
    compare: (a, b) => compareMoney(a.interest, b.interest),
  },
  {
    key: 'terms',
    label: 'UI_TERMS',
    text: loan => t('UI_A_MONTH_MONTHS', { term: loan.term, monthlyRate: loan.monthlyRate, durationMonths: loan.durationMonths }),
    render: loan => (
      <>
        <p>{loan.term}</p>
        <p className="whitespace-nowrap text-sm text-muted">{loan.monthlyRate}{t('UI_A_MONTH')}{' '}{loan.durationMonths}{' '}{t('UI_MONTHS')}</p>
      </>
    ),
  },
  {
    key: 'maturity',
    label: 'UI_MATURITY',
    text: loan => formatDate(loan.maturityDate),
    render: loan => <span className="whitespace-nowrap">{formatDate(loan.maturityDate)}</span>,
    compare: (a, b) => a.maturityDate.localeCompare(b.maturityDate),
  },
  {
    key: 'status',
    label: 'UI_STATUS',
    filter: 'select',
    text: statusLabel,
    render: loan => <StatusBadge label={statusLabel(loan)} tone={loan.deleted ? 'bad' : loan.closed ? 'neutral' : 'good'} />,
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
                {t('UI_ADD')}
              </button>
            )}
            <RefreshButton />
            {can(permissions, 'overdue.process') && (
              <ConfirmAction
                label={t('UI_PROCESS_OVERDUE')}
                title={t('UI_PROCESS_OVERDUE_INSTALLMENTS')}
                message={t('UI_THIS_MARKS_EVERY_LATE_INSTALLMENT_AS_OVERDUE_AND_CHARGES')}
                action={processOverdue}
                triggerClass="rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated"
              />
            )}
          </>
        }
        searchLabel={t('UI_SEARCH_LOANS')}
        emptyText={t('UI_NO_LOANS_YET')}
        minWidth="1600px"
        defaultSort={NEWEST_FIRST}
        rowActions={loan => (
          <div className="flex justify-end gap-2.5">
            <Link href={`/loans/${loan.loanNo}`} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_VIEW_LOAN', { loanNo: loan.loanNo })}>
              {t('UI_VIEW')}
            </Link>
            {!loan.closed && !loan.deleted && (
              <>
                {can(permissions, 'loan.edit') && (
                  <button onClick={() => setForm(loan)} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_EDIT_LOAN', { loanNo: loan.loanNo })}>
                    {t('UI_EDIT')}
                  </button>
                )}
                {can(permissions, 'loan.close') && (
                  <ConfirmAction
                    label={t('UI_CLOSE')}
                    title={t('UI_CLOSE_LOAN', { loanNo: loan.loanNo })}
                    message={t(CLOSE_LOAN_MESSAGE)}
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
