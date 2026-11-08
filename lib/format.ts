// Money stays exact: DB values are DECIMAL(18,5) text, handled as BigInt, never as a float.
const SCALE = 5
const ZERO = BigInt(0)
const CENT_DIVISOR = BigInt(1000)
const HALF_CENT = BigInt(500)
const HUNDRED = BigInt(100)

function toScaled(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,5}))?$/.exec(value.trim())
  if (!match) throw new Error('Invalid money value')
  const scaled = BigInt(match[2] + (match[3] ?? '').padEnd(SCALE, '0'))
  return match[1] ? -scaled : scaled
}

export function compareMoney(a: string, b: string): number {
  const difference = toScaled(a) - toScaled(b)
  return difference < ZERO ? -1 : difference > ZERO ? 1 : 0
}

export function sumMoney(values: string[]): bigint {
  return values.reduce((total, value) => total + toScaled(value), ZERO)
}

// Plain amount for a form field: no commas or currency, two decimals as the API takes.
export function toAmount(value: bigint): string {
  const cents = (value + HALF_CENT) / CENT_DIVISOR
  return `${cents / HUNDRED}.${(cents % HUNDRED).toString().padStart(2, '0')}`
}

export function formatMoney(value: string | bigint, currency = 'PHP'): string {
  const scaled = typeof value === 'bigint' ? value : toScaled(value)
  const negative = scaled < ZERO
  const cents = ((negative ? -scaled : scaled) + HALF_CENT) / CENT_DIVISOR
  const whole = (cents / HUNDRED).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fraction = (cents % HUNDRED).toString().padStart(2, '0')
  const symbol = currency === 'PHP' ? '₱' : `${currency} `
  return `${negative ? '-' : ''}${symbol}${whole}.${fraction}`
}

// The driver returns stored dates as UTC, so UTC here shows the same calendar day the DB holds.
export const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

// Dates are YYYY-MM-DD text, so this stays clear of the browser's time zone.
export function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00Z`)
  moved.setUTCDate(moved.getUTCDate() + days)
  return moved.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export function formatToday(): string {
  return new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}
