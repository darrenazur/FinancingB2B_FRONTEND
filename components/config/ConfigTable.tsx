'use client'

import { useMemo, useState } from 'react'
import { deleteConfigRecord } from '../../app/config/actions'
import { Audit } from '../../lib/audit'
import { ConfigResource } from '../../lib/config/resources'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import ConfigForm from './ConfigForm'

export interface FieldOption {
  value: number
  label: string
  deleted: boolean
  parents: Record<string, number>
}

export interface ConfigRow extends Audit {
  id: number
  deleted: boolean
  values: Record<string, string>
}

interface ConfigTableProps {
  resource: ConfigResource
  rows: ConfigRow[]
  options: Record<string, FieldOption[]>
}

export default function ConfigTable({ resource, rows, options }: ConfigTableProps) {
  const [editing, setEditing] = useState<ConfigRow | 'new' | null>(null)

  const columns = useMemo(() => {
    const fieldColumns: Column<ConfigRow>[] = resource.fields.map(field => ({
      key: field.name,
      label: field.label,
      filter: field.type === 'select' ? 'select' : 'text',
      text: row => {
        const value = row.values[field.name]
        return options[field.name]?.find(option => String(option.value) === value)?.label ?? value
      },
    }))
    const recordColumn: Column<ConfigRow> = {
      key: 'record',
      label: 'Record',
      filter: 'select',
      text: row => (row.deleted ? 'Deleted' : 'Active'),
      render: row => <StatusBadge label={row.deleted ? 'Deleted' : 'Active'} tone={row.deleted ? 'bad' : 'good'} />,
    }
    return [...fieldColumns, recordColumn, ...auditColumns<ConfigRow>()]
  }, [resource, options])

  const firstField = columns[0]
  const lastField = columns[resource.fields.length - 1]

  return (
    <>
      {resource.note && (
        <p className="mb-5 rounded-xl bg-accent-soft px-5 py-3.5 text-base text-accent-strong">{resource.note}</p>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.id}
        searchLabel={`Search ${resource.label.toLowerCase()}`}
        emptyText="No records yet."
        minWidth="1060px"
        defaultSort={NEWEST_FIRST}
        toolbar={
          <>
            {!resource.readOnly && (
              <button
                onClick={() => setEditing('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
              >
                Add
              </button>
            )}
            <RefreshButton />
          </>
        }
        rowActions={row => !resource.readOnly && !row.deleted && (
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setEditing(row)}
              className={ROW_BUTTON_NEUTRAL}
              aria-label={`Edit ${firstField.text(row)}`}
            >
              Edit
            </button>
            <ConfirmAction
              label="Delete"
              title={`Delete ${lastField.text(row)}?`}
              message="The record stays on file but is marked deleted, and new records can't use it."
              action={deleteConfigRecord.bind(null, resource.key, row.id)}
            />
          </div>
        )}
      />

      {editing && (
        <ConfigForm
          key={editing === 'new' ? 'new' : editing.id}
          resource={resource}
          row={editing === 'new' ? null : editing}
          options={options}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
