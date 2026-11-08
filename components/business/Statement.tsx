import { formatMoney } from '../../lib/format'

// One line of a financial statement. The label is already the text to show.
export interface StatementLine {
  label: string
  value?: string
  // heading: a section name; total: a subtotal; grand: the bottom line
  kind?: 'line' | 'heading' | 'total' | 'grand'
}

const isZero = (value: string) => /^-?0*(\.0*)?$/.test(value)

// A statement as a card: a title, the month, and its lines with amounts on the right.
export default function Statement({ title, subtitle, lines }: { title: string; subtitle: string; lines: StatementLine[] }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mb-4 text-sm text-muted">{subtitle}</p>
      <dl className="text-base">
        {lines.map((line, index) => {
          const kind = line.kind ?? 'line'
          if (kind === 'heading') {
            return <dt key={index} className="mt-4 mb-1 text-sm font-semibold uppercase tracking-wide text-muted first:mt-0">{line.label}</dt>
          }
          const value = line.value ?? ''
          return (
            <div
              key={index}
              className={[
                'flex justify-between gap-6 py-1.5',
                kind === 'total' ? 'border-t border-line font-semibold text-ink' : '',
                kind === 'grand' ? 'mt-2 border-t-2 border-double border-line pt-2 text-lg font-semibold text-ink' : '',
                kind === 'line' ? 'text-body' : '',
              ].join(' ')}
            >
              <dt>{line.label}</dt>
              <dd className={`text-right tabular-nums ${value.startsWith('-') ? 'text-bad' : ''}`}>
                {value === '' ? '—' : isZero(value) ? formatMoney('0') : formatMoney(value)}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
