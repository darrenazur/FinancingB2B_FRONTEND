'use client'

import { useState } from 'react'
import { saveLoan } from '../../app/loans/actions'
import type { Loan, LoanLookups, Option } from '../../lib/api/financing'
import { newRequestKey } from '../../lib/requestKey'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'

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
      title={loan ? `Edit loan ${loan.loanNo}` : 'Add loan'}
      action={saveLoan.bind(null, loan?.id ?? null, requestKey)}
      onClose={onClose}
      lock={loan ? { type: 'LOAN', id: loan.id } : undefined}
      wide
    >
      {loan ? (
        <>
          <input type="hidden" {...field('PartnerProfileID')} />
          <Field label="Partner" hint="A loan can’t be edited after a payment is recorded.">
            <input value={loan.partnerName} readOnly className={`${INPUT} bg-elevated text-muted`} />
          </Field>
        </>
      ) : (
        <Field label="Partner" hint="Only verified partners can borrow.">
          <select {...field('PartnerProfileID')} required className={INPUT}>
            <option value="">Select partner</option>
            {partners.map(partner => <option key={partner.id} value={partner.id}>{partner.label}</option>)}
          </select>
        </Field>
      )}

      <div className={SECTION_GRID}>
        <Field label="Principal">
          <input
            {...field('PrincipalAmt', decimalOnly(2))}
            required
            inputMode="decimal"
            pattern="\d{1,13}(\.\d{1,2})?"
            title="An amount with up to 2 decimal places, without commas."
            className={INPUT}
          />
        </Field>
        <Field label="Currency">
          <select {...field('CurrencyCd')} required className={INPUT}>
            {lookups.currencies.map(code => <option key={code}>{code}</option>)}
          </select>
        </Field>
        <Field label="Interest rate (% a month)">
          <input
            {...field('InterestRate', decimalOnly(5))}
            required
            inputMode="decimal"
            pattern="\d{1,13}(\.\d{1,5})?"
            title="A rate with up to 5 decimal places."
            className={INPUT}
          />
        </Field>
        <Field label="Payment term">
          <select {...field('TermTypeID')} required className={INPUT}>
            <option value="">Select term</option>
            {lookups.terms.map(term => <option key={term.id} value={term.id}>{term.label}</option>)}
          </select>
        </Field>
        <Field label="Tenure">
          <select {...field('TenureDurationID')} required className={INPUT}>
            <option value="">Select tenure</option>
            {lookups.tenures.map(tenure => <option key={tenure.id} value={tenure.id}>{tenure.label}</option>)}
          </select>
        </Field>
        <Field label="Settlement structure">
          <select {...field('SettlementStructID')} required className={INPUT}>
            <option value="">Select structure</option>
            {lookups.settlements.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
      </div>
    </FormDialog>
  )
}
