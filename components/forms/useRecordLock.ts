'use client'

import { useEffect, useState } from 'react'
import { lockIsMine, refreshLock, releaseLock, takeLock } from '../../app/locks/actions'
import { LockTarget } from '../../lib/lock'

const IDLE_MS = 15 * 60_000
const REFRESH_MS = 60_000
const CHECK_MS = 30_000

export type LockState =
  | { status: 'waiting' | 'held' | 'lost' }
  | { status: 'blocked'; lockedBy?: string; error?: string }

// Holds a record while its window is open. No target means the window changes nothing that can be locked.
export function useRecordLock(target?: LockTarget) {
  const [lock, setLock] = useState<LockState>({ status: target ? 'waiting' : 'held' })
  const type = target?.type
  const id = target?.id

  useEffect(() => {
    if (!type || !id) return

    const record = { type, id }
    let alive = true
    let timer: ReturnType<typeof setInterval> | undefined
    let lastActive = Date.now()
    let lastRefresh = Date.now()
    const lose = () => {
      if (alive) setLock({ status: 'lost' })
    }

    // Typing or clicking keeps the lock. The refresh is held to once a minute.
    const onActivity = () => {
      lastActive = Date.now()
      if (lastActive - lastRefresh < REFRESH_MS) return
      lastRefresh = lastActive
      refreshLock(record).then(ok => {
        if (!ok) lose()
      })
    }

    takeLock(record).then(result => {
      if (!alive) return
      if (!result.ok) {
        setLock({ status: 'blocked', lockedBy: result.lockedBy, error: result.error })
        return
      }

      setLock({ status: 'held' })
      window.addEventListener('keydown', onActivity)
      window.addEventListener('pointerdown', onActivity)
      timer = setInterval(async () => {
        if (Date.now() - lastActive >= IDLE_MS) lose()
        else if (!(await lockIsMine(record))) lose()
      }, CHECK_MS)
    })

    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('pointerdown', onActivity)
      releaseLock(record)
    }
  }, [type, id])

  return lock
}
