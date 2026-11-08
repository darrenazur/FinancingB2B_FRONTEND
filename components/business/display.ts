import { BizColumnKind } from '../../lib/business/resources'
import { formatDate, formatMoney } from '../../lib/format'
import { t } from '../../lib/captions/t'

// 95.00000 shows as 95, 0.68000 as 0.68.
export function trimNumber(value: string): string {
  return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value
}

export function formatMonth(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', timeZone: 'UTC' })
}

// The text a person sees in a list cell. Search and filters read it too.
export function displayValue(kind: BizColumnKind, value: string): string {
  if (kind === 'paidOff') return value === '1' ? t('UI_PAID_OFF') : t('UI_OPEN')
  if (kind === 'opening') return value === '1' ? t('UI_OPENING_BALANCE') : ''
  // A loan backing a contract: behind on payments or not
  if (kind === 'risk') return value === '1' ? t('UI_OVERDUE') : t('UI_ON_TIME')
  if (!value) return ''
  // A CBF contract: ACTIVE, MATURED (past maturity, not paid out) or PAID
  if (kind === 'cbfStatus') return t(`UI_CBF_STATUS_${value}`)
  switch (kind) {
    case 'money': return formatMoney(value)
    case 'date': return formatDate(value)
    case 'month': return formatMonth(value)
    case 'percent': return `${trimNumber(value)}%`
    case 'number': return trimNumber(value)
    case 'inout': return value === 'IN' ? t('UI_IN') : t('UI_OUT')
    case 'capitalType': return value === 'RET' ? t('UI_OPENING_PROFIT') : value === 'IN' ? t('UI_IN') : t('UI_OUT')
    default: return value
  }
}
