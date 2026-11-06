'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z' },
  { href: '/partners', label: 'Partners', icon: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.2a3.25 3.25 0 0 1 0 6.1' },
  { href: '/loans', label: 'Loans', icon: 'M4 7h16v11H4V7Zm0 4h16M8 15h3' },
  { href: '/config', label: 'Configuration', icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">B</div>
          <span className="text-xl font-semibold tracking-tight text-ink">BankingMS</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-4 pb-4">
          {NAV.map(item => {
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
                {item.label}
              </Link>
            )
          })}
        </nav>

        <p className="px-7 py-6 text-sm text-muted">Local preview. No login yet.</p>
      </aside>
    </>
  )
}
