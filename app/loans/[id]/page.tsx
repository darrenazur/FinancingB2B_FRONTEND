import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ReactNode } from 'react'
import ConfirmAction from '../../../components/actions/ConfirmAction'
import RefreshButton from '../../../components/actions/RefreshButton'
import AddPaymentButton from '../../../components/loans/AddPaymentButton'
import { CLOSE_LOAN_MESSAGE } from '../../../components/loans/messages'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import StatusBadge from '../../../components/StatusBadge'
import AuditCell from '../../../components/table/AuditCell'
import { getInstallments, getLoan, getPaymentMethods, getPayments, getPenalties, Installment } from '../../../lib/api/financing'
import { getCurrentUser } from '../../../lib/api/session'
import { formatDate, formatMoney, sumMoney, toAmount } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { closeLoan, reversePayment, waivePenalty } from '../actions'

const TONE: Record<string, 'good' | 'neutral' | 'bad'> = {
  SETTLED: 'good',
  PAID: 'good',
  OVERDUE: 'bad',
  UNPAID: 'bad',
}
// Each table scrolls inside its own box, so a long payment list doesn't push the late fees far down the page.
const TABLE_HEAD = 'sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]'
const CLOSED_INSTALLMENTS = ['SETTLED', 'CANCELLED', 'WRITTEN OFF']
const HEADER_CELL = 'px-5 py-4 font-medium'
const CELL = 'px-5 py-5'
const MONEY_CELL = `${CELL} text-right tabular-nums`

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="max-h-96 overflow-auto rounded-2xl border border-line bg-surface">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-muted">{text}</p>
}

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{10}$/.test(id)) notFound()

  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'loan.view')) redirect('/dashboard')

  const loan = await getLoan(id)
  if (!loan) notFound()

  const [installments, payments, penalties, methods] = await Promise.all([
    getInstallments(loan.id),
    getPayments(loan.id),
    getPenalties(loan.id),
    getPaymentMethods(),
  ])

  const isOpen = !loan.closed && !loan.deleted
  const money = (value: string | bigint) => formatMoney(value, loan.currency)
  const owed = installments.filter(item => item.status !== 'CANCELLED')
  const paid = sumMoney(owed.map(item => item.paid))
  const balance = sumMoney(owed.flatMap(item => [item.principal, item.interest])) - paid
  const unpaidFees = penalties.filter(item => item.status === 'UNPAID')
  // Principal, interest and any late fee still unpaid on that installment.
  const totalDue = (item: Installment) => sumMoney([
    item.principal,
    item.interest,
    ...unpaidFees.filter(fee => fee.installmentNo === item.number).map(fee => fee.fee),
  ])
  // What the form fills in when "Pay total due" is checked: what is left on the oldest open installment.
  const nextDue = installments.find(item => !CLOSED_INSTALLMENTS.includes(item.status))
  const dueLeft = nextDue ? totalDue(nextDue) - sumMoney([nextDue.paid]) : BigInt(0)
  const due = nextDue && dueLeft > BigInt(0)
    ? { amount: toAmount(dueLeft), label: `${money(dueLeft)}, installment ${nextDue.number}` }
    : null
  const reversedIds = new Set(payments.map(item => item.reversalOf))
  const methodName = (methodId: number) => methods.find(item => item.id === methodId)?.label ?? `Method ${methodId}`
  const paymentNo = (paymentId: number) => payments.find(item => item.id === paymentId)?.paymentNo

  return (
    <>
      <Link href="/loans" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        ← Loans
      </Link>
      <PageHeader
        title={`Loan ${loan.loanNo}`}
        description={`${loan.partnerName}. ${loan.term}, ${loan.durationMonths} months at ${loan.monthlyRate}% a month, ${loan.settlementName}. Matures ${formatDate(loan.maturityDate)}.`}
      />

      <div className="mb-8 flex flex-wrap gap-3">
        {isOpen && can(permissions, 'payment.add') && <AddPaymentButton loanId={loan.id} loanNo={loan.loanNo} methods={methods} due={due} loanDate={loan.createdAt.slice(0, 10)} />}
        <RefreshButton />
        {isOpen && can(permissions, 'loan.close') && (
          <ConfirmAction
            label="Close"
            title={`Close loan ${loan.loanNo}?`}
            message={CLOSE_LOAN_MESSAGE}
            action={closeLoan.bind(null, loan.id)}
            lock={{ type: 'LOAN', id: loan.id }}
            triggerClass="rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated"
          />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Principal" value={money(loan.principal)} />
        <StatCard label="Interest" value={money(loan.interest)} />
        <StatCard label="Paid" value={money(paid)} hint="Principal and interest" />
        <StatCard
          label="Balance"
          value={money(balance)}
          hint={unpaidFees.length > 0 ? `Plus ${money(sumMoney(unpaidFees.map(item => item.fee)))} in late fees` : undefined}
        />
      </div>

      <Section title="Installments">
        {installments.length === 0 ? <Empty text="No installments." /> : (
          <table className="w-full min-w-[860px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>No.</th>
                <th className={HEADER_CELL}>Due</th>
                <th className={`${HEADER_CELL} text-right`}>Principal</th>
                <th className={`${HEADER_CELL} text-right`}>Interest</th>
                <th className={`${HEADER_CELL} text-right`}>Total due</th>
                <th className={`${HEADER_CELL} text-right`}>Paid</th>
                <th className={HEADER_CELL}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-body">
              {installments.map(item => (
                <tr key={item.id}>
                  <td className={`${CELL} font-medium text-ink`}>{item.number}</td>
                  <td className={`${CELL} whitespace-nowrap`}>{formatDate(item.dueDate)}</td>
                  <td className={MONEY_CELL}>{money(item.principal)}</td>
                  <td className={MONEY_CELL}>{money(item.interest)}</td>
                  <td className={`${MONEY_CELL} font-medium text-ink`}>{money(totalDue(item))}</td>
                  <td className={MONEY_CELL}>{money(item.paid)}</td>
                  <td className={CELL}><StatusBadge label={item.status} tone={TONE[item.status] ?? 'neutral'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Payments">
        {payments.length === 0 ? <Empty text="No payments yet." /> : (
          <table className="w-full min-w-[1240px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>Payment</th>
                <th className={HEADER_CELL}>Date</th>
                <th className={`${HEADER_CELL} text-right`}>Amount</th>
                <th className={HEADER_CELL}>Method</th>
                <th className={HEADER_CELL}>Reference</th>
                <th className={HEADER_CELL}>Created</th>
                <th className={HEADER_CELL}>Updated</th>
                <th className={HEADER_CELL}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-body">
              {payments.map(item => (
                <tr key={item.id}>
                  <td className={CELL}>
                    <p className="font-medium text-ink">Payment {item.paymentNo}</p>
                    {item.reversalOf && <p className="text-sm text-muted">Reversal of {paymentNo(item.reversalOf)}: {item.reversalReason}</p>}
                    {reversedIds.has(item.id) && <p className="text-sm text-muted">Reversed</p>}
                  </td>
                  <td className={`${CELL} whitespace-nowrap`}>{formatDate(item.date)}</td>
                  <td className={MONEY_CELL}>{money(item.amount)}</td>
                  <td className={CELL}>{methodName(item.methodId)}</td>
                  <td className={CELL}>
                    <p>{item.referenceNo}</p>
                    {item.hasProof && (
                      <a href={`/files/proof/${item.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-strong hover:underline">
                        View proof
                      </a>
                    )}
                  </td>
                  <td className={CELL}><AuditCell date={item.createdAt} by={item.createdBy} /></td>
                  <td className={CELL}><AuditCell date={item.updatedAt} by={item.updatedBy} /></td>
                  <td className={`${CELL} text-right`}>
                    {isOpen && can(permissions, 'payment.reverse') && !item.reversalOf && !reversedIds.has(item.id) && (
                      <ConfirmAction
                        label="Reverse"
                        title={`Reverse payment ${item.paymentNo}?`}
                        message="A negative payment is recorded and the amounts go back onto the installments. The original stays on file."
                        reasonLabel="Reason"
                        action={reversePayment.bind(null, loan.id, item.id)}
                        lock={{ type: 'LOAN', id: loan.id }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Late fees">
        {penalties.length === 0 ? <Empty text="No late fees." /> : (
          <table className="w-full min-w-[1060px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>Installment</th>
                <th className={`${HEADER_CELL} text-right`}>Fee</th>
                <th className={HEADER_CELL}>Status</th>
                <th className={HEADER_CELL}>Reason</th>
                <th className={HEADER_CELL}>Created</th>
                <th className={HEADER_CELL}>Updated</th>
                <th className={HEADER_CELL}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-body">
              {penalties.map(item => (
                <tr key={item.id}>
                  <td className={`${CELL} font-medium text-ink`}>{item.installmentNo}</td>
                  <td className={MONEY_CELL}>{money(item.fee)}</td>
                  <td className={CELL}><StatusBadge label={item.status} tone={TONE[item.status] ?? 'neutral'} /></td>
                  <td className={CELL}>{item.waiveReason}</td>
                  <td className={CELL}><AuditCell date={item.createdAt} by={item.createdBy} /></td>
                  <td className={CELL}><AuditCell date={item.updatedAt} by={item.updatedBy} /></td>
                  <td className={`${CELL} text-right`}>
                    {isOpen && can(permissions, 'penalty.waive') && item.status === 'UNPAID' && (
                      <ConfirmAction
                        label="Waive"
                        title={`Waive the late fee on installment ${item.installmentNo}?`}
                        message="The fee stops counting toward what the borrower owes. The record stays on file."
                        reasonLabel="Reason"
                        action={waivePenalty.bind(null, loan.id, item.id)}
                        lock={{ type: 'LOAN', id: loan.id }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </>
  )
}
