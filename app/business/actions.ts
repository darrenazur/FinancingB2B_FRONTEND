'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { readableError } from '../../lib/api/messages'
import { findBizResource } from '../../lib/business/resources'
import { SaveState } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

async function write(path: string, payload: object): Promise<SaveState> {
  try {
    const result = await send('POST', path, payload)
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }
  revalidatePath('/business', 'layout')
  return { ok: true, error: null }
}

// id is null for a new record. The API checks every value; this only shapes the form into its fields.
export async function saveBizRecord(key: string, id: string | null, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const resource = findBizResource(key)
  if (!resource) return { ok: false, error: t('UI_THIS_LIST_CANT_BE_CHANGED_HERE') }
  if (id === null && !resource.canAdd) return { ok: false, error: t('UI_THIS_LIST_CANT_BE_CHANGED_HERE') }

  const payload: Record<string, string> = { [resource.idField]: id ?? '' }
  for (const field of resource.fields) {
    const raw = String(formData.get(field.name) ?? '').trim()
    if (field.type === 'checkbox') payload[field.name] = raw === 'on' ? '1' : '0'
    // A month field gives YYYY-MM; the API takes the first day of that month.
    else if (field.type === 'month') payload[field.name] = /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : ''
    else payload[field.name] = raw
  }

  return write(`/biz-save/${resource.key}`, payload)
}

export async function deleteBizRecord(key: string, id: string, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const resource = findBizResource(key)
  if (!resource?.canDelete) return { ok: false, error: t('UI_THIS_LIST_CANT_BE_CHANGED_HERE') }

  return write(`/biz-delete/${resource.key}`, {
    [resource.idField]: id,
    DeleteReason: String(formData.get('reason') ?? '').trim(),
  })
}
