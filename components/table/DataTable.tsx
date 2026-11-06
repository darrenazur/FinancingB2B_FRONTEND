'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

const BATCH_SIZE = 50
const COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const FILTER_INPUT = 'w-full min-w-24 rounded-lg border border-[var(--border)] bg-surface px-2.5 py-1.5 text-sm font-normal text-ink'

export interface Column<Row> {
  key: string
  label: string
  // The text a person sees. Search, filters and the default sort all read it.
  text: (row: Row) => string
  render?: (row: Row) => ReactNode
  compare?: (a: Row, b: Row) => number
  filter?: 'text' | 'select'
  align?: 'right'
}

interface DataTableProps<Row> {
  rows: Row[]
  columns: Column<Row>[]
  rowKey: (row: Row) => number
  rowActions?: (row: Row) => ReactNode
  toolbar: ReactNode
  searchLabel: string
  emptyText: string
  minWidth: string
}

interface Sort {
  key: string
  direction: 'asc' | 'desc'
}

// All rows are already in the browser, so search, filters and sort cover every row. Scrolling only adds more to the page.
export default function DataTable<Row>({
  rows, columns, rowKey, rowActions, toolbar, searchLabel, emptyText, minWidth,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<Sort | null>(null)
  const [visible, setVisible] = useState(BATCH_SIZE)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLTableRowElement>(null)

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const found = rows.filter(row => {
      if (needle && !columns.some(column => column.text(row).toLowerCase().includes(needle))) return false
      return columns.every(column => {
        const wanted = (filters[column.key] ?? '').trim().toLowerCase()
        if (!wanted) return true
        const value = column.text(row).toLowerCase()
        return column.filter === 'select' ? value === wanted : value.includes(wanted)
      })
    })

    const column = sort && columns.find(item => item.key === sort.key)
    if (!sort || !column) return found
    const compare = column.compare ?? ((a: Row, b: Row) => COLLATOR.compare(column.text(a), column.text(b)))
    const direction = sort.direction === 'asc' ? 1 : -1
    return [...found].sort((a, b) => compare(a, b) * direction)
  }, [rows, columns, search, filters, sort])

  const shown = matches.slice(0, visible)
  const hasMore = shown.length < matches.length
  const hasCriteria = search.trim() !== '' || Object.values(filters).some(value => value.trim() !== '')

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisible(count => count + BATCH_SIZE)
      },
      { root: scrollRef.current, rootMargin: '300px' },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, visible])

  const backToTop = () => {
    setVisible(BATCH_SIZE)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const toggleSort = (key: string) => {
    setSort(current => {
      if (current?.key !== key) return { key, direction: 'asc' }
      return current.direction === 'asc' ? { key, direction: 'desc' } : null
    })
    backToTop()
  }

  const setFilter = (key: string, value: string) => {
    setFilters(current => ({ ...current, [key]: value }))
    backToTop()
  }

  const clearCriteria = () => {
    setSearch('')
    setFilters({})
    backToTop()
  }

  const selectOptions = (column: Column<Row>) => [...new Set(rows.map(column.text))].sort(COLLATOR.compare)
  const columnCount = columns.length + (rowActions ? 1 : 0)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {toolbar}
        <div className="flex w-full items-center gap-4 sm:ml-auto sm:w-auto">
          {hasCriteria && (
            <button onClick={clearCriteria} className="whitespace-nowrap text-base font-medium text-accent-strong hover:underline">
              Clear filters
            </button>
          )}
          <input
            type="search"
            value={search}
            onChange={event => {
              setSearch(event.target.value)
              backToTop()
            }}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="w-full rounded-xl border border-[var(--border)] bg-surface px-4 py-3 text-base text-ink sm:w-80"
          />
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[calc(100vh-20rem)] min-h-80 overflow-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]">
            <tr className="text-sm text-muted">
              {columns.map(column => {
                const sorted = sort?.key === column.key ? sort.direction : null
                return (
                  <th
                    key={column.key}
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                    className={`px-5 pb-2 pt-4 font-medium ${column.align === 'right' ? 'text-right' : ''}`}
                  >
                    <button onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 hover:text-ink">
                      {column.label}
                      <span aria-hidden="true" className={sorted ? 'text-accent-strong' : 'opacity-40'}>
                        {sorted === 'desc' ? '↓' : sorted === 'asc' ? '↑' : '↕'}
                      </span>
                    </button>
                  </th>
                )
              })}
              {rowActions && <th className="px-5 pb-2 pt-4 font-medium"><span className="sr-only">Actions</span></th>}
            </tr>
            <tr>
              {columns.map(column => (
                <th key={column.key} className="px-5 pb-3 font-normal">
                  {column.filter === 'select' ? (
                    <select
                      value={filters[column.key] ?? ''}
                      onChange={event => setFilter(column.key, event.target.value)}
                      aria-label={`Filter by ${column.label}`}
                      className={FILTER_INPUT}
                    >
                      <option value="">All</option>
                      {selectOptions(column).map(option => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      value={filters[column.key] ?? ''}
                      onChange={event => setFilter(column.key, event.target.value)}
                      placeholder="Filter"
                      aria-label={`Filter by ${column.label}`}
                      className={FILTER_INPUT}
                    />
                  )}
                </th>
              ))}
              {rowActions && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base">
            {shown.map(row => (
              <tr key={rowKey(row)}>
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={[
                      'px-5 py-5',
                      column.align === 'right' ? 'text-right tabular-nums' : '',
                      index === 0 ? 'font-medium text-ink' : 'text-body',
                    ].join(' ')}
                  >
                    {column.render ? column.render(row) : column.text(row)}
                  </td>
                ))}
                {rowActions && <td className="px-5 py-5 text-right">{rowActions(row)}</td>}
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-5 py-10 text-center text-muted">
                  {rows.length === 0 ? emptyText : 'No matches.'}
                </td>
              </tr>
            )}
            {hasMore && (
              <tr ref={sentinelRef}>
                <td colSpan={columnCount} className="px-5 py-4 text-center text-sm text-muted">Loading more…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        Showing {shown.length} of {matches.length}
        {matches.length === rows.length ? '' : ` matches, ${rows.length} total`}
      </p>
    </>
  )
}
