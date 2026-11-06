'use client'

import { forceReleaseLock } from '../../app/locks/actions'
import type { RecordLock } from '../../lib/api/security'
import { SaveState } from '../../lib/config/resources'
import { formatDateTime } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import StatusBadge from '../StatusBadge'
import DataTable, { Column } from '../table/DataTable'

const recordLabel = (lock: RecordLock) => `${lock.kind} ${lock.recordName}`.trim()
const statusLabel = (lock: RecordLock) => (lock.active ? 'Active' : 'Ended')

const COLUMNS: Column<RecordLock>[] = [
  { key: 'record', label: 'Record', text: recordLabel },
  {
    key: 'holder',
    label: 'Held by',
    text: lock => `${lock.holderName} ${lock.holderUsername}`.trim(),
    render: lock => (
      <>
        <p className="whitespace-nowrap">{lock.holderName}</p>
        <p className="text-sm font-normal text-muted">{lock.holderUsername}</p>
      </>
    ),
  },
  {
    key: 'since',
    label: 'Since',
    text: lock => formatDateTime(lock.lockedAt),
    compare: (a, b) => a.lockedAt.localeCompare(b.lockedAt),
  },
  {
    key: 'until',
    label: 'Until',
    text: lock => formatDateTime(lock.expiresAt),
    compare: (a, b) => a.expiresAt.localeCompare(b.expiresAt),
  },
  {
    key: 'status',
    label: 'Status',
    filter: 'select',
    text: statusLabel,
    render: lock => <StatusBadge label={statusLabel(lock)} tone={lock.active ? 'good' : 'bad'} />,
  },
]

const release = (lock: RecordLock) => (_previous: SaveState) => forceReleaseLock({ type: lock.type, id: lock.id })

export default function LocksTable({ locks }: { locks: RecordLock[] }) {
  return (
    <DataTable
      rows={locks}
      columns={COLUMNS}
      rowKey={lock => lock.key}
      defaultSort={{ key: 'since', direction: 'desc' }}
      searchLabel="Search locks"
      emptyText="No records are locked."
      minWidth="1000px"
      toolbar={<RefreshButton />}
      rowActions={lock => (
        <div className="flex justify-end">
          <ConfirmAction
            label="Release"
            title={`Release ${recordLabel(lock)}?`}
            message="If someone is editing this record, their window closes and their unsaved changes are lost."
            action={release(lock)}
          />
        </div>
      )}
    />
  )
}
