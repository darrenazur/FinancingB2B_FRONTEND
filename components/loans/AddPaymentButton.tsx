'use client'

import { useState } from 'react'
import { addPayment } from '../../app/loans/actions'
import type { Option } from '../../lib/api/financing'
import { newRequestKey } from '../../lib/requestKey'
import DatePicker from '../forms/DatePicker'
import FileField from '../forms/FileField'
import FormDialog, { decimalOnly, Field, INPUT, useFields } from '../forms/FormDialog'

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
        Add payment
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
    <FormDialog title={`Add payment to loan ${loanNo}`} action={addPayment.bind(null, loanId, requestKey)} onClose={onClose} lock={{ type: 'LOAN', id: loanId }}>
      {due && (
        <label className="flex items-start gap-3 text-base text-body">
          <input
            type="checkbox"
            checked={payDue}
            onChange={event => setPayDue(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          Pay total due ({due.label})
        </label>
      )}
      <Field label="Amount" hint="Paid to the oldest installment first: late fee, interest, then principal.">
        <input
          {...field('AmountPaid', decimalOnly(2))}
          value={payDue && due ? due.amount : values.AmountPaid}
          readOnly={payDue}
          required
          inputMode="decimal"
          pattern="\d{1,13}(\.\d{1,2})?"
          title="An amount with up to 2 decimal places, without commas."
          className={`${INPUT} ${payDue ? 'bg-elevated text-muted' : ''}`}
        />
      </Field>
      <Field label="Payment date">
        <DatePicker
          name="TransactionDt"
          value={values.TransactionDt}
          onChange={TransactionDt => setValues(current => ({ ...current, TransactionDt }))}
          min={loanDate}
          max={manilaToday()}
          required
        />
      </Field>
      <Field label="Payment method">
        <select {...field('PaymentMethodID')} required className={INPUT}>
          <option value="">Select method</option>
          {methods.map(method => <option key={method.id} value={method.id}>{method.label}</option>)}
        </select>
      </Field>
      <Field label="Reference number" hint="Some methods require this and a proof.">
        <input {...field('ReferenceNo')} maxLength={100} className={INPUT} />
      </Field>
      <FileField
        label="Proof"
        name="ProofPath"
        kind="proof"
        value={values.ProofPath}
        onChange={key => setValues(current => ({ ...current, ProofPath: key }))}
      />
    </FormDialog>
  )
}
