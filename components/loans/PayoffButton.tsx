'use client'

import { useState } from 'react'
import { payOffLoan } from '../../app/loans/actions'
import type { FeeSetting, Installment } from '../../lib/api/financing'
import { formatMoney, manilaToday, sumMoney, toAmount } from '../../lib/format'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

const ZERO = BigInt(0)

interface PayoffButtonProps {
  loanId: number
  loanNo: string
  currency: string
  installments: Installment[]
  // Unpaid late fees, as a plain amount: they stay owed and are paid first
  lateFees: string
  feeSetting: FeeSetting | null
  className: string
}

export default function PayoffButton(props: PayoffButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className={props.className}>{t('UI_PAY_OFF_EARLY')}</button>
      {open && <PayoffForm {...props} onClose={() => setOpen(false)} />}
    </>
  )
}

// The same numbers as LOANPAYOFF_SP: interest is paid before principal on each installment, so what was paid
// covers the interest first. The SP checks everything again when saving.
function PayoffForm({ loanId, loanNo, currency, installments, lateFees, feeSetting, onClose }: PayoffButtonProps & { onClose: () => void }) {
  const money = (value: string | bigint) => formatMoney(value, currency)
  const today = manilaToday()
  const live = installments.filter(item => item.status !== 'CANCELLED')
  const split = live.map(item => {
    const paid = sumMoney([item.paid])
    const interest = sumMoney([item.interest])
    const interestPaid = paid < interest ? paid : interest
    return { ...item, interestPaid, principalLeft: sumMoney([item.principal]) - (paid - interestPaid), interestLeft: interest - interestPaid }
  })
  const lastNo = Math.max(0, ...split.map(item => item.number))
  // Already due, interest paid, or no longer open: these keep their interest
  const minKeep = Math.max(1, ...split
    .filter(item => item.dueDate.slice(0, 10) <= today || item.interestPaid > ZERO || item.status !== 'ACTIVE')
    .map(item => item.number))

  const { values, field } = useFields({
    InterestInstallments: String(minKeep),
    PretermFeeType: feeSetting?.type ?? '',
    PretermFeeValue: feeSetting?.value ?? '',
    Reason: '',
  })

  const keep = Number(values.InterestInstallments)
  const principalLeft = split.reduce((total, item) => total + item.principalLeft, ZERO)
  const interestKept = split.filter(item => item.number <= keep).reduce((total, item) => total + item.interestLeft, ZERO)
  const interestCancelled = split.filter(item => item.number > keep).reduce((total, item) => total + sumMoney([item.interest]), ZERO)
  const fees = sumMoney([lateFees])
  const toPay = principalLeft + interestKept + fees
  const fee = feeOf(toAmount(principalLeft), values.PretermFeeType, values.PretermFeeValue)
  const counts = Array.from({ length: lastNo - minKeep + 1 }, (_, index) => minKeep + index)

  const rows: [string, string, string?][] = [
    [t('UI_PAYOFF_PRINCIPAL_LEFT'), money(principalLeft)],
    [t('UI_PAYOFF_INTEREST_KEPT', { number: keep }), money(interestKept)],
    ...(fees > ZERO ? [[t('UI_PAYOFF_LATE_FEES'), money(fees)] as [string, string]] : []),
    [t('UI_PAYOFF_TO_PAY'), money(toPay), t('UI_PAYOFF_TO_PAY_WORKING', { principal: money(principalLeft), interest: money(interestKept), fees: money(fees) })],
    ...(fee !== null && fee > ZERO ? [[t('UI_PAYOFF_FEE_RECEIVED'), money(fee), values.PretermFeeType === 'PCT'
      ? t('UI_PAYOFF_FEE_WORKING_PCT', { principal: money(principalLeft), pct: `${values.PretermFeeValue}%` })
      : undefined] as [string, string, string?]] : []),
    [keep < lastNo ? t('UI_PAYOFF_INTEREST_CANCELLED', { from: keep + 1, to: lastNo }) : t('UI_INTEREST_CANCELLED'), money(interestCancelled)],
  ]

  return (
    <FormDialog title={t('UI_PAY_OFF_LOAN', { loanNo })} action={payOffLoan.bind(null, loanId)} onClose={onClose} lock={{ type: 'LOAN', id: loanId }} wide>
      <p className="text-base text-muted">{t('UI_PAYOFF_INTRO')}</p>
      <Field label={t('UI_PAYOFF_KEEP')} hint={t('UI_PAYOFF_KEEP_HINT')}>
        <select {...field('InterestInstallments')} required className={INPUT}>
          {counts.map(count => <option key={count} value={count}>{t('UI_PAYOFF_KEEP_OPTION', { count, total: lastNo })}</option>)}
        </select>
      </Field>
      <Field label={t('UI_PRETERM_FEE')} hint={feeSetting ? t('UI_PRETERM_FEE_FROM_SETTINGS') : undefined}>
        <select {...field('PretermFeeType')} disabled={Boolean(feeSetting)} className={INPUT}>
          <option value="">{t('UI_FEE_NONE')}</option>
          <option value="AMT">{t('UI_FEE_AMOUNT')}</option>
          <option value="PCT">{t('UI_PRETERM_FEE_PERCENT')}</option>
        </select>
      </Field>
      {values.PretermFeeType && (
        <Field label={t('UI_FEE_VALUE')} hint={t('UI_PAYOFF_FEE_NOTE')}>
          <input
            {...field('PretermFeeValue', decimalOnly(2))}
            disabled={Boolean(feeSetting)}
            required
            inputMode="decimal"
            pattern="\d{1,13}(\.\d{1,2})?"
            title={t('UI_AN_AMOUNT_WITH_UP_TO_2_DECIMAL_PLACES_WITHOUT_COMMAS')}
            className={INPUT}
          />
        </Field>
      )}
      <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-line bg-elevated p-5 sm:grid-cols-[1fr_max-content]">
        {rows.map(([label, value, working]) => (
          <div key={label} className="contents">
            <dt className="text-base text-body">
              {label}
              {working && <span className="block text-sm text-muted">{working}</span>}
            </dt>
            <dd className="text-right text-base font-medium tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <Field label={t('UI_REASON')}>
        <textarea {...field('Reason')} required rows={3} maxLength={500} className={INPUT} />
      </Field>
    </FormDialog>
  )
}

// The fee in pesos, the same as the SP: a % is principal still owed x % / 100, rounded to centavos. null = can't work it out yet
function feeOf(principal: string, type: string, value: string): bigint | null {
  const amount = /^\d{1,13}(\.\d{1,2})?$/
  if (!type || !amount.test(principal) || !amount.test(value)) return null
  const scaled = type === 'PCT' ? (sumMoney([principal]) * sumMoney([value])) / BigInt(10000000) : sumMoney([value])
  return ((scaled + BigInt(500)) / BigInt(1000)) * BigInt(1000)
}
