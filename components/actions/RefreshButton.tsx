'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

// The icon spins in place: the page stays readable while new data loads, so no dialog is needed.
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated disabled:text-muted"
    >
      <svg
        className={`h-5 w-5 ${pending ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
      </svg>
      Refresh
    </button>
  )
}
