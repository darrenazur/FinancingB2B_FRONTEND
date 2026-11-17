'use server'

import { getNotifications, type Notice } from '../../lib/api/business'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'

// The bell's notices. Business data, so business.view only; if the API is down the bell just shows nothing.
export async function loadNotifications(): Promise<Notice[]> {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) return []
  try {
    return await getNotifications()
  } catch {
    return []
  }
}
