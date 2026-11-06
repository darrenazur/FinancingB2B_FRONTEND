'use server'

import { revalidatePath } from 'next/cache'
import { send } from '../../lib/api/client'
import { readableError } from '../../lib/api/messages'
import { SaveState } from '../../lib/config/resources'
import { LockTarget } from '../../lib/lock'

const NO_API = 'Can’t reach the API. Check that it is running.'
const payload = (target: LockTarget) => ({ EntityType: target.type, EntityID: target.id })

export interface TakeLockResult {
  ok: boolean
  lockedBy?: string
  error?: string
}

export async function takeLock(target: LockTarget): Promise<TakeLockResult> {
  try {
    const result = await send('POST', '/lock-acquire', payload(target))
    if (result.ok) return { ok: true }
    if (result.message === 'ERR_RECORD_LOCKED') return { ok: false, lockedBy: String(result.data?.lockedBy ?? '') }
    return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: NO_API }
  }
}

// A short API outage must not close a window with unsaved work. The save is still checked.
export async function refreshLock(target: LockTarget): Promise<boolean> {
  try {
    return (await send('POST', '/lock-refresh', payload(target))).ok
  } catch {
    return true
  }
}

export async function lockIsMine(target: LockTarget): Promise<boolean> {
  try {
    const result = await send('POST', '/lock-status', payload(target))
    return Boolean(result.data?.message?.mine)
  } catch {
    return true
  }
}

// A lock that can't be released here ends by itself after 15 minutes.
export async function releaseLock(target: LockTarget): Promise<void> {
  try {
    await send('POST', '/lock-release', payload(target))
  } catch {}
}

export async function forceReleaseLock(target: LockTarget): Promise<SaveState> {
  try {
    const result = await send('POST', '/lock-force-release', payload(target))
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: NO_API }
  }

  revalidatePath('/config/locks')
  return { ok: true, error: null }
}
