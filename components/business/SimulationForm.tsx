'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { saveSimSnapshot, type SnapshotSaveState } from '../../app/business/simulation/actions'
import { project, type ProjectionInput, type WhatIf } from '../../lib/business/projection'
import { SECTIONS, type Field, type Kind, type Preset, type SectionKey, type SimForm } from '../../lib/business/snapshot'
import { t } from '../../lib/captions/t'
import { formatMoney } from '../../lib/format'
import { INPUT } from '../forms/FormDialog'
import { formatMonth, trimNumber } from './display'
import SimResult from './SimResult'

type Row = Record<string, string>
type Items = Record<SectionKey, Row[]>

// What each field takes while typing
const PATTERN: Record<Exclude<Kind, 'month' | 'who'> | 'term', RegExp> = {
  money: /^\d{0,12}(\.\d{0,2})?$/,
  pct: /^\d{0,3}(\.\d{0,5})?$/,
  count: /^\d{0,2}$/,
  // Average loan term in months, like 1.5
  term: /^\d{0,2}(\.\d{0,2})?$/,
}

const EMPTY: Items = { pay: [], cash: [], funds: [], emergency: [], cbf: [], bank: [], risks: [] }
// New agents to choose from in Pay
const NEW_AGENTS = [1, 2, 3, 4, 5]
// A new agent's id in Pay: NEW-1, NEW-2, … (never a real AdminUserID)
const NEW_AGENT = 'NEW-'
const NONE: WhatIf = { monthsAhead: 0, feeType: 'PCT', feePct: '', feeAmt: '', avgLoan: '', termMonths: '', interestPct: '', monthlyLossPct: '', cash: [], funds: [], cbf: [], bank: [], risks: [], pay: [], emergency: [] }

// Bad-month presets: starting assumptions, not data. nextDropPct adds a second row the month after.
// They can be changed on the page; the changes last until the page is left.
const PRESETS: Preset[] = [
  { key: 'TYPHOON_LOW', label: 'UI_SIM_PRESET_TYPHOON_LOW', dropPct: '15', lossPct: '0.5', nextDropPct: '' },
  { key: 'TYPHOON_MID', label: 'UI_SIM_PRESET_TYPHOON_MID', dropPct: '35', lossPct: '2', nextDropPct: '' },
  { key: 'TYPHOON_HIGH', label: 'UI_SIM_PRESET_TYPHOON_HIGH', dropPct: '60', lossPct: '5', nextDropPct: '30' },
  { key: 'FLOOD', label: 'UI_SIM_PRESET_FLOOD', dropPct: '25', lossPct: '1', nextDropPct: '' },
  { key: 'QUAKE', label: 'UI_SIM_PRESET_QUAKE', dropPct: '50', lossPct: '8', nextDropPct: '25' },
]
const PRESET_FIELDS: { name: 'dropPct' | 'lossPct' | 'nextDropPct'; label: string }[] = [
  { name: 'dropPct', label: 'UI_SIM_DROP_PCT' },
  { name: 'lossPct', label: 'UI_SIM_LOSS_PCT' },
  { name: 'nextDropPct', label: 'UI_SIM_NEXT_DROP_PCT' },
]

// Agents to choose from in Pay: id and name only
export interface AgentOption { id: string; name: string }

// Loans released in the last months, worked out on the server: the defaults for average loan size and term
export interface LoanStats { loans: number; from: string; to: string; avgLoan: string; termMonths: string }
const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthOf = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`

interface SimulationFormProps {
  input: ProjectionInput
  stats: LoanStats | null
  agents: AgentOption[]
  // A saved snapshot's fields, to start from them ("Load into simulator")
  initial: SimForm | null
  // Save snapshot shows only with business.manage
  canSave: boolean
}

// What-ifs on top of the projection, worked out in the browser as they are typed. Nothing is saved
// unless Save snapshot is pressed.
export default function SimulationForm({ input, stats, agents, initial, canSave }: SimulationFormProps) {
  const baseMonth = input.months[0]?.MonthStart ?? ''
  const [monthsAhead, setMonthsAhead] = useState(initial?.monthsAhead ?? String(Number(input.settings.PROJ_MONTHS) || 12))
  const [feeType, setFeeType] = useState<'PCT' | 'AMT'>(initial?.feeType === 'AMT' ? 'AMT' : 'PCT')
  const [fee, setFee] = useState(initial?.fee ?? '')
  // Blank = the projection's rate, shown in the hint
  const [interestPct, setInterestPct] = useState(initial?.interestPct ?? '')
  // Default loss every month, like 0.5 (an older snapshot has none)
  const [monthlyLossPct, setMonthlyLossPct] = useState(initial?.monthlyLossPct ?? '')
  // Average loan size and term divide, so a half-typed value (1, 10, …) would blow the fee up:
  // the draft follows the typing, and the value used is set on leaving the field or Enter.
  const [avgLoan, setAvgLoan] = useState(initial?.avgLoan ?? stats?.avgLoan ?? '')
  const [avgLoanDraft, setAvgLoanDraft] = useState(avgLoan)
  const [termMonths, setTermMonths] = useState(initial?.termMonths ?? stats?.termMonths ?? '1')
  const [termDraft, setTermDraft] = useState(termMonths)
  // A snapshot from before a kind of what-if existed has no list for it: it starts empty
  const [items, setItems] = useState<Items>(() => ({ ...EMPTY, ...(initial?.items ?? {}) }) as Items)
  const [presets, setPresets] = useState<Preset[]>(initial?.presets?.length ? initial.presets : PRESETS)
  const [presetKey, setPresetKey] = useState(PRESETS[0].key)
  const [presetMonth, setPresetMonth] = useState('')

  const horizon = Math.min(60, Math.max(1, Number(monthsAhead) || 1))
  const months = useMemo(
    () => (baseMonth ? Array.from({ length: horizon }, (_, step) => monthOf(monthIndex(baseMonth) + step + 1)) : []),
    [baseMonth, horizon],
  )

  const base = useMemo(() => project(input, { ...NONE, monthsAhead: horizon }), [input, horizon])
  const whatIf = useMemo((): WhatIf => ({
    monthsAhead: horizon,
    feeType,
    feePct: feeType === 'PCT' ? fee : '',
    feeAmt: feeType === 'AMT' ? fee : '',
    avgLoan,
    termMonths,
    interestPct,
    monthlyLossPct,
    cash: items.cash.map(item => ({ month: item.month, amount: item.amount })),
    funds: items.funds.map(item => ({ month: item.month, amount: item.amount })),
    cbf: items.cbf.map(item => ({ month: item.month, amount: item.amount, ratePct: item.ratePct, months: Number(item.months) })),
    bank: items.bank.map(item => ({ month: item.month, amount: item.amount, ratePct: item.ratePct, months: Number(item.months), fees: item.fees, reserve: item.reserve })),
    emergency: items.emergency.map(item => ({ month: item.month, amount: item.amount })),
    risks: items.risks.map(item => ({ month: item.month, dropPct: item.dropPct, lossPct: item.lossPct })),
    pay: items.pay.map(item => ({ who: item.who, month: item.month, fixed: item.fixed, commissionPct: item.commissionPct })),
  }), [horizon, feeType, fee, avgLoan, termMonths, interestPct, monthlyLossPct, items])
  const simulated = useMemo(() => project(input, whatIf), [input, whatIf])

  // Save snapshot: what was entered and both sets of months, frozen as they are now
  const [snapshotName, setSnapshotName] = useState('')
  const [snapshotNotes, setSnapshotNotes] = useState('')
  const [saving, startSaving] = useTransition()
  const [saved, setSaved] = useState<SnapshotSaveState | null>(null)
  const [savedName, setSavedName] = useState('')

  if (!base || !simulated) return <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>

  const add = (key: SectionKey, fields: Field[]) =>
    setItems(current => ({ ...current, [key]: [...current[key], Object.fromEntries(fields.map(field => [field.name, field.kind === 'month' ? months[0] ?? '' : field.initial ?? '']))] }))
  const remove = (key: SectionKey, index: number) => setItems(current => ({ ...current, [key]: current[key].filter((_, at) => at !== index) }))
  const change = (key: SectionKey, index: number, field: Field, value: string) => {
    if (field.kind !== 'month' && field.kind !== 'who' && !PATTERN[field.kind].test(value)) return
    setItems(current => ({ ...current, [key]: current[key].map((item, at) => (at === index ? { ...item, [field.name]: value } : item)) }))
  }

  // A preset adds its bad month, and the month after when it has a next-month drop
  const addPreset = () => {
    const preset = presets.find(p => p.key === presetKey)
    const month = presetMonth || months[0]
    if (!preset || !month) return
    const next = monthOf(monthIndex(`${month}-01`) + 1)
    const rows: Row[] = [{ month, dropPct: preset.dropPct, lossPct: preset.lossPct }]
    // Past the last month shown, the second row would not count, so it is left out
    if (Number(preset.nextDropPct) > 0 && months.includes(next)) rows.push({ month: next, dropPct: preset.nextDropPct, lossPct: '' })
    setItems(current => ({ ...current, risks: [...current.risks, ...rows] }))
  }
  const changePreset = (key: string, name: 'dropPct' | 'lossPct' | 'nextDropPct', value: string) => {
    if (!PATTERN.pct.test(value)) return
    setPresets(current => current.map(p => (p.key === key ? { ...p, [name]: value } : p)))
  }

  // Who can get a pay change, and today's pay: the owner from the setting, each agent's rate in force in the base month
  const who: [string, string][] = [['OWNER', t('UI_SIM_OWNER')], ...agents.map(agent => [agent.id, agent.name] as [string, string]),
    ...NEW_AGENTS.map(n => [`${NEW_AGENT}${n}`, t('UI_SIM_NEW_AGENT', { n })] as [string, string])]
  const payNow = [
    t('UI_SIM_PAY_NOW_ITEM', { who: t('UI_SIM_OWNER'), amount: formatMoney(input.settings.PROJ_OWNER_SALARY_AMT || '0'), month: '' }).trim(),
    ...agents.map(agent => {
      const rate = input.agentRates
        .filter(r => r.AdminUserID === agent.id && r.Deleted !== '1' && r.EffectiveMonth && r.EffectiveMonth.slice(0, 7) <= baseMonth.slice(0, 7))
        .sort((a, b) => a.EffectiveMonth.localeCompare(b.EffectiveMonth)).pop()
      return t('UI_SIM_PAY_NOW_ITEM', { who: agent.name, amount: formatMoney(rate?.FixedMonthly || '0'), month: rate ? t('UI_SIM_FROM_MONTH', { month: formatMonth(rate.EffectiveMonth) }) : '' }).trim()
    }),
  ].join(' · ')

  const saveSnapshot = () => {
    if (!base || !simulated) return
    const form: SimForm = { monthsAhead, feeType, fee, interestPct, monthlyLossPct, avgLoan, termMonths, items, presets }
    const name = snapshotName.trim()
    startSaving(async () => {
      const state = await saveSimSnapshot({
        name,
        notes: snapshotNotes,
        baseMonth,
        inputs: JSON.stringify({ v: 1, form, whatIf, agents }),
        result: JSON.stringify({ v: 1, baseMonth, base: base.rows, simulated: simulated.rows }),
      })
      setSaved(state)
      setSavedName(name)
      // Saved: the fields clear, so the same snapshot isn't saved twice by mistake
      if (state.ok) {
        setSnapshotName('')
        setSnapshotNotes('')
      }
    })
  }

  return (
    <>
      <section className="mb-8 grid gap-5 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2 text-base text-body">
          {t('UI_SIM_MONTHS')}
          <input className={INPUT} inputMode="numeric" value={monthsAhead} onChange={event => /^\d{0,2}$/.test(event.target.value) && setMonthsAhead(event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-base text-body">
          {t('UI_SIM_FEE_TYPE')}
          <select className={INPUT} value={feeType} onChange={event => { setFeeType(event.target.value === 'AMT' ? 'AMT' : 'PCT'); setFee('') }}>
            <option value="PCT">{t('UI_SIM_FEE_TYPE_PCT')}</option>
            <option value="AMT">{t('UI_SIM_FEE_TYPE_AMT')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-base text-body">
          {t(feeType === 'AMT' ? 'UI_SIM_FEE_VALUE_AMT' : 'UI_SIM_FEE_VALUE_PCT')}
          <input className={INPUT} inputMode="decimal" value={fee} onChange={event => PATTERN[feeType === 'AMT' ? 'money' : 'pct'].test(event.target.value) && setFee(event.target.value)} />
        </label>
        {feeType === 'AMT' && (
          <label className="flex flex-col gap-2 text-base text-body">
            {t('UI_SIM_AVG_LOAN')}
            <input
              className={INPUT}
              inputMode="decimal"
              value={avgLoanDraft}
              onChange={event => PATTERN.money.test(event.target.value) && setAvgLoanDraft(event.target.value)}
              onBlur={() => setAvgLoan(avgLoanDraft)}
              onKeyDown={event => event.key === 'Enter' && setAvgLoan(avgLoanDraft)}
            />
          </label>
        )}
        <label className="flex flex-col gap-2 text-base text-body">
          {t('UI_SIM_AVG_TERM')}
          <input
            className={INPUT}
            inputMode="decimal"
            value={termDraft}
            onChange={event => PATTERN.term.test(event.target.value) && setTermDraft(event.target.value)}
            onBlur={() => setTermMonths(termDraft)}
            onKeyDown={event => event.key === 'Enter' && setTermMonths(termDraft)}
          />
        </label>
        <label className="flex flex-col gap-2 text-base text-body">
          {t('UI_SIM_INTEREST_PCT')}
          <input
            className={INPUT}
            inputMode="decimal"
            value={interestPct}
            placeholder={trimNumber(base.assumptions.interestPct)}
            onChange={event => PATTERN.pct.test(event.target.value) && setInterestPct(event.target.value)}
          />
          <span className="text-sm text-muted">
            {t('UI_SIM_INTEREST_HINT', {
              pct: `${trimNumber(base.assumptions.interestPct)}%`,
              source: base.assumptions.interestSource === 'setting' ? 'UI_PROJ_FROM_SETTING' : base.assumptions.interestSource === 'loans' ? 'UI_PROJ_FROM_LOANS' : 'UI_PROJ_FROM_HISTORY',
            })}
          </span>
        </label>
        <label className="flex flex-col gap-2 text-base text-body">
          {t('UI_SIM_MONTHLY_LOSS_PCT')}
          <input className={INPUT} inputMode="decimal" value={monthlyLossPct} onChange={event => PATTERN.pct.test(event.target.value) && setMonthlyLossPct(event.target.value)} />
          <span className="text-sm text-muted">{t('UI_SIM_MONTHLY_LOSS_HINT')}</span>
        </label>
        {stats && (
          <p className="text-sm text-muted sm:col-span-2 xl:col-span-4">
            {t('UI_SIM_LOAN_STATS', { count: stats.loans, from: formatMonth(stats.from), to: formatMonth(stats.to), avg: formatMoney(stats.avgLoan), months: stats.termMonths })}
          </p>
        )}
        <div className="flex items-end">
          <button type="button" onClick={() => { setItems(EMPTY); setFee('') }} className="rounded-xl border border-line px-5 py-3 text-base font-medium text-body hover:border-accent">
            {t('UI_CLEAR')}
          </button>
        </div>
      </section>

      <div className="mb-8 grid gap-5 xl:grid-cols-2">
        {SECTIONS.map(section => (
          <section key={section.key} className="rounded-2xl border border-line bg-surface p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{t(section.title)}</h2>
              <button type="button" onClick={() => add(section.key, section.fields)} className="text-base font-medium text-accent-strong hover:underline">
                {t('UI_ADD')}
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">{t(section.hint, { now: formatMoney(input.settings.EMERGENCY_MONTHLY_AMT || '0') })}</p>
            {section.key === 'pay' && <p className="mb-4 text-sm text-body">{t('UI_SIM_PAY_NOW', { list: payNow })}</p>}
            {section.key === 'risks' && (
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex min-w-28 flex-1 flex-col gap-1 text-sm text-body">
                    {t('UI_SIM_PRESET')}
                    <select className={INPUT} value={presetKey} onChange={event => setPresetKey(event.target.value)}>
                      {presets.map(p => <option key={p.key} value={p.key}>{t(p.label)}</option>)}
                    </select>
                  </label>
                  <label className="flex min-w-28 flex-1 flex-col gap-1 text-sm text-body">
                    {t('UI_MONTH')}
                    <select className={INPUT} value={presetMonth || months[0]} onChange={event => setPresetMonth(event.target.value)}>
                      {months.map(month => <option key={month} value={month}>{formatMonth(`${month}-01`)}</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={addPreset} className="rounded-xl border border-line px-5 py-3 text-base font-medium text-body hover:border-accent">
                    {t('UI_SIM_ADD_PRESET')}
                  </button>
                </div>
                <details className="rounded-xl border border-line px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-accent-strong">{t('UI_SIM_EDIT_PRESETS')}</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-muted">
                          <th className="py-2 pr-3 font-medium">{t('UI_SIM_PRESET')}</th>
                          {PRESET_FIELDS.map(field => <th key={field.name} className="px-2 py-2 font-medium">{t(field.label)}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {presets.map(p => (
                          <tr key={p.key} className="border-t border-line">
                            <td className="py-2 pr-3 text-body">{t(p.label)}</td>
                            {PRESET_FIELDS.map(field => (
                              <td key={field.name} className="px-2 py-2">
                                <input
                                  className={`${INPUT} min-w-20`}
                                  inputMode="decimal"
                                  aria-label={t(field.label)}
                                  value={p[field.name]}
                                  onChange={event => changePreset(p.key, field.name, event.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm text-muted">{t('UI_SIM_PRESETS_NOTE')}</p>
                  <button type="button" onClick={() => setPresets(PRESETS)} className="mt-2 text-sm font-medium text-accent-strong hover:underline">
                    {t('UI_SIM_RESET_PRESETS')}
                  </button>
                </details>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {items[section.key].map((item, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
                  {section.fields.map(field => (
                    <label key={field.name} className="flex min-w-28 flex-1 flex-col gap-1 text-sm text-body">
                      {t(field.label)}
                      {field.kind === 'who' ? (
                        <select className={INPUT} value={item[field.name]} onChange={event => change(section.key, index, field, event.target.value)}>
                          {who.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      ) : field.kind === 'month' ? (
                        <select className={INPUT} value={item[field.name]} onChange={event => change(section.key, index, field, event.target.value)}>
                          {months.map(month => <option key={month} value={month}>{formatMonth(`${month}-01`)}</option>)}
                        </select>
                      ) : (
                        <input
                          className={INPUT}
                          inputMode={field.kind === 'count' ? 'numeric' : 'decimal'}
                          value={item[field.name]}
                          onChange={event => change(section.key, index, field, event.target.value)}
                        />
                      )}
                    </label>
                  ))}
                  <button type="button" onClick={() => remove(section.key, index)} className="py-3 text-base font-medium text-bad hover:underline">
                    {t('UI_SIM_REMOVE')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <SimResult base={base.rows} simulated={simulated.rows} />

      {canSave && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold text-ink">{t('UI_SIM_SAVE_SNAPSHOT')}</h2>
          <p className="mb-4 text-sm text-muted">{t('UI_SIM_SAVE_SNAPSHOT_HINT')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm text-body">
              {t('UI_SIM_SNAPSHOT_NAME')}
              <input className={INPUT} maxLength={100} value={snapshotName} onChange={event => setSnapshotName(event.target.value)} />
            </label>
            <label className="flex min-w-60 flex-[2] flex-col gap-1 text-sm text-body">
              {t('UI_SIM_SNAPSHOT_NOTES')}
              <input className={INPUT} maxLength={500} value={snapshotNotes} onChange={event => setSnapshotNotes(event.target.value)} />
            </label>
            <button
              type="button"
              disabled={saving || snapshotName.trim() === ''}
              onClick={saveSnapshot}
              className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {t(saving ? 'UI_SAVING' : 'UI_SAVE')}
            </button>
          </div>
          {saved?.ok && (
            <p role="status" className="mt-4 rounded-xl bg-accent-soft px-5 py-3.5 text-base text-accent-strong">
              ✓ {t('UI_SIM_SNAPSHOT_SAVED', { name: savedName })}{' '}
              <Link href={saved.id ? `/business/simulation/snapshots/${saved.id}` : '/business/simulation/snapshots'} className="font-medium text-accent-strong hover:underline">
                {t('UI_SIM_VIEW_SNAPSHOT')}
              </Link>
            </p>
          )}
          {saved && !saved.ok && <p className="mt-3 text-base text-bad">{saved.error}</p>}
        </section>
      )}
    </>
  )
}
