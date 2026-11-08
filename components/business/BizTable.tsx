'use client'

import { useMemo, useState } from 'react'
import { deleteBizRecord } from '../../app/business/actions'
import type { BizOption, BizRow } from '../../lib/api/business'
import { BizResource, BizSource } from '../../lib/business/resources'
import { compareMoney } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import BizForm from './BizForm'
import { displayValue } from './display'
import { t } from '../../lib/captions/t'

interface BizTableProps {
  resource: BizResource
  rows: BizRow[]
  options: Partial<Record<BizSource, BizOption[]>>
  canEdit: boolean
}

const money = (value: string) => value || '0'

export default function BizTable({ resource, rows, options, canEdit }: BizTableProps) {
  const [editing, setEditing] = useState<BizRow | 'new' | null>(null)
  const hasRecordColumn = resource.canDelete
  // A removed row (like a loan taken off a contract) reads "Removed" instead of "Deleted"
  const ended = t(resource.removeWording ? 'UI_REMOVED' : 'UI_DELETED_2')

  const columns = useMemo(() => {
    const list: Column<BizRow>[] = resource.columns.map(column => ({
      key: column.name,
      label: column.label,
      filter: ['inout', 'paidOff', 'opening', 'month'].includes(column.kind) || column.name.endsWith('Name') ? 'select' : 'text',
      align: ['money', 'percent', 'number'].includes(column.kind) ? 'right' : undefined,
      text: row => displayValue(column.kind, row.values[column.name] ?? ''),
      compare: column.kind === 'money'
        ? (a, b) => compareMoney(money(a.values[column.name] ?? ''), money(b.values[column.name] ?? ''))
        : ['date', 'month', 'percent', 'number'].includes(column.kind)
          ? (a, b) => (a.values[column.name] ?? '').localeCompare(b.values[column.name] ?? '', 'en', { numeric: true })
          : undefined,
      render: column.kind === 'paidOff'
        ? row => <StatusBadge label={displayValue('paidOff', row.values[column.name] ?? '')} tone={row.values[column.name] === '1' ? 'good' : 'neutral'} />
        : undefined,
    }))
    if (hasRecordColumn) {
      list.push({
        key: 'record',
        label: t('UI_RECORD'),
        filter: 'select',
        text: row => (row.deleted ? ended : t('UI_ACTIVE')),
        render: row => (
          <div className="flex flex-col gap-1">
            <StatusBadge label={row.deleted ? ended : t('UI_ACTIVE')} tone={row.deleted ? 'bad' : 'good'} />
            {row.deleted && row.deleteReason && <span className="text-sm text-muted">{row.deleteReason}</span>}
          </div>
        ),
      })
    }
    return [...list, ...auditColumns<BizRow>()]
  }, [resource, hasRecordColumn, ended])

  const titleColumn = resource.columns.find(column => column.name === resource.titleField)
  const rowTitle = (row: BizRow) => displayValue(titleColumn?.kind ?? 'text', row.values[resource.titleField] ?? '')

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={row => row.key}
        searchLabel={t('UI_SEARCH', { value: t(resource.label).toLowerCase() })}
        emptyText={t('UI_NO_RECORDS_YET')}
        minWidth="1060px"
        defaultSort={NEWEST_FIRST}
        toolbar={
          <>
            {canEdit && resource.canAdd && (
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
        rowActions={row => canEdit && !row.deleted && (
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setEditing(row)}
              className={ROW_BUTTON_NEUTRAL}
              aria-label={resource.editLabel ? `${t(resource.editLabel)} · ${rowTitle(row)}` : t('UI_EDIT_2', { row: rowTitle(row) })}
            >
              {t(resource.editLabel ?? 'UI_EDIT')}
            </button>
            {resource.canDelete && (
              <ConfirmAction
                label={t(resource.removeWording ? 'UI_REMOVE' : 'UI_DELETE')}
                title={t(resource.removeWording ? 'UI_REMOVE_2' : 'UI_DELETE_2', { row: rowTitle(row) })}
                message={t(resource.removeWording ? 'UI_BIZ_REMOVE_MESSAGE' : 'UI_BIZ_DELETE_MESSAGE')}
                reasonLabel={t(resource.removeWording ? 'UI_REASON_FOR_REMOVING' : 'UI_REASON_FOR_DELETING')}
                action={deleteBizRecord.bind(null, resource.key, row.id)}
              />
            )}
          </div>
        )}
      />

      {editing && (
        <BizForm
          key={editing === 'new' ? 'new' : editing.key}
          resource={resource}
          row={editing === 'new' ? null : editing}
          title={editing === 'new' ? t('UI_ADD') : resource.editLabel ? `${t(resource.editLabel)} · ${rowTitle(editing)}` : t('UI_EDIT_2', { row: rowTitle(editing) })}
          options={options}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
