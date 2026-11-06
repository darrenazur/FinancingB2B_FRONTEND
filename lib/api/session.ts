import 'server-only'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { request } from './client'

export const SESSION_COOKIE = 'bms_session'

export interface CurrentUser {
  username: string
  name: string
  roleName: string
  mustChangePassword: boolean
  permissions: string[]
}

// cache() keeps this to one API call per page render, however many components ask.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies()
  if (!store.has(SESSION_COOKIE)) return null

  // The root layout calls this, so a down API must not take the error page with it.
  try {
    const { response, body } = await request('/auth-session')
    if (!response.ok || body?.result !== 1) return null

    // Only these fields reach the browser. Session and user ids stay on the server.
    const { username, name, roleName, mustChangePassword, permissions } = body.message
    return { username, name, roleName, mustChangePassword, permissions }
  } catch {
    return null
  }
})

export async function signIn(username: string, password: string) {
  const list = await headers()
  const { body } = await request('/auth-login', {
    method: 'POST',
    body: JSON.stringify({ Username: username, Password: password }),
    headers: {
      'x-client-ip': (list.get('x-forwarded-for') ?? '').split(',')[0].trim(),
      'x-client-agent': list.get('user-agent') ?? '',
    },
  })
  if (body?.result !== 1) return false

  const store = await cookies()
  store.set(SESSION_COOKIE, body.Token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Number(body.Hours) * 60 * 60,
  })
  return true
}

export async function signOut() {
  await request('/auth-logout', { method: 'POST', body: '{}' })
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
