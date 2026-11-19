'use client'

import { useState } from 'react'
import { saveLoan } from '../../app/loans/actions'
import type { BizOption } from '../../lib/api/business'
import type { Loan, LoanLookups, Option } from '../../lib/api/financing'
import { daysBetween, formatDate, formatMoney, manilaToday, sumMoney } from '../../lib/format'
import { newRequestKey } from '../../lib/requestKey'
import DatePicker from '../forms/DatePicker'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import TablePicker from '../forms/TablePicker'
import CoMakerList from './CoMakerFields'
import PromissoryNoteFields from './PromissoryNoteFields'
import { t } from '../../lib/captions/t'

const SECTION_GRID = 'grid gap-5 md:grid-cols-2'

interface LoanFormProps {
  loan: Loan | null
  partners: Option[]
  openLoans: Record<number, number>
  lookups: LoanLookups
  canBackdate: boolean
  onClose: () => void
}

export default function LoanForm({ loan, partners, openLoans, lookups, canBackdate, onClose }: LoanFormProps) {
  const [requestKey] = useState(newRequestKey)
  const today = manilaToday()
  const savedDate = loan?.releaseDate.slice(0, 10) ?? today
  const [releaseDate, setReleaseDate] = useState(savedDate)
  const [confirmed, setConfirmed] = useState(false)
  const { values, setValues, field } = useFields({
    PartnerProfileID: loan ? String(loan.partnerId) : '',
    // The API stores five decimals and takes two.
    PrincipalAmt: loan ? loan.principal.replace(/(\.\d{2})\d*$/, '$1') : '',
    CurrencyCd: loan?.currency ?? 'PHP',
    InterestRate: loan ? String(loan.monthlyRate) : '',
    TermTypeID: loan ? String(loan.termTypeId) : '',
    TenureDurationID: loan ? String(loan.tenureId) : '',
    SettlementStructID: loan ? String(loan.settlementId) : '',
    BackdateReason: '',
    ProcessingFeeType: loan ? loan.processingFeeType ?? '' : lookups.feeSetting?.type ?? '',
    ProcessingFeeValue: loan ? (loan.processingFeeType ? loan.processingFeeValue.replace(/(\.\d{2})\d*$/, '$1') : '') : lookups.feeSetting?.value ?? '',
    ProcessingFeeDeducted: loan && loan.processingFeeType ? (loan.processingFeeDeducted ? '1' : '0') : '1',
  })

  // The chosen partner's credit score, as advice only: any amount can still be saved
  const score = lookups.scores[Number(values.PartnerProfileID)]
  const scoreHint = score
    ? t('UI_LOAN_SCORE_HINT', {
        grade: score.grade === 'NEW' ? t('UI_GRADE_NEW') : t('UI_GRADE_AND_SCORE', { grade: score.grade, score: String(Number(score.finalScore.toFixed(2))) }),
        max: formatMoney(score.suggestedMax),
      })
    : undefined

  // The partner picker: sortable by grade, score, suggested max and open loans
  const partnerOptions: BizOption[] = partners.map(partner => {
    const s = lookups.scores[partner.id]
    const scored = Boolean(s && s.grade !== 'NEW')
    const open = openLoans[partner.id] ?? 0
    return {
      value: String(partner.id),
      label: partner.label,
      code: '',
      cells: [
        { text: partner.label },
        { text: s ? (scored ? s.grade : t('UI_GRADE_NEW')) : '—' },
        { text: scored ? String(Number(s.finalScore.toFixed(2))) : '—', sort: scored ? s.finalScore : -1 },
        { text: s ? formatMoney(s.suggestedMax) : '—', sort: s ? Number(s.suggestedMax) : -1 },
        { text: String(open), sort: open },
      ],
    }
  })

  // Fixed in Business Settings: a new loan takes it, an edited loan keeps what it was saved with
  const feeLocked = Boolean(lookups.feeSetting)
  const fee = feeOf(values.PrincipalAmt, values.ProcessingFeeType, values.ProcessingFeeValue)
  const feeHint = fee === null || fee <= BigInt(0) ? undefined
    : values.ProcessingFeeDeducted === '1'
      ? t('UI_FEE_WORKING', { fee: formatMoney(fee), net: formatMoney(sumMoney([values.PrincipalAmt]) - fee), principal: formatMoney(values.PrincipalAmt) })
      : t('UI_FEE_WORKING_SEPARATE', { fee: formatMoney(fee), principal: formatMoney(values.PrincipalAmt) })

  return (
    <FormDialog
      title={loan ? t('UI_EDIT_LOAN', { loanNo: loan.loanNo }) : t('UI_ADD_LOAN')}
      action={saveLoan.bind(null, loan?.id ?? null, requestKey)}
      onClose={onClose}
      lock={loan ? { type: 'LOAN', id: loan.id } : undefined}
      wide
    >
      {loan ? (
        <>
          <input type="hidden" {...field('PartnerProfileID')} />
          <Field label={t('UI_PARTNER')} hint={t('UI_A_LOAN_CANT_BE_EDITED_AFTER_A_PAYMENT_IS_RECORDED')}>
            <input value={loan.partnerName} readOnly className={`${INPUT} bg-elevated text-muted`} />
          </Field>
        </>
      ) : (
        <Field label={t('UI_PARTNER')} hint={scoreHint ?? t('UI_ONLY_VERIFIED_PARTNERS_CAN_BORROW')}>
          <TablePicker
            name="PartnerProfileID"
            value={values.PartnerProfileID}
            required
            headers={[t('UI_NAME'), t('UI_GRADE'), t('UI_SCORE'), t('UI_SUGGESTED_MAX'), t('UI_OPEN_LOANS')]}
            options={partnerOptions}
            searchLabel={t('UI_SEARCH_PARTNERS')}
            onChange={picked => setValues(current => ({ ...current, PartnerProfileID: picked }))}
          />
        </Field>
      )}

      <div className={SECTION_GRID}>
        <Field label={t('UI_PRINCIPAL')}>
          <input
            {...field('PrincipalAmt', decimalOnly(2))}
            required
            inputMode="decimal"
            pattern="\d{1,13}(\.\d{1,2})?"
            title={t('UI_AN_AMOUNT_WITH_UP_TO_2_DECIMAL_PLACES_WITHOUT_COMMAS')}
            className={INPUT}
          />
        </Field>
        <Field label={t('UI_CURRENCY')}>
          <select {...field('CurrencyCd')} required className={INPUT}>
            {lookups.currencies.map(code => <option key={code}>{code}</option>)}
          </select>
        </Field>
        <Field label={t('UI_INTEREST_RATE_A_MONTH')}>
          <input
            {...field('InterestRate', decimalOnly(5))}
            required
            inputMode="decimal"
            pattern="\d{1,13}(\.\d{1,5})?"
            title={t('UI_A_RATE_WITH_UP_TO_5_DECIMAL_PLACES')}
            className={INPUT}
          />
        </Field>
        <Field label={t('UI_PAYMENT_TERM')}>
          <select {...field('TermTypeID')} required className={INPUT}>
            <option value="">{t('UI_SELECT_TERM')}</option>
            {lookups.terms.map(term => <option key={term.id} value={term.id}>{term.label}</option>)}
          </select>
        </Field>
        <Field label={t('UI_TENURE')}>
          <select {...field('TenureDurationID')} required className={INPUT}>
            <option value="">{t('UI_SELECT_TENURE')}</option>
            {lookups.tenures.map(tenure => <option key={tenure.id} value={tenure.id}>{tenure.label}</option>)}
          </select>
        </Field>
        <Field label={t('UI_SETTLEMENT_STRUCTURE')}>
          <select {...field('SettlementStructID')} required className={INPUT}>
            <option value="">{t('UI_SELECT_STRUCTURE')}</option>
            {lookups.settlements.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        {canBackdate && (
          <Field label={t('UI_RELEASE_DATE')} hint={t('UI_RELEASE_DATE_HINT')}>
            <DatePicker name="ReleaseDate" value={releaseDate} onChange={setReleaseDate} max={today} required />
          </Field>
        )}
        {releaseDate !== savedDate && (
          <Field label={t('UI_REASON_FOR_THE_PAST_DATE')}>
            <input {...field('BackdateReason')} required maxLength={500} className={INPUT} />
          </Field>
        )}
      </div>
      <div className={SECTION_GRID}>
        <Field label={t('UI_PROCESSING_FEE')} hint={feeLocked ? t(loan ? 'UI_FEE_KEPT_ON_EDIT' : 'UI_FEE_FROM_SETTINGS') : undefined}>
          <select {...field('ProcessingFeeType')} disabled={feeLocked} className={INPUT}>
            <option value="">{t('UI_FEE_NONE')}</option>
            <option value="AMT">{t('UI_FEE_AMOUNT')}</option>
            <option value="PCT">{t('UI_FEE_PERCENT')}</option>
          </select>
        </Field>
        {values.ProcessingFeeType && (
          <Field label={t('UI_FEE_VALUE')} hint={feeHint}>
            <input
              {...field('ProcessingFeeValue', decimalOnly(2))}
              disabled={feeLocked}
              required
              inputMode="decimal"
              pattern="\d{1,13}(\.\d{1,2})?"
              className={INPUT}
            />
          </Field>
        )}
        {fee !== null && fee > BigInt(0) && (
          <Field label={t('UI_FEE_COLLECTED')}>
            <select {...field('ProcessingFeeDeducted')} className={INPUT}>
              <option value="1">{t('UI_FEE_DEDUCTED')}</option>
              <option value="0">{t('UI_FEE_PAID_SEPARATELY')}</option>
            </select>
          </Field>
        )}
      </div>
      {releaseDate !== savedDate && (
        <label className="flex items-start gap-3 text-base text-body">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={event => setConfirmed(event.target.checked)}
            required
            className="mt-1 h-4 w-4"
          />
          {t('UI_RELEASE_DATE_CONFIRM', { date: formatDate(releaseDate), days: daysBetween(releaseDate, today) })}
        </label>
      )}
      <PromissoryNoteFields loan={loan} purposes={lookups.purposes} />
      {!loan && <CoMakerList partnerId={values.PartnerProfileID} required={lookups.coMakerRequired} />}
    </FormDialog>
  )
}

// The fee in pesos, the same as the SP: a % is principal x % / 100, rounded to centavos. null = can't work it out yet
function feeOf(principal: string, type: string, value: string): bigint | null {
  const amount = /^\d{1,13}(\.\d{1,2})?$/
  if (!type || !amount.test(principal) || !amount.test(value)) return null
  const scaled = type === 'PCT' ? (sumMoney([principal]) * sumMoney([value])) / BigInt(10000000) : sumMoney([value])
  return ((scaled + BigInt(500)) / BigInt(1000)) * BigInt(1000)
}
