'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/dashboard':    'Overview',
  // '/accounts':     'Accounts',
  // '/partners':     'Partners',
  '/transactions': 'Transactions',
  '/transactions/add-transaction': 'Add Transaction',
  // '/analytics':    'Analytics',
  // '/settings':     'Settings',
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const title = TITLES[pathname] ?? 'Dashboard'

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6"
      style={{
        height: 64,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex flex-col justify-center items-center gap-1.5 lg:hidden"
          style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Open menu"
        >
          <span className="block rounded" style={{ width: 20, height: 2, background: 'var(--text-secondary)' }} />
          <span className="block rounded" style={{ width: 14, height: 2, background: 'var(--text-secondary)' }} />
          <span className="block rounded" style={{ width: 20, height: 2, background: 'var(--text-secondary)' }} />
        </button>

        <div>
          <h1 className="font-bold text-base md:text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', minWidth: 200 }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded-xl transition-colors"
          style={{ width: 38, height: 38, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>🔔</span>
          <span
            className="absolute top-1.5 right-1.5 rounded-full"
            style={{ width: 7, height: 7, background: 'var(--blue-primary)', border: '1.5px solid var(--bg-surface)' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
          style={{ width: 36, height: 36, background: 'var(--blue-dim)', color: 'var(--blue-light)', border: '1.5px solid var(--blue-primary)', flexShrink: 0 }}
        >
          DA
        </div>
      </div>
    </header>
  )
}
