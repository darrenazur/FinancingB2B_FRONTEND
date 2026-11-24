'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../../lib/api/client'
import { readableError } from '../../../lib/api/messages'
import { SaveState } from '../../../lib/config/resources'
import { t } from '../../../lib/captions/t'

export interface SnapshotSaveState { ok: boolean; error: string | null; id: string | null }

// Saves a new snapshot. The API checks the permission (business.manage) and every value; the SP checks the JSON again.
export async function saveSimSnapshot(snapshot: { name: string; notes: string; baseMonth: string; inputs: string; result: string }): Promise<SnapshotSaveState> {
  try {
    const result = await send('POST', '/biz-save/sim-snapshot', {
      BizSimSnapshotID: '',
      Name: snapshot.name.trim(),
      Notes: snapshot.notes.trim(),
      BaseMonth: snapshot.baseMonth.slice(0, 10),
      InputsJson: snapshot.inputs,
      ResultJson: snapshot.result,
    })
    if (!result.ok) return { ok: false, error: readableError(result.message), id: null }
    revalidatePath('/business/simulation', 'layout')
    return { ok: true, error: null, id: result.data?.id === null || result.data?.id === undefined ? null : String(result.data.id) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING'), id: null }
  }
}

// Delete (soft): off the list, kept in the table as deleted with the reason.
// Delete permanently (purge): the row and its months are gone; the audit keeps who and why.
async function removeSnapshot(entity: string, id: string, formData: FormData): Promise<SaveState> {
  try {
    const result = await send('POST', `/biz-delete/${entity}`, { BizSimSnapshotID: id, DeleteReason: String(formData.get('reason') ?? '').trim() })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }
  revalidatePath('/business/simulation', 'layout')
  return { ok: true, error: null }
}

export async function deleteSimSnapshot(id: string, _previous: SaveState, formData: FormData): Promise<SaveState> {
  return removeSnapshot('sim-snapshot', id, formData)
}

export async function purgeSimSnapshot(id: string, _previous: SaveState, formData: FormData): Promise<SaveState> {
  return removeSnapshot('sim-snapshot-purge', id, formData)
}

// Rename and edit notes. What was entered and the months stay as saved.
export async function renameSimSnapshot(id: string, _previous: SaveState, formData: FormData): Promise<SaveState> {
  try {
    const result = await send('POST', '/biz-save/sim-snapshot-rename', {
      BizSimSnapshotID: id,
      Name: String(formData.get('Name') ?? '').trim(),
      Notes: String(formData.get('Notes') ?? '').trim(),
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }
  revalidatePath('/business/simulation', 'layout')
  return { ok: true, error: null }
}
