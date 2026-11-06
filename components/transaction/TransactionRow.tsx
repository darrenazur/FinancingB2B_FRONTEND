export interface Transaction {
  id: string
  name: string
  category: string
  date: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
}

const STATUS_STYLES = {
  completed: { bg: '#14532d', color: '#4ade80', label: 'Completed' },
  pending:   { bg: '#451a03', color: '#fbbf24', label: 'Pending'   },
  failed:    { bg: '#450a0a', color: '#f87171', label: 'Failed'    },
}

const CATEGORY_ICONS: Record<string, string> = {
  Transfer:   '⇄',
  Deposit:    '↓',
  Withdrawal: '↑',
  Payment:    '◎',
  Investment: '▲',
  Fee:        '◆',
}

interface TransactionRowProps {
  tx: Transaction
  last?: boolean
}

export default function TransactionRow({ tx, last }: TransactionRowProps) {
  const s = STATUS_STYLES[tx.status]
  const icon = CATEGORY_ICONS[tx.category] ?? '◉'
  const positive = tx.amount > 0

  return (
    <div
      className="flex items-center gap-3 py-3 px-1"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0 text-sm font-bold"
        style={{
          width: 40, height: 40,
          background: 'var(--bg-elevated)',
          color: 'var(--blue-light)',
          border: '1px solid var(--border)',
        }}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tx.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tx.category} · {tx.date}</p>
      </div>

      {/* Status — hidden on mobile */}
      <span
        className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
        style={{ background: s.bg, color: s.color }}
      >
        {s.label}
      </span>

      {/* Amount */}
      <p
        className="text-sm font-bold flex-shrink-0 font-mono"
        style={{ color: positive ? 'var(--green)' : 'var(--red)' }}
      >
        {positive ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}
