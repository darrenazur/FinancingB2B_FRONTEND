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
