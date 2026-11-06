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

const MIN_PASSWORD_LENGTH = 12
const GRID = 'grid gap-5 md:grid-cols-2'
const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters. The user must change it after signing in.`

const statusLabel = (user: AppUser) => (!user.active ? 'Inactive' : user.locked ? 'Locked' : 'Active')
const STATUS_TONE = { Inactive: 'bad', Locked: 'bad', Active: 'good' } as const

const COLUMNS: Column<AppUser>[] = [
  {
    key: 'name',
    label: 'Name',
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
    label: 'Contact',
    text: user => `${user.email} ${user.contactNo}`,
    render: user => (
      <>
        <p>{user.email}</p>
        <p className="text-sm text-muted">{user.contactNo}</p>
      </>
    ),
  },
  { key: 'role', label: 'Role', filter: 'select', text: user => user.roleName },
  {
    key: 'status',
    label: 'Status',
    filter: 'select',
    text: statusLabel,
    render: user => <StatusBadge label={statusLabel(user)} tone={STATUS_TONE[statusLabel(user)]} />,
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
        searchLabel="Search users"
        emptyText="No users yet."
        minWidth="1300px"
        toolbar={
          <>
            <button
              onClick={() => setForm('new')}
              className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
            >
              Add
            </button>
            <RefreshButton />
          </>
        }
        rowActions={user => (
          <div className="flex justify-end gap-2.5">
            <button onClick={() => setForm(user)} className={ROW_BUTTON_NEUTRAL} aria-label={`Edit ${user.username}`}>
              Edit
            </button>
            <button onClick={() => setResetting(user)} className={ROW_BUTTON_NEUTRAL} aria-label={`Reset password of ${user.username}`}>
              Reset password
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
      title={user ? `Edit ${user.username}` : 'Add user'}
      action={saveUser.bind(null, user?.id ?? null)}
      onClose={onClose}
      lock={user ? { type: 'USER', id: user.id } : undefined}
      wide
    >
      <div className={GRID}>
        <Field label="Username" hint={user ? 'A username can’t be changed.' : undefined}>
          <input
            {...field('Username')}
            required
            readOnly={Boolean(user)}
            maxLength={100}
            autoComplete="off"
            className={`${INPUT} ${user ? 'bg-elevated text-muted' : ''}`}
          />
        </Field>
        <Field label="Role">
          <select {...field('RoleID')} required className={INPUT}>
            <option value="">Select role</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </Field>
        <Field label="First name">
          <input {...field('FirstName')} required maxLength={150} className={INPUT} />
        </Field>
        <Field label="Last name">
          <input {...field('LastName')} required maxLength={150} className={INPUT} />
        </Field>
        <Field label="Email">
          <input {...field('Email')} type="email" required maxLength={255} className={INPUT} />
        </Field>
        <Field label="Mobile number">
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
          Active. An inactive user can’t sign in.
        </label>
      ) : (
        <Field label="Temporary password" hint={PASSWORD_HINT}>
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
    <FormDialog title={`Reset password of ${user.username}`} action={resetUserPassword.bind(null, user.id)} onClose={onClose} lock={{ type: 'USER', id: user.id }}>
      <p className="text-base text-body">This also unlocks the account and signs the user out.</p>
      <Field label="Temporary password" hint={PASSWORD_HINT}>
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
