import StatCard from '../../components/StatCard';
import TransactionRow, { Transaction } from '../../components/transaction/TransactionRow'
import '../globals.css';

const STATS = [
  { label: 'Total Balance',   value: '$248,391.50', delta: 8.2,  icon: '💰', accent: 'var(--blue-primary)' },
  { label: 'Monthly Income',  value: '$18,240.00',  delta: 12.5, icon: '↓',  accent: 'var(--green)'        },
  { label: 'Monthly Spend',   value: '$6,820.30',   delta: -3.1, icon: '↑',  accent: 'var(--red)'          },
  { label: 'Investments',     value: '$94,120.00',  delta: 5.4,  icon: '▲',  accent: 'var(--purple)'       },
]

const RECENT_TX: Transaction[] = [
  { id:'1', name:'Payroll Deposit',       category:'Deposit',    date:'Apr 1, 2026',  amount:  8200.00, status:'completed' },
  { id:'2', name:'AWS Cloud Services',    category:'Payment',    date:'Apr 2, 2026',  amount:  -430.50, status:'completed' },
  { id:'3', name:'Wire Transfer — BDO',   category:'Transfer',   date:'Apr 3, 2026',  amount: -2500.00, status:'pending'   },
  { id:'4', name:'Dividend — AAPL',       category:'Investment', date:'Apr 3, 2026',  amount:   312.40, status:'completed' },
  { id:'5', name:'Maintenance Fee',       category:'Fee',        date:'Apr 4, 2026',  amount:   -25.00, status:'completed' },
  { id:'6', name:'Client Payment — Acme', category:'Deposit',    date:'Apr 4, 2026',  amount:  4800.00, status:'completed' },
]

const ACCOUNTS = [
  { name: 'Primary Checking', number: '•••• 4821', balance: '$48,210.50', type: 'Checking', color: 'var(--blue-primary)' },
  { name: 'Savings Account',  number: '•••• 9034', balance: '$106,181.00', type: 'Savings', color: 'var(--purple)'      },
  { name: 'Investment Acc.',  number: '•••• 1157', balance: '$94,000.00',  type: 'Brokerage', color: 'var(--green)'     },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Accounts */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>My Accounts</h2>
            <a href="/accounts" className="text-xs font-medium" style={{ color: 'var(--blue-light)' }}>View all →</a>
          </div>
          <div className="flex flex-col gap-3">
            {ACCOUNTS.map(acc => (
              <div
                key={acc.name}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div
                  className="rounded-xl flex-shrink-0"
                  style={{ width: 10, height: 40, background: acc.color, borderRadius: 6 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{acc.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{acc.type} · {acc.number}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{acc.balance}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Spending breakdown */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Spending Breakdown</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Operations',  pct: 42, amount: '$2,862', color: 'var(--blue-primary)' },
              { label: 'Payroll',     pct: 28, amount: '$1,910', color: 'var(--purple)'       },
              { label: 'Software',    pct: 18, amount: '$1,228', color: 'var(--green)'         },
              { label: 'Other',       pct: 12, amount: '$820',   color: 'var(--amber)'         },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.amount}</span>
                </div>
                <div className="rounded-full h-1.5 w-full" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="rounded-full h-1.5"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.pct}% of total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Transfer',  icon: '⇄', color: 'var(--blue-primary)' },
              { label: 'Deposit',   icon: '↓', color: 'var(--green)'        },
              { label: 'Pay Bill',  icon: '◎', color: 'var(--amber)'        },
              { label: 'Invest',    icon: '▲', color: 'var(--purple)'       },
            ].map(a => (
              <button
                key={a.label}
                className="rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  className="flex items-center justify-center rounded-xl text-lg"
                  style={{ width: 40, height: 40, background: `${a.color}18`, color: a.color }}
                >
                  {a.icon}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Monthly summary */}
          <div
            className="rounded-xl p-4 mt-auto"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>April Summary</p>
            <div className="flex justify-between text-sm">
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Income</p>
                <p style={{ color: 'var(--green)', fontWeight: 700 }}>+$13,000</p>
              </div>
              <div className="text-right">
                <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Expenses</p>
                <p style={{ color: 'var(--red)', fontWeight: 700 }}>−$2,956</p>
              </div>
              <div className="text-right">
                <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Net</p>
                <p style={{ color: 'var(--blue-light)', fontWeight: 700 }}>+$10,044</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h2>
          <a href="/transactions" className="text-xs font-medium" style={{ color: 'var(--blue-light)' }}>View all →</a>
        </div>
        <div>
          {RECENT_TX.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} last={i === RECENT_TX.length - 1} />
          ))}
        </div>
      </div>

    </div>
  )
}
