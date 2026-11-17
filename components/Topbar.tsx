'use client'

import { t } from '../lib/captions/t'
import NotificationBell, { type NoticeState } from './NotificationBell'

interface TopbarProps {
  onMenuClick: () => void
  // The bell, for users with business.view; on phones its panel fills the screen
  notices?: NoticeState
}

// Mobile only: on large screens the sidebar is always visible and each page has its own header.
export default function Topbar({ onMenuClick, notices }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-body hover:bg-elevated"
        aria-label={t('UI_OPEN_MENU')}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <span className="text-lg font-semibold tracking-tight text-ink">{t('UI_BANKINGMS')}</span>
      {notices && (
        <div className="ml-auto">
          <NotificationBell state={notices} panelClass="" />
        </div>
      )}
    </header>
  )
}
