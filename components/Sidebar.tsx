'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '../app/login/actions'
import type { CurrentUser } from '../lib/api/session'
import { can } from '../lib/permissions'
import ThemeSwitch, { type Theme } from './ThemeSwitch'
import { t } from '../lib/captions/t'

const NAV = [
  { href: '/dashboard', label: 'UI_OVERVIEW', icon: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z' },
  { href: '/partners', label: 'UI_PARTNERS', permissions: ['partner.view'], icon: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.2a3.25 3.25 0 0 1 0 6.1' },
  { href: '/loans', label: 'UI_LOANS', permissions: ['loan.view'], icon: 'M4 7h16v11H4V7Zm0 4h16M8 15h3' },
  { href: '/business', label: 'UI_BUSINESS', permissions: ['business.view'], icon: 'M4 8h16v11H4V8Zm5 0V5h6v3M4 13h16' },
  { href: '/config', label: 'UI_CONFIGURATION_2', permissions: ['config.view', 'user.manage', 'role.manage', 'lock.release'], icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4' },
]

interface SidebarProps {
  user: CurrentUser | null
  theme: Theme
  open: boolean
  onClose: () => void
}

export default function Sidebar({ user, theme, open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={onClose} />}

      <aside
        className={[
          'fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-line bg-surface transition-transform duration-200',
          'lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 px-7 pb-8 pt-9">
          <div className="flex h-10 w-20 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">AZUR</div>
          <span className="text-xl font-semibold tracking-tight text-ink">{t('UI_BANKINGMS')}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-4 pb-4">
          {NAV.filter(item => !item.permissions || item.permissions.some(code => can(user?.permissions ?? [], code))).map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={[
                  item.href === '/config' ? 'mt-auto' : '',
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium transition-colors',
                  active ? 'bg-accent-soft text-accent-strong' : 'text-body hover:bg-elevated hover:text-ink',
                ].join(' ')}
              >
                <svg className="h-[22px] w-[22px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                {t(item.label)}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line px-7 pt-5">
          <ThemeSwitch initial={theme} />
        </div>
        <div className="flex items-center justify-between gap-3 px-7 py-5">
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-ink">{user?.name}</p>
            <p className="text-sm text-muted">{user?.roleName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-accent-strong hover:underline">{t('UI_LOG_OUT')}</button>
            </form>
            <Link href="/account/password" onClick={onClose} className="text-sm text-muted hover:underline">{t('UI_PASSWORD')}</Link>
          </div>
        </div>
      </aside>
    </>
  )
}
