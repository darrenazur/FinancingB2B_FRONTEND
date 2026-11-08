'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

type Method = Parameters<typeof send>[0]

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()

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
  }

  const result = id === null
    ? await write('POST', '/financing-information-add', { ...payload, RequestKey: requestKey })
    : await write('PUT', '/financing-information-update', { ...payload, FinancingInformationID: id })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
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
