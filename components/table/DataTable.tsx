'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { t } from '../../lib/captions/t'

const BATCH_SIZE = 50
const COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
// The checked row's actions sit in the toolbar. Its row buttons grow to toolbar size here;
// buttons inside their dialogs are deeper in the tree and keep their own look.
const SELECTED_ACTIONS = [
  'flex flex-wrap items-center gap-3',
  '[&>div]:flex [&>div]:flex-wrap [&>div]:gap-3',
  '[&>a]:rounded-xl [&>a]:px-4 [&>a]:py-2 [&>a]:text-sm',
  '[&>button]:rounded-xl [&>button]:px-4 [&>button]:py-2 [&>button]:text-sm',
  '[&>div>a]:rounded-xl [&>div>a]:px-4 [&>div>a]:py-2 [&>div>a]:text-sm',
  '[&>div>button]:rounded-xl [&>div>button]:px-4 [&>div>button]:py-2 [&>div>button]:text-sm',
].join(' ')
// Page toolbar buttons (Add, Refresh, Process overdue…) shrink to the same compact size.
const TOOLBAR = '[&>button]:px-4 [&>button]:py-2 [&>button]:text-sm [&>button>svg]:h-4 [&>button>svg]:w-4'
const FILTER_INPUT = 'w-full min-w-24 rounded-lg border border-[var(--border)] bg-surface px-2.5 py-1.5 text-sm font-normal text-ink'

// Each page keeps its table's view for this browser tab, so coming back from a record lands where the person left.
const VIEW_PREFIX = 'table-view:'
// Column order is kept per page in this browser, even after it closes. Only keys, never row data.
const ORDER_PREFIX = 'table-columns:'
function readOrder(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}
function writeOrder(key: string, order: string[] | null) {
  try {
    if (order) localStorage.setItem(key, JSON.stringify(order))
    else localStorage.removeItem(key)
  } catch {
    // Storage blocked: the default order shows next time.
  }
}
// Saved keys first; a column the save doesn't know (new, or shown by a permission) goes after its default neighbour.
function applyOrder<Row>(columns: Column<Row>[], order: string[] | null): Column<Row>[] {
  if (!order) return columns
  const byKey = new Map(columns.map(column => [column.key, column]))
  const result = order.flatMap(key => byKey.get(key) ?? [])
  columns.forEach((column, index) => {
    if (result.includes(column)) return
    result.splice(index === 0 ? 0 : result.indexOf(columns[index - 1]) + 1, 0, column)
  })
  return result
}
interface SavedView {
  search: string
  filters: Record<string, string>
  sort: Sort | null
  visible: number
  selectedKey: number | null
  scrollTop: number
}
function readView(key: string): SavedView | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as SavedView) : null
  } catch {
    return null
  }
}
function writeView(key: string, view: SavedView) {
  try {
    sessionStorage.setItem(key, JSON.stringify(view))
  } catch {
    // Storage blocked or full: the table simply starts fresh next time.
  }
}

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
  defaultSort?: Sort
}

export interface Sort {
  key: string
  direction: 'asc' | 'desc'
}

// All rows are already in the browser, so search, filters and sort cover every row. Scrolling only adds more to the page.
export default function DataTable<Row>({
  rows, columns: defaultColumns, rowKey, rowActions, toolbar, searchLabel, emptyText, minWidth, defaultSort,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<Sort | null>(defaultSort ?? null)
  const [visible, setVisible] = useState(BATCH_SIZE)
  // One row at a time. Only a row still shown counts, so an action never hits a row that is filtered out.
  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLTableRowElement>(null)
  const pathname = usePathname()
  const storageKey = VIEW_PREFIX + pathname
  const [restored, setRestored] = useState(false)
  const pendingScroll = useRef<number | null>(null)
  const orderKey = ORDER_PREFIX + pathname
  const [order, setOrder] = useState<string[] | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const columns = useMemo(() => applyOrder(defaultColumns, order), [defaultColumns, order])

  // Restored after hydration so the server HTML still matches; layout effect so the top never flashes.
  /* eslint-disable react-hooks/set-state-in-effect -- browser storage can't be read during the server render */
  useLayoutEffect(() => {
    const saved = readView(storageKey)
    if (saved) {
      setSearch(saved.search)
      setFilters(saved.filters)
      setSort(saved.sort)
      setVisible(Math.max(BATCH_SIZE, saved.visible))
      setSelectedKey(saved.selectedKey)
      pendingScroll.current = saved.scrollTop
    }
    setOrder(readOrder(orderKey))
    setRestored(true)
  }, [storageKey, orderKey])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll only once the restored rows are drawn, or the position would be cut short.
  useLayoutEffect(() => {
    if (!restored || pendingScroll.current === null || !scrollRef.current) return
    scrollRef.current.scrollTop = pendingScroll.current
    pendingScroll.current = null
  })

  const saveView = (scrollTop: number) => {
    if (restored) writeView(storageKey, { search, filters, sort, visible, selectedKey, scrollTop })
  }
  useEffect(() => {
    saveView(scrollRef.current?.scrollTop ?? 0)
  }, [restored, storageKey, search, filters, sort, visible, selectedKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const selected = selectedKey === null ? null : matches.find(row => rowKey(row) === selectedKey) ?? null
  const actions = selected && rowActions ? rowActions(selected) : null
  const toggleRow = (key: number) => setSelectedKey(current => (current === key ? null : key))
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

  const moveColumn = (from: string, to: string) => {
    if (from === to) return
    const keys = columns.map(column => column.key)
    keys.splice(keys.indexOf(to), 0, ...keys.splice(keys.indexOf(from), 1))
    setOrder(keys)
    writeOrder(orderKey, keys)
  }

  const resetColumns = () => {
    setOrder(null)
    writeOrder(orderKey, null)
  }

  const selectOptions = (column: Column<Row>) => [...new Set(rows.map(column.text))].sort(COLLATOR.compare)
  const columnCount = columns.length + (rowActions ? 1 : 0)

  return (
    <>
      <div className={`mb-5 flex flex-wrap items-center gap-3 ${TOOLBAR}`}>
        {toolbar}
        {actions && <div className={SELECTED_ACTIONS}>{actions}</div>}
        <div className="flex w-full items-center gap-4 sm:ml-auto sm:w-auto">
          {order && (
            <button onClick={resetColumns} className="whitespace-nowrap text-sm font-medium text-accent-strong hover:underline">
              {t('UI_RESET_COLUMNS')}
            </button>
          )}
          {hasCriteria && (
            <button onClick={clearCriteria} className="whitespace-nowrap text-sm font-medium text-accent-strong hover:underline">
              {t('UI_CLEAR_FILTERS')}
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
            className="w-full rounded-xl border border-[var(--border)] bg-surface px-3.5 py-2 text-sm text-ink sm:w-72"
          />
        </div>
      </div>

      <div ref={scrollRef} onScroll={event => saveView(event.currentTarget.scrollTop)} className="max-h-[calc(100vh-20rem)] min-h-80 overflow-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]">
            <tr className="text-sm text-muted">
              {rowActions && <th className="w-12 px-5 pb-2 pt-4"><span className="sr-only">{t('UI_SELECT')}</span></th>}
              {columns.map(column => {
                const sorted = sort?.key === column.key ? sort.direction : null
                return (
                  <th
                    key={column.key}
                    draggable
                    title={t('UI_DRAG_TO_MOVE')}
                    onDragStart={event => {
                      setDragKey(column.key)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={event => {
                      if (!dragKey) return
                      event.preventDefault()
                      setOverKey(column.key)
                    }}
                    onDrop={event => {
                      event.preventDefault()
                      if (dragKey) moveColumn(dragKey, column.key)
                    }}
                    onDragEnd={() => {
                      setDragKey(null)
                      setOverKey(null)
                    }}
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                    className={[
                      'cursor-grab px-5 pb-2 pt-4 font-medium',
                      column.align === 'right' ? 'text-right' : '',
                      dragKey === column.key ? 'opacity-40' : '',
                      overKey === column.key && dragKey !== column.key ? 'shadow-[inset_3px_0_0_var(--color-accent)]' : '',
                    ].join(' ')}
                  >
                    <button onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 hover:text-ink">
                      {t(column.label)}
                      <span aria-hidden="true" className={sorted ? 'text-accent-strong' : 'opacity-40'}>
                        {sorted === 'desc' ? '↓' : sorted === 'asc' ? '↑' : '↕'}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
            <tr>
              {rowActions && <th />}
              {columns.map(column => (
                <th key={column.key} className="px-5 pb-3 font-normal">
                  {column.filter === 'select' ? (
                    <select
                      value={filters[column.key] ?? ''}
                      onChange={event => setFilter(column.key, event.target.value)}
                      aria-label={t('UI_FILTER_BY', { label: column.label })}
                      className={FILTER_INPUT}
                    >
                      <option value="">{t('UI_ALL')}</option>
                      {selectOptions(column).map(option => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      value={filters[column.key] ?? ''}
                      onChange={event => setFilter(column.key, event.target.value)}
                      placeholder={t('UI_FILTER')}
                      aria-label={t('UI_FILTER_BY', { label: column.label })}
                      className={FILTER_INPUT}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-base">
            {shown.map(row => (
              <tr
                key={rowKey(row)}
                onClick={event => {
                  if (!rowActions || (event.target as HTMLElement).closest('a, button, input, select, textarea')) return
                  toggleRow(rowKey(row))
                }}
                className={rowActions ? `cursor-pointer ${selectedKey === rowKey(row) ? 'bg-elevated' : 'hover:bg-elevated/50'}` : ''}
              >
                {rowActions && (
                  <td className="w-12 px-5 py-5">
                    <input
                      type="checkbox"
                      checked={selectedKey === rowKey(row)}
                      onChange={() => toggleRow(rowKey(row))}
                      aria-label={t('UI_SELECT')}
                      className="h-5 w-5 align-middle"
                    />
                  </td>
                )}
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
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-5 py-10 text-center text-muted">
                  {rows.length === 0 ? emptyText : t('UI_NO_MATCHES')}
                </td>
              </tr>
            )}
            {hasMore && (
              <tr ref={sentinelRef}>
                <td colSpan={columnCount} className="px-5 py-4 text-center text-sm text-muted">{t('UI_LOADING_MORE')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {t('UI_SHOWING')}{' '}{shown.length}{' '}{t('UI_OF_2')}{' '}{matches.length}
        {matches.length === rows.length ? '' : t('UI_MATCHES_TOTAL', { count: rows.length })}
      </p>
    </>
  )
}
