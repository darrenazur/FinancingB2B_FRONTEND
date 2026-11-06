'use client'

import { useState } from 'react'
import { deleteRole, saveRole } from '../../app/config/security/actions'
import type { AppRole, Permission } from '../../lib/api/security'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import FormDialog, { Field, INPUT, useFields } from '../forms/FormDialog'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'

const SCOPE_LABEL = { ALL: 'All records', OWN: 'Own records' }

const COLUMNS: Column<AppRole>[] = [
  {
    key: 'name',
    label: 'Role',
    text: role => `${role.name} ${role.description}`,
    render: role => (
      <>
        <p>{role.name}</p>
        <p className="text-sm font-normal text-muted">{role.description}</p>
      </>
    ),
  },
  { key: 'scope', label: 'Sees', filter: 'select', text: role => SCOPE_LABEL[role.dataScope] },
  {
    key: 'permissions',
    label: 'Permissions',
    text: role => String(role.permissions.length),
    compare: (a, b) => a.permissions.length - b.permissions.length,
  },
  {
    key: 'type',
    label: 'Type',
    filter: 'select',
    text: role => (role.system ? 'System' : 'Custom'),
    render: role => <StatusBadge label={role.system ? 'System' : 'Custom'} tone="neutral" />,
  },
  ...auditColumns<AppRole>(),
]

interface RolesTableProps {
  roles: AppRole[]
  permissions: Permission[]
}

export default function RolesTable({ roles, permissions }: RolesTableProps) {
  const [form, setForm] = useState<AppRole | 'new' | null>(null)

  return (
    <>
      <p className="mb-5 rounded-xl bg-accent-soft px-5 py-3.5 text-base text-accent-strong">
        The ADMIN role can’t be changed. Permission changes apply to signed-in users on their next action.
      </p>

      <DataTable
        rows={roles}
        columns={COLUMNS}
        rowKey={role => role.id}
        defaultSort={NEWEST_FIRST}
        searchLabel="Search roles"
        emptyText="No roles yet."
        minWidth="1200px"
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
        rowActions={role => !role.system && (
          <div className="flex justify-end gap-2.5">
            <button onClick={() => setForm(role)} className={ROW_BUTTON_NEUTRAL} aria-label={`Edit ${role.name}`}>
              Edit
            </button>
            <ConfirmAction
              label="Delete"
              title={`Delete ${role.name}?`}
              message="A role that users still have can’t be deleted."
              action={deleteRole.bind(null, role.id)}
              lock={{ type: 'ROLE', id: role.id }}
            />
          </div>
        )}
      />

      {form && (
        <RoleForm
          key={form === 'new' ? 'new' : form.id}
          role={form === 'new' ? null : form}
          permissions={permissions}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}

interface RoleFormProps {
  role: AppRole | null
  permissions: Permission[]
  onClose: () => void
}

function RoleForm({ role, permissions, onClose }: RoleFormProps) {
  const [selected, setSelected] = useState(() => new Set(role?.permissions ?? []))
  const { field } = useFields({
    RoleName: role?.name ?? '',
    Description: role?.description ?? '',
    DataScope: role?.dataScope ?? 'OWN',
  })
  const modules = [...new Set(permissions.map(item => item.moduleName))]

  const toggle = (code: string, checked: boolean) => {
    setSelected(current => {
      const next = new Set(current)
      if (checked) next.add(code)
      else next.delete(code)
      return next
    })
  }

  return (
    <FormDialog title={role ? `Edit ${role.name}` : 'Add role'} action={saveRole.bind(null, role?.id ?? null)} onClose={onClose} lock={role ? { type: 'ROLE', id: role.id } : undefined} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Role name">
          <input {...field('RoleName')} required maxLength={50} className={`${INPUT} uppercase`} />
        </Field>
        <Field label="Sees">
          <select {...field('DataScope')} required className={INPUT}>
            <option value="OWN">Own records only</option>
            <option value="ALL">All records</option>
          </select>
        </Field>
      </div>
      <Field label="Description (optional)">
        <input {...field('Description')} maxLength={255} className={INPUT} />
      </Field>

      {modules.map(moduleName => (
        <fieldset key={moduleName} className="flex flex-col gap-2.5">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{moduleName}</legend>
          {permissions.filter(item => item.moduleName === moduleName).map(item => (
            <label key={item.code} className="flex items-start gap-3 text-base text-body">
              <input
                type="checkbox"
                name="Permissions"
                value={item.code}
                checked={selected.has(item.code)}
                onChange={event => toggle(item.code, event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              {item.description}
            </label>
          ))}
        </fieldset>
      ))}
    </FormDialog>
  )
}
