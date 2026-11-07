'use client'

import { useState } from 'react'
import { addPayment } from '../../app/loans/actions'
import type { Option } from '../../lib/api/financing'
import { newRequestKey } from '../../lib/requestKey'
import DatePicker from '../forms/DatePicker'
import FileField from '../forms/FileField'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

interface AddPaymentButtonProps {
  loanId: number
  loanNo: string
  methods: Option[]
  due: { amount: string; label: string } | null
  loanDate: string
}

export default function AddPaymentButton({ loanId, loanNo, methods, due, loanDate }: AddPaymentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
      >
        {t('UI_ADD_PAYMENT')}
      </button>
      {open && <PaymentForm loanId={loanId} loanNo={loanNo} methods={methods} due={due} loanDate={loanDate} onClose={() => setOpen(false)} />}
    </>
  )
}

function PaymentForm({ loanId, loanNo, methods, due, loanDate, onClose }: AddPaymentButtonProps & { onClose: () => void }) {
  const [requestKey] = useState(newRequestKey)
  const [payDue, setPayDue] = useState(false)
  const { values, setValues, field } = useFields({
    AmountPaid: '',
    TransactionDt: manilaToday(),
    PaymentMethodID: '',
    ReferenceNo: '',
    ProofPath: '',
  })

  return (
    <FormDialog title={t('UI_ADD_PAYMENT_TO_LOAN', { loanNo })} action={addPayment.bind(null, loanId, requestKey)} onClose={onClose} lock={{ type: 'LOAN', id: loanId }}>
      {due && (
        <label className="flex items-start gap-3 text-base text-body">
          <input
            type="checkbox"
            checked={payDue}
            onChange={event => setPayDue(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          {t('UI_PAY_TOTAL_DUE')}{due.label})
        </label>
      )}
      <Field label={t('UI_AMOUNT')} hint={t('UI_PAID_TO_THE_OLDEST_INSTALLMENT_FIRST_LATE_FEE_INTEREST')}>
        <input
          {...field('AmountPaid', decimalOnly(2))}
          value={payDue && due ? due.amount : values.AmountPaid}
          readOnly={payDue}
          required
          inputMode="decimal"
          pattern="\d{1,13}(\.\d{1,2})?"
          title={t('UI_AN_AMOUNT_WITH_UP_TO_2_DECIMAL_PLACES_WITHOUT_COMMAS')}
          className={`${INPUT} ${payDue ? 'bg-elevated text-muted' : ''}`}
        />
      </Field>
      <Field label={t('UI_PAYMENT_DATE')}>
        <DatePicker
          name="TransactionDt"
          value={values.TransactionDt}
          onChange={TransactionDt => setValues(current => ({ ...current, TransactionDt }))}
          min={loanDate}
          max={manilaToday()}
          required
        />
      </Field>
      <Field label={t('UI_PAYMENT_METHOD')}>
        <select {...field('PaymentMethodID')} required className={INPUT}>
          <option value="">{t('UI_SELECT_METHOD')}</option>
          {methods.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}
        </select>
      </Field>
      <Field label={t('UI_REFERENCE_NUMBER')} hint={t('UI_SOME_METHODS_REQUIRE_THIS_AND_A_PROOF')}>
        <input {...field('ReferenceNo')} maxLength={100} className={INPUT} />
      </Field>
      <FileField
        label={t('UI_PROOF')}
        name="ProofPath"
        kind="proof"
        value={values.ProofPath}
        onChange={key => setValues(current => ({ ...current, ProofPath: key }))}
      />
    </FormDialog>
  )
}
