'use client'

import { useState, useTransition } from 'react'
import { deletePartner, loadPartner } from '../../app/partners/actions'
import type { Option, Partner, PartnerDetails, PartnerLookups } from '../../lib/api/financing'
import { can } from '../../lib/permissions'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import AssignAction from './AssignAction'
import PartnerForm from './PartnerForm'
import VerificationAction from './VerificationAction'

const STATUS_TONE: Record<string, 'good' | 'neutral' | 'bad'> = { VERIFIED: 'good', REJECTED: 'bad' }

const COLUMNS: Column<Partner>[] = [
  {
    key: 'name',
    label: 'Name',
    text: partner => `${partner.name} ${partner.partnerNo}`,
    render: partner => (
      <>
        <p className="whitespace-nowrap">{partner.name}</p>
        <p className="text-sm font-normal text-muted">No. {partner.partnerNo}</p>
      </>
    ),
  },
  {
    key: 'contact',
    label: 'Contact',
    text: partner => `${partner.email} ${partner.contactNo}`,
    render: partner => (
      <>
        <p>{partner.email}</p>
        <p className="text-sm text-muted">{partner.contactNo}</p>
      </>
    ),
  },
  {
    key: 'verification',
    label: 'Verification',
    filter: 'select',
    text: partner => partner.status,
    render: partner => <StatusBadge label={partner.status} tone={STATUS_TONE[partner.status] ?? 'neutral'} />,
  },
  {
    key: 'record',
    label: 'Record',
    filter: 'select',
    text: partner => (partner.deleted ? 'Deleted' : 'Active'),
    render: partner => <StatusBadge label={partner.deleted ? 'Deleted' : 'Active'} tone={partner.deleted ? 'bad' : 'good'} />,
  },
  ...auditColumns<Partner>(),
]

interface PartnersTableProps {
  partners: Partner[]
  lookups: PartnerLookups
  users: Option[]
  permissions: string[]
}

export default function PartnersTable({ partners, lookups, users, permissions }: PartnersTableProps) {
  const [form, setForm] = useState<PartnerDetails | 'new' | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, startLoading] = useTransition()

  const openEdit = (id: number) => {
    setLoadError(null)
    startLoading(async () => {
      const details = await loadPartner(id)
      if (details) setForm(details)
      else setLoadError('Can’t load this partner. Refresh and try again.')
    })
  }

  return (
    <>
      {loadError && <p role="alert" className="mb-4 text-base text-bad">{loadError}</p>}

      <DataTable
        rows={partners}
        columns={COLUMNS}
        rowKey={partner => partner.id}
        toolbar={
          <>
            {can(permissions, 'partner.add') && (
              <button
                onClick={() => setForm('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
              >
                Add
              </button>
            )}
            <RefreshButton />
          </>
        }
        searchLabel="Search partners"
        emptyText="No partners yet."
        minWidth="1500px"
        defaultSort={NEWEST_FIRST}
        rowActions={partner => !partner.deleted && (
          <div className="flex justify-end gap-2.5">
            {can(permissions, 'partner.assign') && <AssignAction partner={partner} users={users} />}
            {can(permissions, 'partner.verify') && <VerificationAction partner={partner} />}
            {can(permissions, 'partner.edit') && (
              <button
                onClick={() => openEdit(partner.id)}
                disabled={loading}
                className={ROW_BUTTON_NEUTRAL}
                aria-label={`Edit ${partner.name}`}
              >
                Edit
              </button>
            )}
            {can(permissions, 'partner.delete') && (
              <ConfirmAction
                label="Delete"
                title={`Delete ${partner.name}?`}
                message="The record stays on file but is marked deleted. A partner with an open loan can't be deleted."
                action={deletePartner.bind(null, partner.id)}
                lock={{ type: 'PARTNER', id: partner.id }}
              />
            )}
          </div>
        )}
      />

      {form && (
        <PartnerForm
          key={form === 'new' ? 'new' : form.id}
          partner={form === 'new' ? null : form}
          lookups={lookups}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
