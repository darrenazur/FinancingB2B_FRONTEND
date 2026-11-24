// A simulation snapshot: what was entered on Business > Simulation and the months worked out that day.
// Saved as two JSON texts (InputsJson, ResultJson); v says which shape, so an older snapshot can still be read.
import type { WhatIf } from './projection'

type Row = Record<string, string>

// The simulator's kinds of what-if and their fields, in order. Here (not in the form) so a saved snapshot's page can list them too.
export type Kind = 'month' | 'who' | 'money' | 'pct' | 'count'
export interface Field { name: string; label: string; kind: Kind; initial?: string }
export type SectionKey = 'pay' | 'cash' | 'funds' | 'emergency' | 'cbf' | 'bank' | 'risks'

const MONTH: Field = { name: 'month', label: 'UI_MONTH', kind: 'month' }
const AMOUNT: Field = { name: 'amount', label: 'UI_AMOUNT', kind: 'money' }
const RATE: Field = { name: 'ratePct', label: 'UI_SIM_RATE_PCT', kind: 'pct' }

// Each kind of what-if, with its fields in order
export const SECTIONS: { key: SectionKey; title: string; hint: string; fields: Field[] }[] = [
  {
    key: 'pay', title: 'UI_SIM_PAY', hint: 'UI_SIM_PAY_HINT',
    fields: [{ name: 'who', label: 'UI_SIM_WHO', kind: 'who', initial: 'OWNER' }, { name: 'month', label: 'UI_SIM_EFFECTIVE', kind: 'month' },
      { name: 'fixed', label: 'UI_SIM_PAY_FIXED', kind: 'money' }, { name: 'commissionPct', label: 'UI_SIM_COMMISSION_PCT', kind: 'pct' }],
  },
  { key: 'cash', title: 'UI_SIM_CASH', hint: 'UI_SIM_CASH_HINT', fields: [MONTH, AMOUNT] },
  { key: 'funds', title: 'UI_SIM_FUNDS', hint: 'UI_SIM_FUNDS_HINT', fields: [MONTH, AMOUNT] },
  { key: 'emergency', title: 'UI_SIM_EMERGENCY', hint: 'UI_SIM_EMERGENCY_HINT', fields: [{ name: 'month', label: 'UI_SIM_EFFECTIVE', kind: 'month' }, { name: 'amount', label: 'UI_SIM_AMOUNT_A_MONTH', kind: 'money' }] },
  { key: 'cbf', title: 'UI_SIM_CBF', hint: 'UI_SIM_CBF_HINT', fields: [MONTH, AMOUNT, RATE, { name: 'months', label: 'UI_SIM_TERM_MONTHS', kind: 'count', initial: '6' }] },
  {
    key: 'bank', title: 'UI_SIM_BANK', hint: 'UI_SIM_BANK_HINT',
    fields: [MONTH, AMOUNT, RATE, { name: 'months', label: 'UI_SIM_TERM_MONTHS', kind: 'count', initial: '12' }, { name: 'fees', label: 'UI_SIM_BANK_FEES', kind: 'money' },
      { name: 'reserve', label: 'UI_SIM_BANK_RESERVE', kind: 'money' }],
  },
  {
    key: 'risks', title: 'UI_SIM_RISK', hint: 'UI_SIM_RISK_HINT',
    fields: [MONTH, { name: 'dropPct', label: 'UI_SIM_DROP_PCT', kind: 'pct' }, { name: 'lossPct', label: 'UI_SIM_LOSS_PCT', kind: 'pct' }],
  },
]

// A bad-month preset as it was on the page
export interface Preset { key: string; label: string; dropPct: string; lossPct: string; nextDropPct: string }

// The simulator's fields, enough to load the snapshot back into it
export interface SimForm {
  monthsAhead: string
  feeType: 'PCT' | 'AMT'
  fee: string
  interestPct: string
  // Added later: an older snapshot has none
  monthlyLossPct?: string
  avgLoan: string
  termMonths: string
  items: Record<string, Row[]>
  presets: Preset[]
}

// agents: the staff names at the time, so a pay change still reads by name
export interface SnapshotInputs { v: 1; form: SimForm; whatIf: WhatIf; agents?: { id: string; name: string }[] }
export interface SnapshotResult { v: 1; baseMonth: string; base: Row[]; simulated: Row[] }

export interface Snapshot {
  id: string
  name: string
  notes: string
  baseMonth: string
  savedAt: string
  savedBy: string
  inputs: SnapshotInputs | null
  result: SnapshotResult | null
}

function readJson<T extends { v: number }>(text: string | undefined): T | null {
  try {
    const value = JSON.parse(text ?? '')
    return value && typeof value === 'object' && value.v === 1 ? value as T : null
  } catch {
    return null
  }
}

export function parseSnapshot(row: Row): Snapshot {
  return {
    id: row.BizSimSnapshotID ?? '',
    name: row.Name ?? '',
    notes: row.Notes ?? '',
    baseMonth: row.BaseMonth ?? '',
    savedAt: row.SavedAt ?? '',
    savedBy: row.SavedBy ?? '',
    inputs: readJson<SnapshotInputs>(row.InputsJson),
    result: readJson<SnapshotResult>(row.ResultJson),
  }
}
