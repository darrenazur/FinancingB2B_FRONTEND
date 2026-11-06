import TransactionRow, { Transaction } from '../../components/transaction/TransactionRow'

const ALL_TX: Transaction[] = [
  { id:'1',  name:'Payroll Deposit',        category:'Deposit',    date:'Apr 1, 2026',  amount:  8200.00, status:'completed' },
  { id:'2',  name:'AWS Cloud Services',     category:'Payment',    date:'Apr 2, 2026',  amount:  -430.50, status:'completed' },
  { id:'3',  name:'Wire Transfer — BDO',    category:'Transfer',   date:'Apr 3, 2026',  amount: -2500.00, status:'pending'   },
  { id:'4',  name:'Dividend — AAPL',        category:'Investment', date:'Apr 3, 2026',  amount:   312.40, status:'completed' },
  { id:'5',  name:'Maintenance Fee',        category:'Fee',        date:'Apr 4, 2026',  amount:   -25.00, status:'completed' },
  { id:'6',  name:'Client Payment — Acme',  category:'Deposit',    date:'Apr 4, 2026',  amount:  4800.00, status:'completed' },
  { id:'7',  name:'Office Supplies',        category:'Payment',    date:'Mar 30, 2026', amount:  -182.00, status:'completed' },
  { id:'8',  name:'Savings Transfer',       category:'Transfer',   date:'Mar 29, 2026', amount: -1000.00, status:'completed' },
  { id:'9',  name:'Google Workspace',       category:'Payment',    date:'Mar 28, 2026', amount:   -72.00, status:'completed' },
  { id:'10', name:'Interest Income',        category:'Deposit',    date:'Mar 28, 2026', amount:   210.80, status:'completed' },
  { id:'11', name:'International Wire',     category:'Transfer',   date:'Mar 27, 2026', amount: -5000.00, status:'failed'    },
  { id:'12', name:'Dividend — MSFT',        category:'Investment', date:'Mar 26, 2026', amount:   188.60, status:'completed' },
]

export default function TransactionsPage() {
  const totalIn  = ALL_TX.filter(t=>t.amount>0).reduce((a,t)=>a+t.amount,0)
  const totalOut = ALL_TX.filter(t=>t.amount<0).reduce((a,t)=>a+t.amount,0)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Total In',  value:`+$${totalIn.toLocaleString('en-US',{minimumFractionDigits:2})}`,  color:'var(--green)' },
          { label:'Total Out', value:`-$${Math.abs(totalOut).toLocaleString('en-US',{minimumFractionDigits:2})}`, color:'var(--red)' },
          { label:'Net',       value:`$${(totalIn+totalOut).toLocaleString('en-US',{minimumFractionDigits:2})}`,  color:'var(--blue-light)' },
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-1"
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border-subtle)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>
            All Transactions <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({ALL_TX.length})</span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {['All','Deposits','Payments','Transfers'].map(f=>(
              <button key={f}
                className="rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  background: f==='All' ? 'var(--blue-glow)' : 'var(--bg-elevated)',
                  border: f==='All' ? '1px solid var(--blue-dim)' : '1px solid var(--border)',
                  color: f==='All' ? 'var(--blue-light)' : 'var(--text-secondary)',
                  fontFamily:'inherit',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {ALL_TX.map((tx,i)=>(
          <TransactionRow key={tx.id} tx={tx} last={i===ALL_TX.length-1}/>
        ))}
      </div>
    </div>
  )
}
