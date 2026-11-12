'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CurrentUser } from '../../lib/api/session'
import Sidebar from '../Sidebar'
import type { Theme } from '../ThemeSwitch'
import Topbar from '../Topbar'

// The page scrolls inside <main>, not the window, so the browser can't restore it. Each page's spot is kept for this tab.
const PAGE_SCROLL_PREFIX = 'page-scroll:'
const RESTORE_FRAMES = 30 // about half a second for content that draws late

function readScroll(key: string): number | null {
  try {
    const value = sessionStorage.getItem(key)
    return value === null ? null : Number(value)
  } catch {
    return null
  }
}
function writeScroll(key: string, top: number) {
  try {
    sessionStorage.setItem(key, String(Math.round(top)))
  } catch {
    // Storage blocked: the page just opens at the top.
  }
}

interface DashboardShellProps {
  user: CurrentUser | null
  theme: Theme
  children: React.ReactNode
}

export default function DashboardShell({ user, theme, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)
  const backForward = useRef(false)
  const restoring = useRef(false)

  // Back and Forward return to where the person was; any other link opens the page at the top.
  useEffect(() => {
    const onPopState = () => { backForward.current = true }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return
    const target = backForward.current ? readScroll(PAGE_SCROLL_PREFIX + pathname) ?? 0 : 0
    backForward.current = false
    restoring.current = true
    let frames = 0
    let frame = 0
    // Retry a few frames: the spot may be lower than the page is tall until everything draws.
    const apply = () => {
      main.scrollTop = target
      frames += 1
      if (Math.abs(main.scrollTop - target) > 1 && frames < RESTORE_FRAMES) frame = requestAnimationFrame(apply)
      else restoring.current = false
    }
    apply()
    return () => {
      cancelAnimationFrame(frame)
      restoring.current = false
    }
  }, [pathname])

  const saveScroll = (event: React.UIEvent<HTMLElement>) => {
    if (!restoring.current) writeScroll(PAGE_SCROLL_PREFIX + pathname, event.currentTarget.scrollTop)
  }

  // The login page has no sidebar.
  if (pathname === '/login') return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} theme={theme} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main ref={mainRef} onScroll={saveScroll} className="flex-1 overflow-y-auto bg-page px-4 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
