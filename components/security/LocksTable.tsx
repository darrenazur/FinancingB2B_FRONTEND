'use client'

import { forceReleaseLock } from '../../app/locks/actions'
import type { RecordLock } from '../../lib/api/security'
import { SaveState } from '../../lib/config/resources'
import { formatDateTime } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import StatusBadge from '../StatusBadge'
import DataTable, { Column } from '../table/DataTable'
import { t } from '../../lib/captions/t'

const recordLabel = (lock: RecordLock) => `${lock.kind} ${lock.recordName}`.trim()
const statusLabel = (lock: RecordLock) => (lock.active ? t('UI_ACTIVE') : t('UI_ENDED'))

const COLUMNS: Column<RecordLock>[] = [
  { key: 'record', label: 'UI_RECORD', text: recordLabel },
  {
    key: 'holder',
    label: 'UI_HELD_BY',
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
    label: 'UI_SINCE',
    text: lock => formatDateTime(lock.lockedAt),
    compare: (a, b) => a.lockedAt.localeCompare(b.lockedAt),
  },
  {
    key: 'until',
    label: 'UI_UNTIL',
    text: lock => formatDateTime(lock.expiresAt),
    compare: (a, b) => a.expiresAt.localeCompare(b.expiresAt),
  },
  {
    key: 'status',
    label: 'UI_STATUS',
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
      searchLabel={t('UI_SEARCH_LOCKS')}
      emptyText={t('UI_NO_RECORDS_ARE_LOCKED')}
      minWidth="1000px"
      toolbar={<RefreshButton />}
      rowActions={lock => (
        <div className="flex justify-end">
          <ConfirmAction
            label={t('UI_RELEASE')}
            title={t('UI_RELEASE_2', { lock: recordLabel(lock) })}
            message={t('UI_IF_SOMEONE_IS_EDITING_THIS_RECORD_THEIR_WINDOW_CLOSES_AND')}
            action={release(lock)}
          />
        </div>
      )}
    />
  )
}
