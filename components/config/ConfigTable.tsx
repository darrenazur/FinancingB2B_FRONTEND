'use client'

import { useMemo, useState } from 'react'
import { deleteConfigRecord } from '../../app/config/actions'
import { Audit } from '../../lib/audit'
import { ConfigResource } from '../../lib/config/resources'
import { configLock } from '../../lib/lock'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import ConfigForm from './ConfigForm'
import { t } from '../../lib/captions/t'

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
  canEdit: boolean
}

export default function ConfigTable({ resource, rows, options, canEdit }: ConfigTableProps) {
  const editable = canEdit && !resource.readOnly
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
      label: t('UI_RECORD'),
      filter: 'select',
      text: row => (row.deleted ? t('UI_DELETED_2') : t('UI_ACTIVE')),
      render: row => <StatusBadge label={row.deleted ? t('UI_DELETED_2') : t('UI_ACTIVE')} tone={row.deleted ? 'bad' : 'good'} />,
    }
    return [...fieldColumns, recordColumn, ...auditColumns<ConfigRow>()]
  }, [resource, options])

  const firstField = columns[0]
  const lastField = columns[resource.fields.length - 1]

  return (
    <>
      {resource.note && (
        <p className="mb-5 rounded-xl bg-accent-soft px-5 py-3.5 text-base text-accent-strong">{t(resource.note)}</p>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.id}
        searchLabel={t('UI_SEARCH', { value: t(resource.label).toLowerCase() })}
        emptyText={t('UI_NO_RECORDS_YET')}
        minWidth="1060px"
        defaultSort={NEWEST_FIRST}
        toolbar={
          <>
            {editable && (
              <button
                onClick={() => setEditing('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover"
              >
                {t('UI_ADD')}
              </button>
            )}
            <RefreshButton />
          </>
        }
        rowActions={row => editable && !row.deleted && (
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setEditing(row)}
              className={ROW_BUTTON_NEUTRAL}
              aria-label={t('UI_EDIT_2', { row: firstField.text(row) })}
            >
              {t('UI_EDIT')}
            </button>
            <ConfirmAction
              label={t('UI_DELETE')}
              title={t('UI_DELETE_2', { row: lastField.text(row) })}
              message={t('UI_THE_RECORD_STAYS_ON_FILE_BUT_IS_MARKED_DELETED_AND_NEW')}
              action={deleteConfigRecord.bind(null, resource.key, row.id)}
              lock={configLock(resource.path, row.id)}
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
