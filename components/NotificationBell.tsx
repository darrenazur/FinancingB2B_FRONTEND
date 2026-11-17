'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { loadNotifications } from '../app/notifications/actions'
import type { Notice } from '../lib/api/business'
import { t } from '../lib/captions/t'
import { formatDate, formatMoney, manilaToday } from '../lib/format'

// "Hide until tomorrow" lives in this browser only. A hidden notice comes back the next day, or at once if it grows.
const HIDE_KEY = 'notice-hidden'
type Hidden = Record<string, { day: string; size: number }>

function readHidden(): Hidden {
  try {
    return JSON.parse(localStorage.getItem(HIDE_KEY) ?? '{}') as Hidden
  } catch {
    return {}
  }
}
function writeHidden(value: Hidden) {
  try {
    localStorage.setItem(HIDE_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked: hiding lasts until the page reloads.
  }
}

interface Alert {
  key: string
  title: string
  amount: string
  detail: string
  href: string
  // How big the problem is now; a hidden notice shows again when this grows
  size: number
}

const money = (value: string) => formatMoney(value || '0')

function alertsFrom(notices: Notice[]): Alert[] {
  const by = new Map(notices.map(notice => [notice.code, notice]))
  const list: Alert[] = []
  const due = by.get('DUE_TODAY')
  if (due && due.items > 0) {
    list.push({ key: 'DUE_TODAY', title: t('UI_NOTICE_TITLE_DUE_TODAY'), amount: money(due.amount), detail: t('UI_NOTICE_DUE_TODAY', { count: due.items }), href: '/loans', size: due.items })
  }
  const overdue = by.get('OVERDUE')
  if (overdue && overdue.items > 0) {
    list.push({ key: 'OVERDUE', title: t('UI_NOTICE_TITLE_OVERDUE'), amount: money(overdue.amount), detail: t('UI_NOTICE_OVERDUE', { count: overdue.items, days: Number(overdue.compare) || 0 }), href: '/dashboard', size: overdue.items })
  }
  const maturing = by.get('CBF_MATURING')
  if (maturing && maturing.items > 0) {
    list.push({ key: 'CBF_MATURING', title: t('UI_NOTICE_TITLE_CBF_MATURING'), amount: money(maturing.amount), detail: t('UI_NOTICE_CBF_MATURING', { count: maturing.items, date: formatDate(maturing.refDate) }), href: '/business/cbf', size: maturing.items })
  }
  const past = by.get('CBF_PAST_MATURITY')
  if (past && past.items > 0) {
    list.push({ key: 'CBF_PAST_MATURITY', title: t('UI_NOTICE_TITLE_CBF_PAST'), amount: money(past.amount), detail: t('UI_NOTICE_CBF_PAST', { count: past.items, date: formatDate(past.refDate) }), href: '/business/cbf-payout', size: past.items })
  }
  const pending = by.get('PARTNER_PENDING')
  if (pending && pending.items > 0) {
    list.push({ key: 'PARTNER_PENDING', title: t('UI_NOTICE_TITLE_PARTNERS'), amount: '', detail: t('UI_NOTICE_PARTNERS_PENDING', { count: pending.items }), href: '/partners', size: pending.items })
  }
  const cash = by.get('CASH_COUNT')
  if (cash && cash.refDate) {
    const date = formatDate(cash.refDate)
    if (cash.items > 0) {
      list.push({ key: 'CASH_COUNT_DAYS', title: t('UI_NOTICE_TITLE_CASH_COUNT'), amount: '', detail: t('UI_NOTICE_NO_COUNT_TODAY', { date, days: cash.items }), href: '/business/cash-count', size: cash.items })
    }
    const gap = Number(cash.amount) || 0
    if (gap !== 0) {
      list.push({
        key: 'CASH_COUNT_GAP',
        title: t('UI_NOTICE_TITLE_CASH_COUNT'),
        amount: money(String(Math.abs(gap))),
        detail: t(gap < 0 ? 'UI_NOTICE_COUNT_SHORT' : 'UI_NOTICE_COUNT_OVER', { date }),
        href: '/business/cash-count',
        size: Math.round(Math.abs(gap) * 100),
      })
    }
  }
  return list
}

// ▲ 27% / ▼ 12% against the period before; nothing when the period before had nothing
function change(amount: string, compare: string): string {
  const now = Number(amount) || 0
  const before = Number(compare) || 0
  if (before === 0) return ''
  const pct = Math.round(((now - before) / before) * 100)
  return pct > 0 ? `▲ ${pct}%` : pct < 0 ? `▼ ${-pct}%` : '0%'
}

export interface NoticeState {
  alerts: Alert[]
  shown: Alert[]
  notices: Notice[]
  hide: (alert: Alert) => void
  showHidden: () => void
}

// Loaded again on every page change, so counts are never old. Shared by the sidebar bell and the phone bell.
export function useNotices(enabled: boolean): NoticeState {
  const pathname = usePathname()
  const [notices, setNotices] = useState<Notice[]>([])
  const [hidden, setHidden] = useState<Hidden>({})

  useEffect(() => {
    if (!enabled) return
    let live = true
    loadNotifications().then(list => {
      if (!live) return
      setNotices(list)
      setHidden(readHidden())
    })
    return () => { live = false }
  }, [enabled, pathname])

  const today = manilaToday()
  const alerts = alertsFrom(notices)
  const shown = alerts.filter(alert => {
    const mark = hidden[alert.key]
    return !(mark && mark.day === today && alert.size <= mark.size)
  })

  const hide = (alert: Alert) => {
    const next = { ...hidden, [alert.key]: { day: today, size: alert.size } }
    setHidden(next)
    writeHidden(next)
  }
  const showHidden = () => {
    setHidden({})
    writeHidden({})
  }

  return { alerts, shown, notices, hide, showHidden }
}

// The bell and its panel: a dropdown on large screens, the whole screen on phones
export default function NotificationBell({ state, panelClass }: { state: NoticeState; panelClass: string }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const { alerts, shown, notices, hide, showHidden } = state
  const hiddenCount = alerts.length - shown.length
  const summary = (code: string) => notices.find(notice => notice.code === code)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const onClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const periods = [
    { label: 'UI_THIS_WEEK', collected: summary('WEEK_COLLECTED'), released: summary('WEEK_RELEASED'), versus: 'UI_VS_LAST_WEEK' },
    { label: 'UI_THIS_MONTH', collected: summary('MONTH_COLLECTED'), released: summary('MONTH_RELEASED'), versus: 'UI_VS_LAST_MONTH' },
  ]

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-label={t('UI_NOTIFICATIONS')}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-body hover:bg-elevated"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {shown.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-xs font-semibold text-white">
            {shown.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('UI_NOTIFICATIONS')}
          className={`fixed inset-0 z-50 flex flex-col gap-5 overflow-y-auto bg-surface p-5 text-left lg:absolute lg:inset-auto lg:max-h-[75vh] lg:w-[28rem] lg:rounded-2xl lg:border lg:border-line lg:shadow-xl ${panelClass}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{t('UI_NOTIFICATIONS')}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('UI_CLOSE')} className="flex h-10 w-10 items-center justify-center rounded-xl text-body hover:bg-elevated">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('UI_NEEDS_ATTENTION')}</h3>
            {shown.length === 0 && <p className="text-base text-muted">{t('UI_ALL_CLEAR')}</p>}
            {shown.map(alert => (
              <div key={alert.key} className="flex flex-col gap-2 rounded-xl border border-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-base font-semibold text-ink">{alert.title}</p>
                  {alert.amount && <p className="text-base font-semibold tabular-nums text-ink">{alert.amount}</p>}
                </div>
                <p className="text-sm text-body">{alert.detail}</p>
                <div className="flex items-center justify-between gap-3">
                  <Link href={alert.href} onClick={() => setOpen(false)} className="text-sm font-medium text-accent-strong hover:underline">
                    {t('UI_OPEN')} →
                  </Link>
                  <button type="button" onClick={() => hide(alert)} className="text-sm text-muted hover:text-ink hover:underline">
                    {t('UI_HIDE_UNTIL_TOMORROW')}
                  </button>
                </div>
              </div>
            ))}
            {hiddenCount > 0 && (
              <button type="button" onClick={showHidden} className="self-start text-sm font-medium text-accent-strong hover:underline">
                {t('UI_SHOW_HIDDEN', { count: hiddenCount })}
              </button>
            )}
          </section>

          {notices.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('UI_SUMMARY')}</h3>
              {periods.map(period => (
                <div key={period.label} className="flex flex-col gap-1 rounded-xl bg-page px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{t(period.label)}</p>
                  {period.collected && (
                    <p className="text-sm text-body">
                      {t('UI_COLLECTED')}{' '}<span className="font-semibold tabular-nums text-ink">{money(period.collected.amount)}</span>
                      {change(period.collected.amount, period.collected.compare) && (
                        <span className="text-muted">{' · '}{t(period.versus, { change: change(period.collected.amount, period.collected.compare), amount: money(period.collected.compare) })}</span>
                      )}
                    </p>
                  )}
                  {period.released && (
                    <p className="text-sm text-body">
                      {t('UI_RELEASED')}{' '}<span className="font-semibold tabular-nums text-ink">{money(period.released.amount)}</span>
                      {change(period.released.amount, period.released.compare) && (
                        <span className="text-muted">{' · '}{t(period.versus, { change: change(period.released.amount, period.released.compare), amount: money(period.released.compare) })}</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
