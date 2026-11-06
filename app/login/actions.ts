'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from '../../lib/api/session'

export interface LoginState {
  error: string | null
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  try {
    if (!(await signIn(username, password))) {
      return { error: 'Wrong username or password, or the account is locked.' }
    }
  } catch {
    return { error: 'Can’t reach the API. Check that it is running.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  await signOut().catch(() => undefined)
  redirect('/login')
}
