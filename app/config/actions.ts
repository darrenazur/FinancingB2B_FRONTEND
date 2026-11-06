'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { ACTOR, readableError } from '../../lib/api/messages'
import { ConfigField, ConfigResource, SaveState, findResource } from '../../lib/config/resources'

const MAX_INT = 2147483647

function readField(field: ConfigField, formData: FormData) {
  const raw = String(formData.get(field.name) ?? '').trim()
  if (!raw) return { error: `${field.label} is required.` }

  if (field.type === 'text') {
    if (field.exactLength && raw.length !== field.exactLength) {
      return { error: `${field.label} must be ${field.exactLength} characters.` }
    }
    if (field.maxLength && raw.length > field.maxLength) {
      return { error: `${field.label} can have up to ${field.maxLength} characters.` }
    }
    return { value: field.uppercase ? raw.toUpperCase() : raw }
  }

  const value = Number(raw)
  if (!/^\d+$/.test(raw) || value > MAX_INT || value < (field.min ?? 0)) {
    return { error: `${field.label} is not valid.` }
  }
  return { value }
}

function readPayload(resource: ConfigResource, formData: FormData) {
  const payload: Record<string, string | number> = {}
  for (const field of resource.fields) {
    const { value, error } = readField(field, formData)
    if (value === undefined) return { error: error ?? 'Check the form.' }
    payload[field.name] = value
  }

  if (resource.oneIntervalOnly) {
    const usesDays = Number(payload.IntervalDays) > 0
    const usesMonths = Number(payload.IntervalMonths) > 0
    if (usesDays === usesMonths) return { error: 'Use days or months: set one above 0 and the other to 0.' }
  }
  return { payload }
}

export async function deleteConfigRecord(resourceKey: string, id: number): Promise<SaveState> {
  const resource = findResource(resourceKey)
  if (!resource || resource.readOnly) return { ok: false, error: 'This list can’t be changed here.' }

  try {
    const result = await send('DELETE', `/${resource.path}-delete`, { [resource.idField]: id, UpdatedBy: ACTOR })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: 'Can’t reach the API. Check that it is running.' }
  }

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
  if (!resource || resource.readOnly) return { ok: false, error: 'This list can’t be changed here.' }

  const { payload, error } = readPayload(resource, formData)
  if (!payload) return { ok: false, error: error ?? 'Check the form.' }

  try {
    const result = id === null
      ? await send('POST', `/${resource.path}-add`, { ...payload, CreatedBy: ACTOR })
      : await send('PUT', `/${resource.path}-update`, { ...payload, [resource.idField]: id, UpdatedBy: ACTOR })

    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: 'Can’t reach the API. Check that it is running.' }
  }

  revalidatePath(`/config/${resource.key}`)
  return { ok: true, error: null }
}
