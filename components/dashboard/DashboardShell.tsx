'use client'

import { useState } from 'react'
import Sidebar from '../Sidebar'
import Topbar from '../Topbar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-base)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
