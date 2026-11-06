'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '▦' },
  { 
    href: '/partners', 
    label: 'Partners', 
    icon: '👥'
  },
  { 
    href: '/financing-operations', 
    label: 'Financing Operations', 
    icon: '💰',
    subMenu: [
      { href: '/transactions', label: 'Financing Applications' },
      { href: '/settlement-plans', label: 'Settlement Plans' },
      { href: '/payments', label: 'Payments' }
    ]
  },
  { 
    href: '/reference-data', 
    label: 'Reference Data', 
    icon: '📚',
    subMenu: [
      { href: '/transactions', label: 'Tenure' },
      { href: '/settlement-plans', label: 'Currency' },
      { href: '/settlement-plans', label: 'Settlement Structure' },
      { href: '/settlement-plans', label: 'Term Type' },
      { href: '/settlement-plans', label: 'Tenure Type' },
    ]
  },
  { 
    href: '/master-data', 
    label: 'Master Data', 
    icon: '📂',
    subMenu: [
      { href: '/transactions', label: 'Country' },
      { href: '/settlement-plans', label: 'Province' },
      { href: '/settlement-plans', label: 'City' },
      { href: '/settlement-plans', label: 'Zip Code' },
      { href: '/settlement-plans', label: 'Payment Methods' },
    ]
  },
  { 
    href: '/transactions', 
    label: 'Transactions', 
    icon: '⇄',
    subMenu: [
      { href: '/transactions', label: 'Transactions' },
      { href: '/transactions/add-transactions', label: 'Add Transaction' },
    ]
  },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null)

  const toggleSubMenu = (href: string) => {
    setOpenSubMenu(openSubMenu === href ? null : href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 z-30 h-full flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 240, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5" style={{ height: 64, borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-center rounded-xl text-white font-bold text-sm" style={{ width: 34, height: 34, background: 'var(--blue-primary)', fontSize: 16 }}>₿</div>
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>NexusBank</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-muted)' }}>Main</p>
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const hasSubMenu = item.subMenu && item.subMenu.length > 0
            const isSubOpen = openSubMenu === item.href

            return (
              <div key={item.href} className="flex flex-col">
                {hasSubMenu ? (
                  <button
                    onClick={() => toggleSubMenu(item.href)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full text-left"
                    style={{
                      background: active ? 'var(--blue-glow)' : 'transparent',
                      color: active ? 'var(--blue-light)' : 'var(--text-secondary)',
                      border: active ? '1px solid var(--blue-dim)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                    <span className="ml-auto">{isSubOpen ? '▾' : '▸'}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full text-left"
                    style={{
                      background: active ? 'var(--blue-glow)' : 'transparent',
                      color: active ? 'var(--blue-light)' : 'var(--text-secondary)',
                      border: active ? '1px solid var(--blue-dim)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                )}

                {/* Sub-menu */}
                {hasSubMenu && isSubOpen && (
                  <div className="flex flex-col pl-8 mt-1">
                    {item.subMenu!.map(sub => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                        style={{
                          background: pathname === sub.href ? 'var(--blue-glow)' : 'transparent',
                          color: pathname === sub.href ? 'var(--blue-light)' : 'var(--text-secondary)',
                        }}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="mt-auto pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-muted)' }}>System</p>
            {BOTTOM_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ width: 36, height: 36, background: 'var(--blue-dim)', color: 'var(--blue-light)', border: '1.5px solid var(--blue-primary)' }}>DA</div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Darren Admin</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>admin@nexusbank.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}