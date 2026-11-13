'use server'

import { redirect, RedirectType } from 'next/navigation'
import { signIn, signOut } from '../../lib/api/session'
import { t } from '../../lib/captions/t'

export interface LoginState {
  error: string | null
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  try {
    if (!(await signIn(username, password))) {
      return { error: t('UI_WRONG_USERNAME_OR_PASSWORD_OR_THE_ACCOUNT_IS_LOCKED') }
    }
  } catch {
    return { error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }

  // Replace, so Back from the dashboard doesn't land on the login form again.
  redirect('/dashboard', RedirectType.replace)
}

export async function logout() {
  await signOut().catch(() => undefined)
  redirect('/login')
}
