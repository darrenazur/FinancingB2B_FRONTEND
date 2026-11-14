'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { deletePartner, loadPartner } from '../../app/partners/actions'
import type { Option, Partner, PartnerDetails, PartnerLookups, ScoreSummary } from '../../lib/api/financing'
import { can } from '../../lib/permissions'
import ConfirmAction from '../actions/ConfirmAction'
import RefreshButton from '../actions/RefreshButton'
import { ROW_BUTTON_NEUTRAL } from '../actions/rowButton'
import StatusBadge from '../StatusBadge'
import { auditColumns, NEWEST_FIRST } from '../table/auditColumns'
import DataTable, { Column } from '../table/DataTable'
import AssignPartnersDialog, { LoanStats } from './AssignPartnersDialog'
import GradeBadge from './GradeBadge'
import PartnerForm from './PartnerForm'
import VerificationAction from './VerificationAction'
import { t } from '../../lib/captions/t'

const STATUS_TONE: Record<string, 'good' | 'neutral' | 'bad'> = { VERIFIED: 'good', REJECTED: 'bad' }

const BASE_COLUMNS: Column<Partner>[] = [
  {
    key: 'name',
    label: 'UI_NAME',
    text: partner => `${partner.name} ${partner.partnerNo}`,
    render: partner => (
      <>
        <p className="whitespace-nowrap">{partner.name}</p>
        <p className="text-sm font-normal text-muted">{t('UI_NO')}{' '}{partner.partnerNo}</p>
      </>
    ),
  },
  {
    key: 'contact',
    label: 'UI_CONTACT',
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
    label: 'UI_VERIFICATION',
    filter: 'select',
    text: partner => partner.status,
    render: partner => <StatusBadge label={partner.status} tone={STATUS_TONE[partner.status] ?? 'neutral'} />,
  },
]
const RECORD_COLUMNS: Column<Partner>[] = [
  {
    key: 'record',
    label: 'UI_RECORD',
    filter: 'select',
    text: partner => (partner.deleted ? t('UI_DELETED_2') : t('UI_ACTIVE')),
    render: partner => <StatusBadge label={partner.deleted ? t('UI_DELETED_2') : t('UI_ACTIVE')} tone={partner.deleted ? 'bad' : 'good'} />,
  },
  ...auditColumns<Partner>(),
]

interface PartnersTableProps {
  partners: Partner[]
  lookups: PartnerLookups
  users: Option[]
  loanStats: Record<number, LoanStats>
  scores: Record<number, ScoreSummary>
  permissions: string[]
}

// Grades sort A first, then B to E, then NEW
const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, NEW: 6 }

export default function PartnersTable({ partners, lookups, users, loanStats, scores, permissions }: PartnersTableProps) {
  const [form, setForm] = useState<PartnerDetails | 'new' | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, startLoading] = useTransition()

  // Only users who can assign see who each partner is assigned to.
  const canAssign = can(permissions, 'partner.assign')
  const columns = useMemo<Column<Partner>[]>(() => {
    // Credit score (live from PARTNERSCORE_VW); the Score button shows how it was worked out
    const grade: Column<Partner> = {
      key: 'grade',
      label: 'UI_GRADE',
      filter: 'select',
      text: partner => scores[partner.id]?.grade ?? '',
      render: partner => scores[partner.id] ? <GradeBadge grade={scores[partner.id].grade} score={scores[partner.id].finalScore} /> : null,
      compare: (a, b) => (GRADE_ORDER[scores[a.id]?.grade] ?? 9) - (GRADE_ORDER[scores[b.id]?.grade] ?? 9)
        || (scores[b.id]?.finalScore ?? 0) - (scores[a.id]?.finalScore ?? 0),
    }
    if (!canAssign) return [...BASE_COLUMNS, grade, ...RECORD_COLUMNS]
    const assignedTo = (partner: Partner) =>
      partner.assignedUserId === null ? t('UI_UNASSIGNED') : users.find(user => user.id === partner.assignedUserId)?.label ?? '—'
    return [...BASE_COLUMNS, grade, { key: 'assigned', label: 'UI_ASSIGNED_TO', filter: 'select', text: assignedTo }, ...RECORD_COLUMNS]
  }, [canAssign, users, scores])

  const openEdit = (id: number) => {
    setLoadError(null)
    startLoading(async () => {
      const details = await loadPartner(id)
      if (details) setForm(details)
      else setLoadError(t('UI_CANT_LOAD_THIS_PARTNER_REFRESH_AND_TRY_AGAIN'))
    })
  }

  return (
    <>
      {loadError && <p role="alert" className="mb-4 text-base text-bad">{loadError}</p>}

      <DataTable
        rows={partners}
        columns={columns}
        rowKey={partner => partner.id}
        toolbar={
          <>
            {can(permissions, 'partner.add') && (
              <button
                onClick={() => setForm('new')}
                className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover"
              >
                {t('UI_ADD')}
              </button>
            )}
            {can(permissions, 'partner.assign') && users.length > 0 && (
              <button
                onClick={() => setAssigning(true)}
                className="rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated"
              >
                {t('UI_ASSIGN_2')}
              </button>
            )}
            <RefreshButton />
          </>
        }
        searchLabel={t('UI_SEARCH_PARTNERS')}
        emptyText={t('UI_NO_PARTNERS_YET')}
        minWidth="1500px"
        defaultSort={NEWEST_FIRST}
        rowActions={partner => !partner.deleted && (
          <div className="flex justify-end gap-2.5">
            <Link href={`/credit-score?p=${partner.id}#p${partner.id}`} className={ROW_BUTTON_NEUTRAL} aria-label={t('UI_CREDIT_SCORE_OF', { name: partner.name })}>
              {t('UI_SCORE')}
            </Link>
            {can(permissions, 'partner.verify') && <VerificationAction partner={partner} />}
            {can(permissions, 'partner.edit') && (
              <button
                onClick={() => openEdit(partner.id)}
                disabled={loading}
                className={ROW_BUTTON_NEUTRAL}
                aria-label={t('UI_EDIT_4', { name: partner.name })}
              >
                {t('UI_EDIT')}
              </button>
            )}
            {can(permissions, 'partner.delete') && (
              <ConfirmAction
                label={t('UI_DELETE')}
                title={t('UI_DELETE_3', { name: partner.name })}
                message={t('UI_THE_RECORD_STAYS_ON_FILE_BUT_IS_MARKED_DELETED_A_PARTNER')}
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

      {assigning && (
        <AssignPartnersDialog partners={partners} users={users} loanStats={loanStats} onClose={() => setAssigning(false)} />
      )}
    </>
  )
}
