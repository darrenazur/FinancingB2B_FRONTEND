'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { send } from '../../../lib/api/client'
import { readableError } from '../../../lib/api/messages'
import { SaveState } from '../../../lib/config/resources'
import { t } from '../../../lib/captions/t'

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '').trim()

async function write(path: string, method: 'POST' | 'PUT' | 'DELETE', payload: object): Promise<SaveState> {
  try {
    const result = await send(method, path, payload)
    if (!result.ok) return { ok: false, error: readableError(result.message) }
  } catch {
    return { ok: false, error: t('UI_CANT_REACH_THE_API_CHECK_THAT_IT_IS_RUNNING') }
  }

  revalidatePath('/config/users')
  revalidatePath('/config/roles')
  return { ok: true, error: null }
}

export async function saveUser(id: number | null, _previous: SaveState, formData: FormData): Promise<SaveState> {
  const details = {
    FirstName: text(formData, 'FirstName'),
    LastName: text(formData, 'LastName'),
    Email: text(formData, 'Email'),
    ContactNo: text(formData, 'ContactNo'),
    RoleID: text(formData, 'RoleID'),
  }

  return id === null
    ? write('/user-add', 'POST', {
        ...details,
        Username: text(formData, 'Username'),
        Password: String(formData.get('Password') ?? ''),
      })
    : write('/user-update', 'PUT', { ...details, AdminUserID: id, IsActive: formData.get('IsActive') === 'on' })
}

export async function resetUserPassword(id: number, _previous: SaveState, formData: FormData): Promise<SaveState> {
  return write('/user-password-reset', 'PUT', { AdminUserID: id, Password: String(formData.get('Password') ?? '') })
}

export async function saveRole(id: number | null, _previous: SaveState, formData: FormData): Promise<SaveState> {
  return write('/role-save', 'POST', {
    RoleID: id,
    RoleName: text(formData, 'RoleName'),
    Description: text(formData, 'Description'),
    DataScope: text(formData, 'DataScope'),
    Permissions: formData.getAll('Permissions').map(String),
  })
}

export async function deleteRole(id: number): Promise<SaveState> {
  return write('/role-delete', 'DELETE', { RoleID: id })
}

export async function changePassword(_previous: SaveState, formData: FormData): Promise<SaveState> {
  const newPassword = String(formData.get('NewPassword') ?? '')
  if (newPassword !== String(formData.get('ConfirmPassword') ?? '')) {
    return { ok: false, error: t('UI_THE_NEW_PASSWORDS_DONT_MATCH') }
  }

  const result = await write('/auth-change-password', 'POST', {
    CurrentPassword: String(formData.get('CurrentPassword') ?? ''),
    NewPassword: newPassword,
  })
  if (!result.ok) return result

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
