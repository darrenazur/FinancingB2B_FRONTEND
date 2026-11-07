'use client'

import { useState } from 'react'
import { saveLoan } from '../../app/loans/actions'
import type { Loan, LoanLookups, Option } from '../../lib/api/financing'
import { newRequestKey } from '../../lib/requestKey'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

const SECTION_GRID = 'grid gap-5 md:grid-cols-2'

interface LoanFormProps {
  loan: Loan | null
  partners: Option[]
  lookups: LoanLookups
  onClose: () => void
}

export default function LoanForm({ loan, partners, lookups, onClose }: LoanFormProps) {
  const [requestKey] = useState(newRequestKey)
  const { field } = useFields({
    PartnerProfileID: loan ? String(loan.partnerId) : '',
    // The API stores five decimals and takes two.
    PrincipalAmt: loan ? loan.principal.replace(/(\.\d{2})\d*$/, '$1') : '',
    CurrencyCd: loan?.currency ?? 'PHP',
    InterestRate: loan ? String(loan.monthlyRate) : '',
    TermTypeID: loan ? String(loan.termTypeId) : '',
    TenureDurationID: loan ? String(loan.tenureId) : '',
    SettlementStructID: loan ? String(loan.settlementId) : '',
  })

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
        <Field label={t('UI_PARTNER')} hint={t('UI_ONLY_VERIFIED_PARTNERS_CAN_BORROW')}>
          <select {...field('PartnerProfileID')} required className={INPUT}>
            <option value="">{t('UI_SELECT_PARTNER')}</option>
            {partners.map(partner => <option key={partner.id} value={partner.id}>{partner.label}</option>)}
          </select>
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
      </div>
    </FormDialog>
  )
}
