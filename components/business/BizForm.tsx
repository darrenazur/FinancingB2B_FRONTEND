'use client'

import { useState } from 'react'
import { saveBizRecord } from '../../app/business/actions'
import type { BizOption, BizRow } from '../../lib/api/business'
import { BizField, BizResource, BizSource } from '../../lib/business/resources'
import { manilaToday } from '../../lib/format'
import DatePicker from '../forms/DatePicker'
import FormDialog, { decimalOnly, digitsOnly, Field, INPUT } from '../forms/FormDialog'
import { trimNumber } from './display'
import { t } from '../../lib/captions/t'

interface BizFormProps {
  resource: BizResource
  row: BizRow | null
  title: string
  options: Partial<Record<BizSource, BizOption[]>>
  onClose: () => void
}

const CLEAN: Partial<Record<BizField['type'], (value: string) => string>> = {
  money: decimalOnly(2),
  rate: decimalOnly(5),
  int: digitsOnly,
}

function startValue(field: BizField, row: BizRow | null, today: string): string {
  const saved = row?.values[field.name] ?? ''
  if (row) {
    if (field.type === 'month') return saved.slice(0, 7)
    if (field.type === 'money' || field.type === 'rate') return saved ? trimNumber(saved) : ''
    return saved
  }
  if (field.type === 'date') return today
  if (field.type === 'inout' || field.type === 'capitalType') return 'IN'
  return ''
}

export default function BizForm({ resource, row, title, options, onClose }: BizFormProps) {
  const today = manilaToday()
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(resource.fields.map(field => [field.name, startValue(field, row, today)])))
  const set = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }))

  // Salary fields show only for the categories that need them.
  const categoryCode = options.category?.find(option => option.value === values.ExpenseCategoryID)?.code ?? ''
  const shown = resource.fields.filter(field => !field.onlyForCategory || field.onlyForCategory.includes(categoryCode))

  const input = (field: BizField) => {
    const value = values[field.name] ?? ''
    const common = { name: field.name, value, required: field.required }

    switch (field.type) {
      case 'money':
      case 'rate':
      case 'int':
        return (
          <input
            {...common}
            inputMode={field.type === 'int' ? 'numeric' : 'decimal'}
            onChange={event => set(field.name, (CLEAN[field.type] ?? (text => text))(event.target.value))}
            className={INPUT}
          />
        )
      case 'date':
      case 'futureDate':
        return (
          <DatePicker
            name={field.name}
            value={value}
            onChange={date => set(field.name, date)}
            max={field.type === 'date' ? today : undefined}
            required={field.required}
          />
        )
      case 'month':
        return <input {...common} type="month" onChange={event => set(field.name, event.target.value)} className={INPUT} />
      case 'longtext':
        return <textarea {...common} rows={3} maxLength={500} onChange={event => set(field.name, event.target.value)} className={INPUT} />
      case 'inout':
        return (
          <select {...common} onChange={event => set(field.name, event.target.value)} className={INPUT}>
            <option value="IN">{t('UI_IN')}</option>
            <option value="OUT">{t('UI_OUT')}</option>
          </select>
        )
      case 'capitalType':
        return (
          <select {...common} onChange={event => set(field.name, event.target.value)} className={INPUT}>
            <option value="IN">{t('UI_IN')}</option>
            <option value="OUT">{t('UI_OUT')}</option>
            <option value="RET">{t('UI_OPENING_PROFIT')}</option>
          </select>
        )
      case 'checkbox':
        return (
          <input
            type="checkbox"
            name={field.name}
            checked={value === '1'}
            onChange={event => set(field.name, event.target.checked ? '1' : '0')}
            className="h-5 w-5 self-start"
          />
        )
      case 'select': {
        const fixed = Boolean(row && field.fixedOnEdit)
        return (
          <>
            <select {...common} disabled={fixed} onChange={event => set(field.name, event.target.value)} className={INPUT}>
              <option value="">{t('UI_SELECT')}</option>
              {(field.source ? options[field.source] ?? [] : []).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {/* A disabled select is not sent with the form. */}
            {fixed && <input type="hidden" name={field.name} value={value} />}
          </>
        )
      }
      default:
        return <input {...common} maxLength={field.name === 'BankName' || field.name === 'ReferenceNo' ? 100 : 500} onChange={event => set(field.name, event.target.value)} className={INPUT} />
    }
  }

  return (
    <FormDialog title={`${title} · ${t(resource.label)}`} action={saveBizRecord.bind(null, resource.key, row?.id ?? null)} onClose={onClose}>
      {shown.map(field => (
        <Field key={field.name} label={t(field.label)} hint={field.hint ? t(field.hint) : undefined}>
          {input(field)}
        </Field>
      ))}
    </FormDialog>
  )
}
