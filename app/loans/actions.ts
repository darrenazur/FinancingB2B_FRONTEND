'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { ACTOR, readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'

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
    return { saved: false as const, state: { ok: false, error: 'Can’t reach the API. Check that it is running.' } }
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
  }

  const result = id === null
    ? await write('POST', '/financing-information-add', { ...payload, CreatedBy: ACTOR, RequestKey: requestKey })
    : await write('PUT', '/financing-information-update', { ...payload, FinancingInformationID: id, UpdatedBy: ACTOR })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}

// The API names this route "delete", but it runs CLOSEFINANCINGINFO_SP: loans are closed, never deleted.
export async function closeLoan(id: number): Promise<SaveState> {
  const result = await write('DELETE', '/financing-information-delete', { FinancingInformationID: id, UpdatedBy: ACTOR })

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
    notice: `Installments marked overdue: ${result.data.MarkedOverdue ?? 0}. Late fees charged: ${result.data.FeesCharged ?? 0}.`,
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
    CreatedBy: ACTOR,
    RequestKey: requestKey,
  })

  if (!result.saved) return result.state
  refresh()
  if (Number(result.data.LoanFullyPaid) === 1) {
    return { ok: true, error: null, notice: 'Payment saved. This loan is now fully paid, so it can be closed.' }
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
    CreatedBy: ACTOR,
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
    UpdatedBy: ACTOR,
  })

  if (!result.saved) return result.state
  refresh()
  return { ok: true, error: null }
}
