'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { getPartnerDetails, PartnerDetails } from '../../lib/api/financing'
import { readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'
import { t } from '../../lib/captions/t'

const TERMS_VERSION = '1.0'
const notReachable = (): SaveState => ({ ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') })

const SENSITIVE_FIELDS = [
  'FirstName', 'MiddleName', 'LastName', 'BirthDate',
  'IDType1', 'IDNo1', 'IDImgPath1', 'IDType2', 'IDNo2', 'IDImgPath2', 'SelfiePath',
]
const OTHER_FIELDS = ['Address', 'CountryID', 'ProvinceID', 'CityID', 'ZIPCodeID', 'CountryCd', 'ContactNo', 'Email', 'TelephoneNo']

function refresh() {
  revalidatePath('/partners')
  revalidatePath('/loans')
  revalidatePath('/dashboard')
}

function readFields(formData: FormData, names: string[]) {
  return Object.fromEntries(names.map(name => [name, String(formData.get(name) ?? '').trim()]))
}

export async function loadPartner(id: number): Promise<PartnerDetails | null> {
  try {
    return await getPartnerDetails(id)
  } catch {
    return null
  }
}

export async function savePartner(id: number | null, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const sensitive = id === null || formData.get('UpdateSensitiveData') === 'on'
  // Blank means "keep current" on update, so locked fields are sent blank.
  const payload = {
    ...readFields(formData, OTHER_FIELDS),
    ...readFields(sensitive ? formData : new FormData(), SENSITIVE_FIELDS),
  }

  try {
    const result = id === null
      ? await send('POST', '/partner-profile-add', {
          ...payload,
          IsAccepted: formData.get('IsAccepted') === 'on',
          DataUsageConsent: formData.get('DataUsageConsent') === 'on',
          TandCVersion: TERMS_VERSION,
          DateAccepted: new Date().toISOString(),
        })
      : await send('PUT', '/partner-profile-update', {
          ...payload,
          PartnerProfileID: id,
          UpdateSensitiveData: sensitive,
        })

    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return notReachable()
  }

  refresh()
  return { ok: true, error: null }
}

export async function assignPartner(id: number, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const user = String(formData.get('AssignedUserID') ?? '')

  try {
    const result = await send('PUT', '/partner-assign', {
      PartnerProfileID: id,
      AssignedUserID: user === '' ? null : Number(user),
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return notReachable()
  }

  refresh()
  return { ok: true, error: null }
}

export async function updateVerification(id: number, status: string): Promise<SaveState> {
  try {
    const result = await send('PUT', '/partner-verification-update', {
      PartnerProfileID: id,
      StatusName: status,
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return notReachable()
  }

  refresh()
  return { ok: true, error: null }
}

export async function deletePartner(id: number): Promise<SaveState> {
  try {
    const result = await send('DELETE', '/partner-profile-delete', {
      PartnerProfileID: id,
    })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return notReachable()
  }

  refresh()
  return { ok: true, error: null }
}
