'use client'

import { deletePartner } from '../../app/partners/actions'
import type { Partner } from '../../lib/api/financing'
import { formatDate } from '../../lib/format'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import StatusBadge from '../StatusBadge'
import DataTable, { Column } from '../table/DataTable'

const COLUMNS: Column<Partner>[] = [
  {
    key: 'name',
    label: 'Name',
    text: partner => `${partner.name} ID ${partner.id}`,
    render: partner => (
      <>
        <p>{partner.name}</p>
        <p className="text-sm font-normal text-muted">ID {partner.id}</p>
      </>
    ),
  },
  {
    key: 'added',
    label: 'Added',
    text: partner => formatDate(partner.createdAt),
    compare: (a, b) => a.createdAt.localeCompare(b.createdAt),
  },
  {
    key: 'record',
    label: 'Record',
    filter: 'select',
    text: partner => (partner.deleted ? 'Deleted' : 'Active'),
    render: partner => <StatusBadge label={partner.deleted ? 'Deleted' : 'Active'} tone={partner.deleted ? 'bad' : 'good'} />,
  },
]

export default function PartnersTable({ partners }: { partners: Partner[] }) {
  return (
    <DataTable
      rows={partners}
      columns={COLUMNS}
      rowKey={partner => partner.id}
      toolbar={<RefreshButton />}
      searchLabel="Search partners"
      emptyText="No partners yet."
      minWidth="640px"
      rowActions={partner => !partner.deleted && (
        <ConfirmAction
          label="Delete"
          title={`Delete ${partner.name}?`}
          message="The record stays on file but is marked deleted. A partner with an open loan can't be deleted."
          action={deletePartner.bind(null, partner.id)}
        />
      )}
    />
  )
}
