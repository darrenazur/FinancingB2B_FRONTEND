'use client'

import { useMemo, useState } from 'react'
import { assignPartners } from '../../app/partners/actions'
import type { Option, Partner } from '../../lib/api/financing'
import { formatMoney } from '../../lib/format'
import FormDialog, { Field, INPUT } from '../forms/FormDialog'
import { t } from '../../lib/captions/t'

export interface LoanStats {
  open: number
  principal: string
}

interface AssignPartnersDialogProps {
  partners: Partner[]
  users: Option[]
  loanStats: Record<number, LoanStats>
  onClose: () => void
}

const CELL = 'px-3 py-2.5'

// Assigns many partners at once. The save is all or nothing, and it asks for a confirmation
// that names how many partners move and where they come from, so a stray "select all" is caught.
export default function AssignPartnersDialog({ partners, users, loanStats, onClose }: AssignPartnersDialogProps) {
  const active = useMemo(() => partners.filter(partner => !partner.deleted), [partners])
  const [search, setSearch] = useState('')
  // '' = all, 'none' = unassigned, otherwise a user id
  const [show, setShow] = useState('')
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [userId, setUserId] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const userName = (id: number | null) => users.find(user => user.id === id)?.label ?? '—'
  const currentOf = (id: number) => active.find(partner => partner.id === id)?.assignedUserId ?? null

  const needle = search.trim().toLowerCase()
  const shown = active.filter(partner => {
    if (needle && !`${partner.name} ${partner.partnerNo}`.toLowerCase().includes(needle)) return false
    if (show === 'none') return partner.assignedUserId === null
    return show === '' || String(partner.assignedUserId) === show
  })
  const allShown = shown.length > 0 && shown.every(partner => checked.has(partner.id))

  // Partners that already have the chosen agent are left out: nothing to change.
  const toSend = [...checked].filter(id => String(currentOf(id) ?? '') !== userId)
  const target = userId === '' ? t('UI_NOBODY') : userName(Number(userId))
  const fromCounts = toSend.reduce<Record<string, number>>((counts, id) => {
    const from = currentOf(id)
    const key = from === null ? t('UI_UNASSIGNED') : userName(from)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})

  // A new pick or a new agent needs a fresh confirmation.
  const pick = (change: (current: Set<number>) => Set<number>) => {
    setChecked(current => change(new Set(current)))
    setConfirmed(false)
  }
  const toggle = (id: number) => pick(next => {
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleShown = () => pick(next => {
    shown.forEach(partner => (allShown ? next.delete(partner.id) : next.add(partner.id)))
    return next
  })

  const names = useMemo(() => Object.fromEntries(active.map(partner => [partner.id, partner.name])), [active])

  return (
    <FormDialog title={t('UI_ASSIGN_PARTNERS')} action={assignPartners.bind(null, names)} onClose={onClose} wide>
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={t('UI_SEARCH_PARTNERS')}
          aria-label={t('UI_SEARCH_PARTNERS')}
          className={`${INPUT} sm:w-64`}
        />
        <select value={show} onChange={event => setShow(event.target.value)} aria-label={t('UI_SHOW')} className={`${INPUT} sm:w-56`}>
          <option value="">{t('UI_ALL')}</option>
          <option value="none">{t('UI_UNASSIGNED')}</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.label}</option>)}
        </select>
      </div>

      <div className="max-h-80 overflow-auto rounded-xl border border-line">
        <table className="w-full text-left text-base">
          <thead className="sticky top-0 bg-surface text-sm text-muted shadow-[0_1px_0_var(--border)]">
            <tr>
              <th className={CELL}>
                <input type="checkbox" checked={allShown} onChange={toggleShown} aria-label={t('UI_SELECT_ALL_SHOWN')} className="h-5 w-5 align-middle" />
              </th>
              <th className={`${CELL} font-medium`}>{t('UI_NAME')}</th>
              <th className={`${CELL} text-right font-medium`}>{t('UI_OPEN_LOANS')}</th>
              <th className={`${CELL} text-right font-medium`}>{t('UI_PRINCIPAL')}</th>
              <th className={`${CELL} font-medium`}>{t('UI_AGENT')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map(partner => (
              <tr
                key={partner.id}
                onClick={() => toggle(partner.id)}
                className={`cursor-pointer ${checked.has(partner.id) ? 'bg-elevated' : 'hover:bg-elevated/50'}`}
              >
                <td className={CELL}>
                  <input
                    type="checkbox"
                    checked={checked.has(partner.id)}
                    onChange={() => toggle(partner.id)}
                    onClick={event => event.stopPropagation()}
                    aria-label={partner.name}
                    className="h-5 w-5 align-middle"
                  />
                </td>
                <td className={CELL}>
                  <p className="whitespace-nowrap font-medium text-ink">{partner.name}</p>
                  <p className="text-sm text-muted">{t('UI_NO')}{' '}{partner.partnerNo}</p>
                </td>
                <td className={`${CELL} text-right tabular-nums`}>{loanStats[partner.id]?.open ?? 0}</td>
                <td className={`${CELL} whitespace-nowrap text-right tabular-nums`}>{formatMoney(loanStats[partner.id]?.principal ?? '0')}</td>
                <td className={CELL}>{userName(partner.assignedUserId)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">{t('UI_NO_MATCHES')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted">{t('UI_COUNT_SELECTED', { count: checked.size })}</p>

      <Field label={t('UI_ASSIGNED_TO')}>
        <select
          name="AssignedUserID"
          value={userId}
          onChange={event => {
            setUserId(event.target.value)
            setConfirmed(false)
          }}
          className={INPUT}
        >
          <option value="">{t('UI_NOBODY')}</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.label}</option>)}
        </select>
      </Field>

      {toSend.map(id => <input key={id} type="hidden" name="PartnerID" value={id} />)}

      {toSend.length === 0 ? (
        checked.size > 0 && <p className="text-base text-muted">{t('UI_NOTHING_TO_CHANGE_SAME_AGENT')}</p>
      ) : (
        <div className="rounded-xl border border-line bg-elevated p-4">
          <p className="font-medium text-ink">{t('UI_PARTNERS_WILL_BE_ASSIGNED', { count: toSend.length, user: target })}</p>
          <ul className="mt-1 list-disc pl-6 text-base text-body">
            {Object.entries(fromCounts).map(([from, count]) => (
              <li key={from}>{t('UI_COUNT_FROM', { count, from })}</li>
            ))}
          </ul>
          <label className="mt-3 flex items-start gap-3 text-base font-medium text-ink">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
              className="mt-0.5 h-5 w-5"
            />
            {t('UI_CONFIRM_ASSIGN_PARTNERS', { count: toSend.length, user: target })}
          </label>
        </div>
      )}
    </FormDialog>
  )
}
