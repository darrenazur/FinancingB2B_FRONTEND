'use client'

import { KeyboardEvent, useEffect, useRef, useState } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const PANEL_WIDTH = 320
const PANEL_HEIGHT = 400
const GAP = 8
const FIRST_YEAR = 1900
const SELECT = 'rounded-lg border border-[var(--border)] bg-surface px-2 py-1.5 text-sm font-medium text-ink'
const ARROW = 'flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-elevated disabled:opacity-30'

// Dates stay YYYY-MM-DD text, the format the API takes, so no time zone can move the day.
const pad = (value: number) => String(value).padStart(2, '0')
const toValue = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
const firstWeekday = (year: number, month: number) => new Date(Date.UTC(year, month, 1)).getUTCDay()
const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

function display(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`
}

interface DatePickerProps {
  name: string
  value: string
  onChange: (value: string) => void
  max?: string
  required?: boolean
}

export default function DatePicker({ name, value, onChange, max, required }: DatePickerProps) {
  const today = manilaToday()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [view, setView] = useState({ year: 0, month: 0 })
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    // The panel is fixed to the screen, so it can't follow the form when the form scrolls.
    const closeOnScroll = () => setOpen(false)

    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open])

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }

    const box = buttonRef.current?.getBoundingClientRect()
    if (box) {
      const fitsBelow = box.bottom + GAP + PANEL_HEIGHT <= window.innerHeight
      setPosition({
        top: fitsBelow ? box.bottom + GAP : Math.max(GAP, box.top - GAP - PANEL_HEIGHT),
        left: Math.max(GAP, Math.min(box.left, window.innerWidth - PANEL_WIDTH - GAP)),
      })
    }

    const start = value || (max && max < today ? max : today)
    const [year, month] = start.split('-').map(Number)
    setView({ year, month: month - 1 })
    setOpen(true)
  }

  // Esc closes the calendar here, not the whole form behind it.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      buttonRef.current?.focus()
    }
  }

  const maxYear = Number((max ?? `${Number(today.slice(0, 4)) + 10}`).slice(0, 4))
  const years = Array.from({ length: maxYear - FIRST_YEAR + 1 }, (_, index) => maxYear - index)
  const isAllowed = (date: string) => !max || date <= max
  const lastOfView = toValue(view.year, view.month, daysIn(view.year, view.month))

  const move = (step: number) => {
    setView(current => {
      const months = current.year * 12 + current.month + step
      return { year: Math.floor(months / 12), month: months % 12 }
    })
  }

  const pick = (date: string) => {
    onChange(date)
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      {/* Hidden from view, but carries the value into the form and lets the browser ask for a required date. */}
      <input
        name={name}
        value={value}
        required={required}
        onChange={() => undefined}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute bottom-0 left-4 h-px w-px opacity-0"
      />

      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={[
          'flex w-full items-center justify-between rounded-xl border bg-surface px-4 py-3 text-left text-base font-normal outline-none disabled:bg-elevated disabled:text-muted',
          open ? 'border-accent' : 'border-[var(--border)]',
          value ? 'text-ink' : 'text-muted',
        ].join(' ')}
      >
        {value ? display(value) : 'Select date'}
        <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      {open && (
        // Stops a click on empty space from reaching the label around this field, which would press the button.
        <div
          role="dialog"
          aria-label="Choose a date"
          onClick={event => event.preventDefault()}
          style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
          className="fixed z-50 rounded-2xl border border-line bg-surface p-4 font-normal shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={view.year <= FIRST_YEAR && view.month === 0}
              aria-label="Previous month"
              className={ARROW}
            >
              ‹
            </button>
            <div className="flex gap-2">
              <select
                aria-label="Month"
                value={view.month}
                onChange={event => setView(current => ({ ...current, month: Number(event.target.value) }))}
                className={SELECT}
              >
                {MONTHS.map((month, index) => <option key={month} value={index}>{month.slice(0, 3)}</option>)}
              </select>
              <select
                aria-label="Year"
                value={view.year}
                onChange={event => setView(current => ({ ...current, year: Number(event.target.value) }))}
                className={SELECT}
              >
                {years.map(year => <option key={year}>{year}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={Boolean(max) && lastOfView >= (max as string)}
              aria-label="Next month"
              className={ARROW}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(day => <span key={day} className="py-1 text-xs font-medium text-muted">{day}</span>)}
            {Array.from({ length: firstWeekday(view.year, view.month) }, (_, index) => <span key={index} />)}
            {Array.from({ length: daysIn(view.year, view.month) }, (_, index) => {
              const day = index + 1
              const date = toValue(view.year, view.month, day)
              const selected = date === value
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!isAllowed(date)}
                  onClick={() => pick(date)}
                  aria-label={display(date)}
                  aria-pressed={selected}
                  className={[
                    'h-10 rounded-lg text-sm tabular-nums disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40',
                    selected ? 'bg-accent font-semibold text-white' : 'text-ink hover:bg-elevated',
                    date === today && !selected ? 'font-semibold text-accent-strong' : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-medium">
            {isAllowed(today) ? (
              <button type="button" onClick={() => pick(today)} className="text-accent-strong hover:underline">Today</button>
            ) : <span />}
            {!required && value && (
              <button type="button" onClick={() => pick('')} className="text-body hover:underline">Clear</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
