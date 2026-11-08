'use client'

import { useState } from 'react'
import { t } from '../lib/captions/t'

export type Theme = 'light' | 'dark' | 'system'

const CHOICES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'UI_THEME_LIGHT' },
  { value: 'dark', label: 'UI_THEME_DARK' },
  { value: 'system', label: 'UI_THEME_SYSTEM' },
]
const ONE_YEAR = 60 * 60 * 24 * 365

// Colors the page now and keeps the choice in this browser: a cookie the layout reads, so the next page
// draws in the right colors from the start. The device setting is no cookie at all.
function applyTheme(next: Theme) {
  const root = document.documentElement
  if (next === 'system') {
    delete root.dataset.theme
    document.cookie = 'theme=; path=/; max-age=0; samesite=lax'
  } else {
    root.dataset.theme = next
    document.cookie = 'theme=' + next + '; path=/; max-age=' + ONE_YEAR + '; samesite=lax'
  }
}

// Light, dark, or the device setting.
export default function ThemeSwitch({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial)

  function choose(next: Theme) {
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div role="radiogroup" aria-label={t('UI_THEME')} className="flex rounded-xl border border-line bg-elevated p-1">
      {CHOICES.map(choice => (
        <button
          key={choice.value}
          type="button"
          role="radio"
          aria-checked={theme === choice.value}
          onClick={() => choose(choice.value)}
          className={[
            'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            theme === choice.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          ].join(' ')}
        >
          {t(choice.label)}
        </button>
      ))}
    </div>
  )
}
