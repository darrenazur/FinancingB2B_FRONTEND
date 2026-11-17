'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deleteBizRecord } from '../../app/business/actions'
import type { BizOption, CbfBackingLoan } from '../../lib/api/business'
import { BizSource, findBizResource } from '../../lib/business/resources'
import ConfirmAction from '../actions/ConfirmAction'
import StatusBadge from '../StatusBadge'
import BizForm from './BizForm'
import { displayValue } from './display'
import { t } from '../../lib/captions/t'

interface CbfContractLoansProps {
  contractId: string
  maturityDate: string
  loans: CbfBackingLoan[]
  options: Partial<Record<BizSource, BizOption[]>>
  canEdit: boolean
}

const lowGrade = (grade: string) => grade !== '' && !['A', 'B'].includes(grade)

// Overdue first, then a last due date after the contract's maturity: either one may leave the payout short
function check(loan: CbfBackingLoan, maturityDate: string): { label: string; bad: boolean } {
  if (loan.isOverdue) return { label: t('UI_OVERDUE'), bad: true }
  if (loan.lastDue && maturityDate && loan.lastDue > maturityDate) return { label: t('UI_ENDS_AFTER_MATURITY'), bad: true }
  return { label: t('UI_ENDS_BEFORE_MATURITY'), bad: false }
}

// The loans backing one contract, with Add (contract already chosen) and Remove
export default function CbfContractLoans({ contractId, maturityDate, loans, options, canEdit }: CbfContractLoansProps) {
  const [adding, setAdding] = useState(false)
  const resource = findBizResource('cbf-loan')
  const headers = ['UI_LOAN_NUMBER', 'UI_CLIENT', 'UI_BACKS', 'UI_LOAN_PRINCIPAL_LEFT', 'UI_GRADE', 'UI_LAST_DUE', 'UI_CHECK']

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{t('UI_BACKED_BY_LOANS')}</h2>
        {canEdit && resource && (
          <button
            onClick={() => setAdding(true)}
            className="ml-auto rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover"
          >
            {t('UI_ADD_LOAN')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[60rem] text-left">
          <thead>
            <tr className="text-sm text-muted">
              {headers.map(header => <th key={header} className="px-5 pb-2 pt-4 font-medium">{t(header)}</th>)}
              {canEdit && <th className="px-5 pb-2 pt-4"><span className="sr-only">{t('UI_REMOVE')}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base">
            {loans.map(loan => {
              const status = check(loan, maturityDate)
              return (
                <tr key={loan.id}>
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/loans/${loan.loanNo}`} className="hover:underline">{loan.loanNo}</Link>
                  </td>
                  <td className="px-5 py-4 text-body">{loan.client}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-body">{displayValue('money', loan.amount)}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-body">{displayValue('money', loan.principalLeft)}</td>
                  <td className={`px-5 py-4 ${lowGrade(loan.grade) ? 'font-semibold text-bad' : 'text-body'}`}>
                    {lowGrade(loan.grade) ? `⚠ ${loan.grade}` : loan.grade}
                  </td>
                  <td className="px-5 py-4 text-body">{displayValue('date', loan.lastDue)}</td>
                  <td className="px-5 py-4"><StatusBadge label={status.label} tone={status.bad ? 'bad' : 'good'} /></td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <ConfirmAction
                        label={t('UI_REMOVE')}
                        title={t('UI_REMOVE_2', { row: loan.client })}
                        message={t('UI_BIZ_REMOVE_MESSAGE')}
                        reasonLabel={t('UI_REASON_FOR_REMOVING')}
                        action={deleteBizRecord.bind(null, 'cbf-loan', loan.id)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
            {loans.length === 0 && (
              <tr>
                <td colSpan={headers.length + (canEdit ? 1 : 0)} className="px-5 py-10 text-center text-muted">{t('UI_NO_BACKING_LOANS')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && resource && (
        <BizForm
          resource={resource}
          row={null}
          title={t('UI_ADD_LOAN')}
          options={options}
          fixed={{ BizCbfID: contractId }}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  )
}
