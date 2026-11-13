'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { closeLoan, processOverdue } from '../../app/loans/actions'
import type { Loan, LoanLookups, Option } from '../../lib/api/financing'
import { compareMoney, formatDate, formatMoney, sumMoney } from '../../lib/format'
import { can } from '../../lib/permissions'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import LoanForm from './LoanForm'
import { daysLate, isOverdue, loanStatusLabel, loanStatusTone } from './loanStatus'
import { CLOSE_LOAN_MESSAGE } from './messages'
import { t } from '../../lib/captions/t'

const totalPayment = (loan: Loan) => sumMoney([loan.principal, loan.interest])
const balance = (loan: Loan) => totalPayment(loan) - sumMoney([loan.paid])
// Once a payment is in, the terms can't change; remarks and the note change on the loan page.
const hasPayments = (loan: Loan) => sumMoney([loan.paid]) > BigInt(0)

const BASE_COLUMNS: Column<Loan>[] = [
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
    key: 'totalPayment',
    label: 'UI_TOTAL_PAYMENT',
    align: 'right',
    text: loan => formatMoney(totalPayment(loan), loan.currency),
    compare: (a, b) => Number(totalPayment(a) > totalPayment(b)) - Number(totalPayment(a) < totalPayment(b)),
  },
  {
    key: 'paid',
    label: 'UI_TOTAL_AMOUNT_PAID',
    align: 'right',
    text: loan => formatMoney(loan.paid, loan.currency),
    compare: (a, b) => compareMoney(a.paid, b.paid),
  },
  {
    key: 'balance',
    label: 'UI_BALANCE',
    align: 'right',
    text: loan => formatMoney(balance(loan), loan.currency),
    compare: (a, b) => Number(balance(a) > balance(b)) - Number(balance(a) < balance(b)),
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
    key: 'started',
    label: 'UI_DATE_STARTED',
    text: loan => formatDate(loan.releaseDate),
    render: loan => <span className="whitespace-nowrap">{formatDate(loan.releaseDate)}</span>,
    compare: (a, b) => a.releaseDate.localeCompare(b.releaseDate),
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
    text: loanStatusLabel,
    render: loan => (
      <>
        <StatusBadge label={loanStatusLabel(loan)} tone={loanStatusTone(loan)} />
        {isOverdue(loan) && (
          <p className="mt-1 whitespace-nowrap text-sm text-muted">{t('UI_DAYS_LATE', { days: daysLate(loan) })}</p>
        )}
      </>
    ),
  },
  {
    key: 'note',
    label: 'UI_PROMISSORY_NOTE',
    filter: 'select',
    text: loan => (loan.hasPromissoryNote ? t('UI_YES') : t('UI_NONE_ON_FILE')),
  },
]

interface LoansTableProps {
  loans: Loan[]
  verifiedPartners: Option[]
  lookups: LoanLookups
  users: Option[]
  permissions: string[]
}

export default function LoansTable({ loans, verifiedPartners, lookups, users, permissions }: LoansTableProps) {
  const [form, setForm] = useState<Loan | 'new' | null>(null)

  // Only users who can assign see whose care each loan is in (the partner's agent).
  const canAssign = can(permissions, 'partner.assign')
  const columns = useMemo<Column<Loan>[]>(() => {
    if (!canAssign) return [...BASE_COLUMNS, ...auditColumns<Loan>()]
    const assignedTo = (loan: Loan) =>
      loan.assignedUserId === null ? t('UI_UNASSIGNED') : users.find(user => user.id === loan.assignedUserId)?.label ?? '—'
    return [...BASE_COLUMNS, { key: 'assigned', label: 'UI_ASSIGNED_TO', filter: 'select', text: assignedTo }, ...auditColumns<Loan>()]
  }, [canAssign, users])

  return (
    <>
      <DataTable
        rows={loans}
        columns={columns}
        rowKey={loan => loan.id}
        toolbar={
          <>
            {can(permissions, 'loan.add') && (
              <button
                onClick={() => setForm('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover"
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
        minWidth="1720px"
        defaultSort={NEWEST_FIRST}
        rowActions={loan => (
          <div className="flex justify-end gap-2.5">
            <Link href={`/loans/${loan.loanNo}`} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_VIEW_LOAN', { loanNo: loan.loanNo })}>
              {t('UI_VIEW')}
            </Link>
            {!loan.closed && !loan.deleted && (
              <>
                {can(permissions, 'loan.edit') && !hasPayments(loan) && (
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
          canBackdate={can(permissions, 'loan.backdate')}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
