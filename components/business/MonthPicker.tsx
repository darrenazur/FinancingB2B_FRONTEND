'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { INPUT } from '../forms/FormDialog'
import { formatMonth } from './display'
import { t } from '../../lib/captions/t'

// Chooses the month to show. The month goes in the address as ?month=YYYY-MM.
export default function MonthPicker({ months, value }: { months: string[]; value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  return (
    <label className="flex items-center gap-3 text-base text-body">
      {t('UI_MONTH')}
      <select
        value={value}
        disabled={pending}
        onChange={event => startTransition(() => router.push(`${pathname}?month=${event.target.value}`))}
        className={`${INPUT} w-auto`}
      >
        {months.map(month => <option key={month} value={month.slice(0, 7)}>{formatMonth(month)}</option>)}
      </select>
    </label>
  )
}
