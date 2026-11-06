'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { ACTOR, readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'

// The API names this route "delete", but it runs CLOSEFINANCINGINFO_SP: loans are closed, never deleted.
export async function closeLoan(id: number): Promise<SaveState> {
  try {
    const result = await send('DELETE', '/financing-information-delete', {
      FinancingInformationID: id,
      UpdatedBy: ACTOR,
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: 'Can’t reach the API. Check that it is running.' }
  }

  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}
