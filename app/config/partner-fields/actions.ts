'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../../lib/api/client'
import { readableError } from '../../../lib/api/messages'
import { SaveState } from '../../../lib/config/resources'
import { t } from '../../../lib/captions/t'

// The whole screen is saved at once: ticked fields become required, every other field optional.
export async function savePartnerFieldRules(_previous: SaveState, formData: FormData): Promise<SaveState> {
  const required = formData.getAll('Required').map(String)

  try {
    const result = await send('PUT', '/partner-field-rule-save', { RequiredCds: required })
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }

  revalidatePath('/config/partner-fields')
  revalidatePath('/partners')
  return { ok: true, error: null, notice: t('UI_PARTNER_FIELDS_SAVED') }
}
