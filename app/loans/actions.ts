'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { type CoMaker, getLatestCoMakers } from '../../lib/api/financing'
import { readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

type Method = Parameters<typeof send>[0]

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()

// An unchecked box sends nothing, so it reads as no note; the picture goes only with the box checked.
function noteFields(formData: FormData) {
  const hasNote = formData.get('HasPromissoryNote') === '1'
  return {
    Remarks: text(formData, 'Remarks'),
    HasPromissoryNote: hasNote ? 1 : 0,
    PromissoryNotePath: hasNote ? text(formData, 'PromissoryNotePath') : '',
    // Blank keeps the loan's purpose on an edit; a new loan must have one (the SP checks)
    LoanPurposeID: text(formData, 'LoanPurposeID'),
  }
}

function refresh() {
  revalidatePath('/loans')
  revalidatePath('/loans/[id]', 'page')
  revalidatePath('/dashboard')
}

async function write(method: Method, path: string, payload: object) {
  try {
    const result = await send(method, path, payload)
    return result.ok
      ? { saved: true as const, data: result.data }
      : { saved: false as const, state: { ok: false, error: readableError(result.message) } }
  } catch {
    return { saved: false as const, state: { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') } }
  }
}

export async function saveLoan(
  id: number | null,
  requestKey: string,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const payload = {
    PartnerProfileID: text(formData, 'PartnerProfileID'),
    PrincipalAmt: text(formData, 'PrincipalAmt'),
    CurrencyCd: text(formData, 'CurrencyCd'),
    InterestRate: text(formData, 'InterestRate'),
    TermTypeID: text(formData, 'TermTypeID'),
    TenureDurationID: text(formData, 'TenureDurationID'),
    SettlementStructID: text(formData, 'SettlementStructID'),
    ReleaseDate: text(formData, 'ReleaseDate'),
    BackdateReason: text(formData, 'BackdateReason'),
    ProcessingFeeType: text(formData, 'ProcessingFeeType'),
    ProcessingFeeValue: text(formData, 'ProcessingFeeValue'),
    ProcessingFeeDeducted: text(formData, 'ProcessingFeeDeducted'),
    ...noteFields(formData),
  }

  const result = id === null
    ? await write('POST', '/financing-information-add', { ...payload, RequestKey: requestKey, CoMakers: text(formData, 'CoMakers') })
    : await write('PUT', '/financing-information-update', { ...payload, FinancingInformationID: id })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

// Remarks and the promissory note only (loan.note), allowed after payments.
export async function saveLoanNote(id: number, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const result = await write('PUT', '/loan-note-update', { FinancingInformationID: id, ...noteFields(formData) })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

// One co-maker on a saved loan (loan.note). The form sends the fields as one JSON field, "CoMaker".
// The loan and co-maker ids go last, so the fields can't change which record is saved.
export async function saveCoMaker(loanId: number, coMakerId: number | null, _previous: SaveState, formData: FormData): Promise<SaveState> {
  let fields: object
  try {
    fields = JSON.parse(text(formData, 'CoMaker'))
  } catch {
    return { ok: false, error: readableError('ERR_COMAKER_LIST_NOT_VALID') }
  }
  const result = await write('PUT', '/loan-comaker-save', { ...fields, FinancingInformationID: loanId, LoanCoMakerID: coMakerId })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

export async function removeCoMaker(loanId: number, coMakerId: number): Promise<SaveState> {
  const result = await write('DELETE', '/loan-comaker-remove', { FinancingInformationID: loanId, LoanCoMakerID: coMakerId })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

// "Copy from last loan" on Add Loan
export async function latestCoMakers(partnerId: number): Promise<{ ok: true; coMakers: CoMaker[] } | { ok: false; error: string }> {
  try {
    return { ok: true, coMakers: await getLatestCoMakers(partnerId) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }
}

// The API names this route "delete", but it runs CLOSEFINANCINGINFO_SP: loans are closed, never deleted.
export async function closeLoan(id: number): Promise<SaveState> {
  const result = await write('DELETE', '/financing-information-delete', { FinancingInformationID: id })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

export async function processOverdue(): Promise<SaveState> {
  const result = await write('POST', '/overdue-process', {})

  if (!result.saved) return result.state
  refresh()
  return {
    ok: true,
    error: null,
    notice: t('UI_INSTALLMENTS_MARKED_OVERDUE_LATE_FEES_CHARGED', { MarkedOverdue: result.data.MarkedOverdue ?? 0, FeesCharged: result.data.FeesCharged ?? 0 }),
  }
}

// One loan only: the same rule as Process overdue on the Loans list
export async function processLoanOverdue(id: number): Promise<SaveState> {
  const result = await write('POST', '/overdue-process-loan', { FinancingInformationID: id })

  if (!result.saved) return result.state
  refresh()
  return {
    ok: true,
    error: null,
    notice: t('UI_INSTALLMENTS_MARKED_OVERDUE_LATE_FEES_CHARGED', { MarkedOverdue: result.data.MarkedOverdue ?? 0, FeesCharged: result.data.FeesCharged ?? 0 }),
  }
}

export async function addPayment(
  loanId: number,
  requestKey: string,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const result = await write('POST', '/payment-add', {
    FinancingInfoID: loanId,
    AmountPaid: text(formData, 'AmountPaid'),
    TransactionDt: text(formData, 'TransactionDt'),
    PaymentMethodID: text(formData, 'PaymentMethodID'),
    ReferenceNo: text(formData, 'ReferenceNo'),
    ProofPath: text(formData, 'ProofPath'),
    BackdateReason: text(formData, 'BackdateReason'),
    RequestKey: requestKey,
  })

  if (!result.saved) return result.state
  refresh()
  if (Number(result.data.LoanFullyPaid) === 1) {
    return { ok: true, error: null, notice: t('UI_PAYMENT_SAVED_THIS_LOAN_IS_NOW_FULLY_PAID_SO_IT_CAN_BE') }
  }
  return { ok: true, error: null }
}

export async function reversePayment(
  loanId: number,
  paymentId: number,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const result = await write('POST', '/payment-reverse', {
    PaymentTransactionID: paymentId,
    ReversalReason: text(formData, 'reason'),
  })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

export async function writeOffLoan(loanId: number, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const result = await write('POST', '/loan-writeoff', {
    FinancingInformationID: loanId,
    WriteOffDate: text(formData, 'date'),
    Reason: text(formData, 'reason'),
  })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

export async function undoWriteOff(loanId: number, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const result = await write('POST', '/loan-writeoff-undo', {
    FinancingInformationID: loanId,
    Reason: text(formData, 'reason'),
  })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

export async function waivePenalty(
  loanId: number,
  penaltyId: number,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const result = await write('PUT', '/penalty-waive', {
    SettlementPenID: penaltyId,
    WaiveReason: text(formData, 'reason'),
  })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}
