'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { ACTOR, readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'

export async function deletePartner(id: number): Promise<SaveState> {
  try {
    const result = await send('DELETE', '/partner-profile-delete', {
      PartnerProfileID: id,
      DeviceFingerprint: ACTOR,
      UpdatedBy: ACTOR,
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: 'Can’t reach the API. Check that it is running.' }
  }

  revalidatePath('/partners')
  revalidatePath('/dashboard')
  return { ok: true, error: null }
}
