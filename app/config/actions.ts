'use server'

import { revalidatePath } from 'next/cache'
import { refreshCaptions, send } from '../../lib/api/client'
import { readableError } from '../../lib/api/messages'
import { ConfigField, ConfigResource, SaveState, findResource } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

const MAX_INT = 2147483647

function readField(field: ConfigField, formData: FormData) {
  const raw = String(formData.get(field.name) ?? '').trim()
  if (!raw) return { error: t('UI_IS_REQUIRED', { label: field.label }) }

  if (field.type === 'text') {
    if (field.exactLength && raw.length !== field.exactLength) {
      return { error: t('UI_MUST_BE_CHARACTERS', { label: field.label, exactLength: field.exactLength }) }
    }
    if (field.maxLength && raw.length > field.maxLength) {
      return { error: t('UI_CAN_HAVE_UP_TO_CHARACTERS', { label: field.label, maxLength: field.maxLength }) }
    }
    return { value: field.uppercase ? raw.toUpperCase() : raw }
  }

  const value = Number(raw)
  if (!/^\d+$/.test(raw) || value > MAX_INT || value < (field.min ?? 0)) {
    return { error: t('UI_IS_NOT_VALID', { label: field.label }) }
  }
  return { value }
}

function readPayload(resource: ConfigResource, formData: FormData) {
  const payload: Record<string, string | number> = {}
  for (const field of resource.fields) {
    const { value, error } = readField(field, formData)
    if (value === undefined) return { error: error ?? t('UI_CHECK_THE_FORM') }
    payload[field.name] = value
  }

  if (resource.oneIntervalOnly) {
    const usesDays = Number(payload.IntervalDays) > 0
    const usesMonths = Number(payload.IntervalMonths) > 0
    if (usesDays === usesMonths) return { error: t('UI_USE_DAYS_OR_MONTHS_SET_ONE_ABOVE_0_AND_THE_OTHER_TO_0') }
  }
  return { payload }
}

export async function deleteConfigRecord(resourceKey: string, id: number): Promise<SaveState> {
  const resource = findResource(resourceKey)
  if (!resource || resource.readOnly) return { ok: false, error: t('UI_THIS_LIST_CANT_BE_CHANGED_HERE') }

  try {
    const result = await send('DELETE', `/${resource.path}-delete`, { [resource.idField]: id })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }

  if (resource.key === 'caption') refreshCaptions()
  revalidatePath(`/config/${resource.key}`)
  return { ok: true, error: null }
}

export async function saveConfigRecord(
  resourceKey: string,
  id: number | null,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const resource = findResource(resourceKey)
  if (!resource || resource.readOnly) return { ok: false, error: t('UI_THIS_LIST_CANT_BE_CHANGED_HERE') }

  const { payload, error } = readPayload(resource, formData)
  if (!payload) return { ok: false, error: error ?? t('UI_CHECK_THE_FORM') }

  try {
    const result = id === null
      ? await send('POST', `/${resource.path}-add`, { ...payload })
      : await send('PUT', `/${resource.path}-update`, { ...payload, [resource.idField]: id })

    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }

  if (resource.key === 'caption') refreshCaptions()
  revalidatePath(`/config/${resource.key}`)
  return { ok: true, error: null }
}
