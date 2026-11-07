'use client'

import { useState } from 'react'
import { resetUserPassword, saveUser } from '../../app/config/security/actions'
import type { AppRole, AppUser } from '../../lib/api/security'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import FormDialog, { digitsOnly, Field, INPUT, useFields } from '../forms/FormDialog'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import { t } from '../../lib/captions/t'

const MIN_PASSWORD_LENGTH = 12
const GRID = 'grid gap-5 md:grid-cols-2'
const passwordHint = () => t('UI_AT_LEAST_CHARACTERS_THE_USER_MUST_CHANGE_IT_AFTER_SIGNING', { MIN_PASSWORD_LENGTH })

const statusLabel = (user: AppUser) => (!user.active ? t('UI_INACTIVE') : user.locked ? t('UI_LOCKED') : t('UI_ACTIVE'))

const COLUMNS: Column<AppUser>[] = [
  {
    key: 'name',
    label: 'UI_NAME',
    text: user => `${user.firstName} ${user.lastName} ${user.username}`,
    render: user => (
      <>
        <p className="whitespace-nowrap">{user.firstName} {user.lastName}</p>
        <p className="text-sm font-normal text-muted">{user.username}</p>
      </>
    ),
  },
  {
    key: 'contact',
    label: 'UI_CONTACT',
    text: user => `${user.email} ${user.contactNo}`,
    render: user => (
      <>
        <p>{user.email}</p>
        <p className="text-sm text-muted">{user.contactNo}</p>
      </>
    ),
  },
  { key: 'role', label: 'UI_ROLE', filter: 'select', text: user => user.roleName },
  {
    key: 'status',
    label: 'UI_STATUS',
    filter: 'select',
    text: statusLabel,
    render: user => <StatusBadge label={statusLabel(user)} tone={user.active && !user.locked ? 'good' : 'bad'} />,
  },
  ...auditColumns<AppUser>(),
]

interface UsersTableProps {
  users: AppUser[]
  roles: AppRole[]
}

export default function UsersTable({ users, roles }: UsersTableProps) {
  const [form, setForm] = useState<AppUser | 'new' | null>(null)
  const [resetting, setResetting] = useState<AppUser | null>(null)

  return (
    <>
      <DataTable
        rows={users}
        columns={COLUMNS}
        rowKey={user => user.id}
        defaultSort={NEWEST_FIRST}
        searchLabel={t('UI_SEARCH_USERS')}
        emptyText={t('UI_NO_USERS_YET')}
        minWidth="1300px"
        toolbar={
          <>
            <button
              onClick={() => setForm('new')}
              className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
            >
              {t('UI_ADD')}
            </button>
            <RefreshButton />
          </>
        }
        rowActions={user => (
          <div className="flex justify-end gap-2.5">
            <button onClick={() => setForm(user)} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_EDIT_5', { username: user.username })}>
              {t('UI_EDIT')}
            </button>
            <button onClick={() => setResetting(user)} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_RESET_PASSWORD_OF', { username: user.username })}>
              {t('UI_RESET_PASSWORD')}
            </button>
          </div>
        )}
      />

      {form && (
        <UserForm
          key={form === 'new' ? 'new' : form.id}
          user={form === 'new' ? null : form}
          roles={roles}
          onClose={() => setForm(null)}
        />
      )}
      {resetting && <ResetPasswordForm key={resetting.id} user={resetting} onClose={() => setResetting(null)} />}
    </>
  )
}

interface UserFormProps {
  user: AppUser | null
  roles: AppRole[]
  onClose: () => void
}

function UserForm({ user, roles, onClose }: UserFormProps) {
  const [active, setActive] = useState(user?.active ?? true)
  const { field } = useFields({
    Username: user?.username ?? '',
    FirstName: user?.firstName ?? '',
    LastName: user?.lastName ?? '',
    Email: user?.email ?? '',
    ContactNo: user?.contactNo ?? '',
    RoleID: user ? String(user.roleId) : '',
    Password: '',
  })

  return (
    <FormDialog
      title={user ? t('UI_EDIT_5', { username: user.username }) : t('UI_ADD_USER')}
      action={saveUser.bind(null, user?.id ?? null)}
      onClose={onClose}
      lock={user ? { type: 'USER', id: user.id } : undefined}
      wide
    >
      <div className={GRID}>
        <Field label={t('UI_USERNAME')} hint={user ? t('UI_A_USERNAME_CANT_BE_CHANGED') : undefined}>
          <input
            {...field('Username')}
            required
            readOnly={Boolean(user)}
            maxLength={100}
            autoComplete="off"
            className={`${INPUT} ${user ? 'bg-elevated text-muted' : ''}`}
          />
        </Field>
        <Field label={t('UI_ROLE')}>
          <select {...field('RoleID')} required className={INPUT}>
            <option value="">{t('UI_SELECT_ROLE')}</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </Field>
        <Field label={t('UI_FIRST_NAME')}>
          <input {...field('FirstName')} required maxLength={150} className={INPUT} />
        </Field>
        <Field label={t('UI_LAST_NAME')}>
          <input {...field('LastName')} required maxLength={150} className={INPUT} />
        </Field>
        <Field label={t('UI_EMAIL')}>
          <input {...field('Email')} type="email" required maxLength={255} className={INPUT} />
        </Field>
        <Field label={t('UI_MOBILE_NUMBER')}>
          <input {...field('ContactNo', digitsOnly)} inputMode="numeric" required maxLength={20} className={INPUT} />
        </Field>
      </div>

      {user ? (
        <label className="flex items-start gap-3 text-base text-body">
          <input
            type="checkbox"
            name="IsActive"
            checked={active}
            onChange={event => setActive(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          {t('UI_ACTIVE_AN_INACTIVE_USER_CANT_SIGN_IN')}
        </label>
      ) : (
        <Field label={t('UI_TEMPORARY_PASSWORD')} hint={passwordHint()}>
          <input
            {...field('Password')}
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={200}
            autoComplete="new-password"
            className={INPUT}
          />
        </Field>
      )}
    </FormDialog>
  )
}

function ResetPasswordForm({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const { field } = useFields({ Password: '' })

  return (
    <FormDialog title={t('UI_RESET_PASSWORD_OF', { username: user.username })} action={resetUserPassword.bind(null, user.id)} onClose={onClose} lock={{ type: 'USER', id: user.id }}>
      <p className="text-base text-body">{t('UI_THIS_ALSO_UNLOCKS_THE_ACCOUNT_AND_SIGNS_THE_USER_OUT')}</p>
      <Field label={t('UI_TEMPORARY_PASSWORD')} hint={passwordHint()}>
        <input
          {...field('Password')}
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={200}
          autoComplete="new-password"
          className={INPUT}
        />
      </Field>
    </FormDialog>
  )
}
