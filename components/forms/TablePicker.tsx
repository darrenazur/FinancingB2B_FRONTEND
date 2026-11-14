'use client'

import { useMemo, useState } from 'react'
import type { BizOption } from '../../lib/api/business'
import { t } from '../../lib/captions/t'
import { INPUT } from './FormDialog'

const COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
type Sort = { column: number; direction: 1 | -1 } | null

interface TablePickerProps {
  name: string
  value: string
  required?: boolean
  headers: string[]
  options: BizOption[]
  onChange: (value: string) => void
}

// A select that opens a table: search, sort by any column, click a row to pick it.
// Opens inside the form (not floating), so a dialog never cuts it off.
export default function TablePicker({ name, value, required, headers, options, onChange }: TablePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>(null)
  const picked = options.find(option => option.value === value)

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const found = needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : options
    if (!sort) return found
    const key = (option: BizOption) => option.cells?.[sort.column]
    return [...found].sort((a, b) => {
      const x = key(a)
      const y = key(b)
      const order = x?.sort !== undefined && y?.sort !== undefined ? x.sort - y.sort : COLLATOR.compare(x?.text ?? '', y?.text ?? '')
      return order * sort.direction
    })
  }, [options, search, sort])

  const toggleSort = (column: number) =>
    setSort(current => current?.column !== column ? { column, direction: 1 } : current.direction === 1 ? { column, direction: -1 } : null)

  const pick = (option: BizOption) => {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div className="relative flex flex-col gap-2">
      {/* Carries the value and the browser's "required" check; the button below is what people use */}
      <input
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
      />
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        className={`${INPUT} flex items-center justify-between gap-3 text-left`}
      >
        <span className={`truncate ${picked ? '' : 'text-muted'}`}>{picked?.label ?? t('UI_SELECT')}</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            autoFocus
            placeholder={t('UI_SEARCH_LOANS')}
            aria-label={t('UI_SEARCH_LOANS')}
            className={INPUT}
          />
          <div className="max-h-80 overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="sticky top-0 bg-surface shadow-[0_1px_0_var(--border)]">
                <tr className="text-muted">
                  {headers.map((header, column) => {
                    const sorted = sort?.column === column ? sort.direction : null
                    return (
                      <th key={header} aria-sort={sorted === 1 ? 'ascending' : sorted === -1 ? 'descending' : 'none'} className="px-3 py-2 font-medium">
                        <button type="button" onClick={() => toggleSort(column)} className="inline-flex items-center gap-1 hover:text-ink">
                          {header}
                          <span aria-hidden="true" className={sorted ? 'text-accent-strong' : 'opacity-40'}>
                            {sorted === -1 ? '↓' : sorted === 1 ? '↑' : '↕'}
                          </span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(option => (
                  <tr
                    key={option.value}
                    onClick={() => pick(option)}
                    aria-selected={option.value === value}
                    className={`cursor-pointer ${option.value === value ? 'bg-elevated' : 'hover:bg-elevated/50'}`}
                  >
                    {(option.cells ?? [{ text: option.label }]).map((item, column) => (
                      <td
                        key={column}
                        className={[
                          'px-3 py-2',
                          item.sort !== undefined ? 'text-right tabular-nums' : '',
                          option.warn && column === 3 ? 'font-semibold text-bad' : 'text-body',
                        ].join(' ')}
                      >
                        {option.warn && column === 3 ? `⚠ ${item.text}` : item.text}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="px-3 py-6 text-center text-muted">{t('UI_NO_MATCHES')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
