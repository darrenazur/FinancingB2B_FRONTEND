'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { CurrentUser } from '../../lib/api/session'
import Sidebar from '../Sidebar'
import type { Theme } from '../ThemeSwitch'
import Topbar from '../Topbar'

interface DashboardShellProps {
  user: CurrentUser | null
  theme: Theme
  children: React.ReactNode
}

export default function DashboardShell({ user, theme, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // The login page has no sidebar.
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} theme={theme} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-page px-4 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
