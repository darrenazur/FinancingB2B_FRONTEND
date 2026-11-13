import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ReactNode } from 'react'
import ConfirmAction from '../../../components/actions/ConfirmAction'
import RefreshButton from '../../../components/actions/RefreshButton'
import AddPaymentButton from '../../../components/loans/AddPaymentButton'
import LoanNoteButton from '../../../components/loans/LoanNoteButton'
import { daysLate, isOverdue, loanStatusLabel, loanStatusTone } from '../../../components/loans/loanStatus'
import { CLOSE_LOAN_MESSAGE } from '../../../components/loans/messages'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import StatusBadge from '../../../components/StatusBadge'
import AuditCell from '../../../components/table/AuditCell'
import { getInstallments, getLoan, getPaymentMethods, getPayments, getPenalties, getWriteOffs, Installment } from '../../../lib/api/financing'
import { getCurrentUser } from '../../../lib/api/session'
import { formatDate, formatMoney, manilaToday, sumMoney, toAmount } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { closeLoan, reversePayment, undoWriteOff, waivePenalty, writeOffLoan } from '../actions'
import { t } from '../../../lib/captions/t'

const TONE: Record<string, 'good' | 'neutral' | 'bad'> = {
  SETTLED: 'good',
  PAID: 'good',
  OVERDUE: 'bad',
  UNPAID: 'bad',
  'WRITTEN OFF': 'bad',
}
// Each table scrolls inside its own box, so a long payment list doesn't push the late fees far down the page.
const TABLE_HEAD = 'sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]'
const CLOSED_INSTALLMENTS = ['SETTLED', 'CANCELLED', 'WRITTEN OFF']
const HEADER_CELL = 'px-5 py-4 font-medium'
const CELL = 'px-5 py-5'
const MONEY_CELL = `${CELL} text-right tabular-nums`
const SECONDARY_BUTTON = 'rounded-xl border border-[var(--border)] bg-surface px-6 py-3 text-base font-medium text-ink hover:bg-elevated'
const OPEN_INSTALLMENTS = ['ACTIVE', 'OVERDUE']

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

  const [installments, payments, penalties, methods, writeOffs] = await Promise.all([
    getInstallments(loan.id),
    getPayments(loan.id),
    getPenalties(loan.id),
    getPaymentMethods(),
    getWriteOffs(loan.id),
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
  // What is still owed on one installment: its total due less what was paid on it.
  const remainingDue = (item: Installment) => totalDue(item) - sumMoney([item.paid])
  // What the form fills in when "Pay total due" is checked: what is left on the oldest open installment.
  const nextDue = installments.find(item => !CLOSED_INSTALLMENTS.includes(item.status))
  const dueLeft = nextDue ? remainingDue(nextDue) : BigInt(0)
  const due = nextDue && dueLeft > BigInt(0)
    ? { amount: toAmount(dueLeft), label: t('UI_INSTALLMENT', { dueLeft: money(dueLeft), number: nextDue.number }) }
    : null
  const reversedIds = new Set(payments.map(item => item.reversalOf))
  // A write-off date runs from the release, or the last payment if later, up to today.
  const writtenOff = writeOffs.find(item => !item.undoneDate)
  const canWriteOff = isOpen && can(permissions, 'loan.writeoff')
  const writeOffFrom = [loan.releaseDate, ...payments.map(item => item.date)].map(value => value.slice(0, 10)).sort().at(-1)
  const methodName = (methodId: number) => methods.find(item => item.id === methodId)?.label ?? t('UI_METHOD', { methodId })
  const paymentNo = (paymentId: number) => payments.find(item => item.id === paymentId)?.paymentNo

  return (
    <>
      <Link href="/loans" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_LOANS_2')}
      </Link>
      <PageHeader
        title={t('UI_LOAN', { loanNo: loan.loanNo })}
        description={t('UI_MONTHS_AT_A_MONTH_MATURES', { partnerName: loan.partnerName, term: loan.term, durationMonths: loan.durationMonths, monthlyRate: loan.monthlyRate, settlementName: loan.settlementName, maturityDate: formatDate(loan.maturityDate) })}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge label={loanStatusLabel(loan)} tone={loanStatusTone(loan)} />
        {isOverdue(loan) && <span className="text-base text-muted">{t('UI_DAYS_LATE', { days: daysLate(loan) })}</span>}
      </div>
      <p className="mb-6 text-base text-body">
        {t('UI_RELEASED_ON', { date: formatDate(loan.releaseDate) })}
        {loan.backdateReason && <span className="ml-2 text-muted">{t('UI_BACKDATED_REASON', { reason: loan.backdateReason })}</span>}
      </p>
      <p className="mb-2 text-base text-body">
        {t('UI_PROMISSORY_NOTE')}{': '}{loan.hasPromissoryNote ? t('UI_YES') : t('UI_NONE_ON_FILE')}
        {loan.promissoryNoteFile && (
          <a href={`/files/loan-note/${loan.id}`} target="_blank" rel="noreferrer" className="ml-3 font-medium text-accent-strong hover:underline">
            {t('UI_VIEW')}
          </a>
        )}
      </p>
      {loan.remarks && <p className="mb-6 whitespace-pre-line text-base text-muted">{loan.remarks}</p>}

      <div className="mb-8 flex flex-wrap gap-3">
        {isOpen && can(permissions, 'payment.add') && <AddPaymentButton loanId={loan.id} loanNo={loan.loanNo} methods={methods} due={due} loanDate={loan.releaseDate.slice(0, 10)} canBackdate={can(permissions, 'payment.backdate')} />}
        <RefreshButton />
        {!loan.deleted && can(permissions, 'loan.note') && <LoanNoteButton loan={loan} className={SECONDARY_BUTTON} />}
        {isOpen && can(permissions, 'loan.close') && (
          <ConfirmAction
            label={t('UI_CLOSE')}
            title={t('UI_CLOSE_LOAN', { loanNo: loan.loanNo })}
            message={t(CLOSE_LOAN_MESSAGE)}
            action={closeLoan.bind(null, loan.id)}
            lock={{ type: 'LOAN', id: loan.id }}
            triggerClass={SECONDARY_BUTTON}
          />
        )}
        {canWriteOff && !writtenOff && installments.some(item => OPEN_INSTALLMENTS.includes(item.status)) && (
          <ConfirmAction
            label={t('UI_WRITE_OFF')}
            title={t('UI_WRITE_OFF_LOAN', { loanNo: loan.loanNo })}
            message={t('UI_WRITE_OFF_MESSAGE')}
            dateLabel={t('UI_WRITE_OFF_DATE')}
            dateMin={writeOffFrom}
            dateMax={manilaToday()}
            reasonLabel={t('UI_REASON')}
            action={writeOffLoan.bind(null, loan.id)}
            lock={{ type: 'LOAN', id: loan.id }}
            triggerClass={SECONDARY_BUTTON}
          />
        )}
        {canWriteOff && writtenOff && (
          <ConfirmAction
            label={t('UI_UNDO_WRITE_OFF')}
            title={t('UI_UNDO_WRITE_OFF_LOAN', { loanNo: loan.loanNo })}
            message={t('UI_UNDO_WRITE_OFF_MESSAGE')}
            reasonLabel={t('UI_REASON')}
            action={undoWriteOff.bind(null, loan.id)}
            lock={{ type: 'LOAN', id: loan.id }}
            triggerClass={SECONDARY_BUTTON}
          />
        )}
      </div>

      {writtenOff && (
        <p role="status" className="mb-8 rounded-2xl border border-bad-line bg-bad-soft px-5 py-4 text-base text-bad">
          {t('UI_WRITTEN_OFF_BANNER', { date: formatDate(writtenOff.date), reason: writtenOff.reason })}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('UI_PRINCIPAL')} value={money(loan.principal)} />
        <StatCard label={t('UI_INTEREST')} value={money(loan.interest)} />
        <StatCard label={t('UI_PAID')} value={money(paid)} hint={t('UI_PRINCIPAL_AND_INTEREST')} />
        <StatCard
          label={t('UI_BALANCE')}
          value={money(balance)}
          hint={unpaidFees.length > 0 ? t('UI_PLUS_IN_LATE_FEES', { value: money(sumMoney(unpaidFees.map(item => item.fee))) }) : undefined}
        />
      </div>

      <Section title={t('UI_INSTALLMENTS')}>
        {installments.length === 0 ? <Empty text={t('UI_NO_INSTALLMENTS')} /> : (
          <table className="w-full min-w-[860px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>{t('UI_NO')}</th>
                <th className={HEADER_CELL}>{t('UI_DUE')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_PRINCIPAL')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_INTEREST')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_TOTAL_DUE')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_PAID')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_REMAINING_DUE')}</th>
                <th className={HEADER_CELL}>{t('UI_STATUS')}</th>
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
                  <td className={`${MONEY_CELL} font-medium text-ink`}>
                    {item.status === 'CANCELLED' || item.status === 'WRITTEN OFF' ? '—' : money(remainingDue(item))}
                  </td>
                  <td className={CELL}><StatusBadge label={item.status} tone={TONE[item.status] ?? 'neutral'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={t('UI_PAYMENTS')}>
        {payments.length === 0 ? <Empty text={t('UI_NO_PAYMENTS_YET')} /> : (
          <table className="w-full min-w-[1240px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>{t('UI_PAYMENT')}</th>
                <th className={HEADER_CELL}>{t('UI_DATE')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_AMOUNT')}</th>
                <th className={HEADER_CELL}>{t('UI_METHOD_2')}</th>
                <th className={HEADER_CELL}>{t('UI_REFERENCE')}</th>
                <th className={HEADER_CELL}>{t('UI_CREATED')}</th>
                <th className={HEADER_CELL}>{t('UI_UPDATED')}</th>
                <th className={HEADER_CELL}><span className="sr-only">{t('UI_ACTIONS')}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-body">
              {payments.map(item => (
                <tr key={item.id}>
                  <td className={CELL}>
                    <p className="font-medium text-ink">{t('UI_PAYMENT')}{' '}{item.paymentNo}</p>
                    {item.reversalOf && <p className="text-sm text-muted">{t('UI_REVERSAL_OF')}{' '}{paymentNo(item.reversalOf)}: {item.reversalReason}</p>}
                    {reversedIds.has(item.id) && <p className="text-sm text-muted">{t('UI_REVERSED')}</p>}
                  </td>
                  <td className={CELL}>
                    <p className="whitespace-nowrap">{formatDate(item.date)}</p>
                    {item.backdateReason && <p className="text-sm text-muted">{t('UI_BACKDATED_REASON', { reason: item.backdateReason })}</p>}
                  </td>
                  <td className={MONEY_CELL}>{money(item.amount)}</td>
                  <td className={CELL}>{methodName(item.methodId)}</td>
                  <td className={CELL}>
                    <p>{item.referenceNo}</p>
                    {item.hasProof && (
                      <a href={`/files/proof/${item.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-strong hover:underline">
                        {t('UI_VIEW_PROOF')}
                      </a>
                    )}
                  </td>
                  <td className={CELL}><AuditCell date={item.createdAt} by={item.createdBy} /></td>
                  <td className={CELL}><AuditCell date={item.updatedAt} by={item.updatedBy} /></td>
                  <td className={`${CELL} text-right`}>
                    {isOpen && can(permissions, 'payment.reverse') && !item.reversalOf && !reversedIds.has(item.id) && (
                      <ConfirmAction
                        label={t('UI_REVERSE')}
                        title={t('UI_REVERSE_PAYMENT', { paymentNo: item.paymentNo })}
                        message={t('UI_A_NEGATIVE_PAYMENT_IS_RECORDED_AND_THE_AMOUNTS_GO_BACK')}
                        reasonLabel={t('UI_REASON')}
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

      {writeOffs.length > 0 && (
        <Section title={t('UI_WRITE_OFFS')}>
          <table className="w-full min-w-[1060px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>{t('UI_WRITE_OFF_DATE')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_INSTALLMENTS')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_PRINCIPAL_WRITTEN_OFF')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_INTEREST_WRITTEN_OFF')}</th>
                <th className={HEADER_CELL}>{t('UI_REASON')}</th>
                <th className={HEADER_CELL}>{t('UI_STATUS')}</th>
                <th className={HEADER_CELL}>{t('UI_CREATED')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-base text-body">
              {writeOffs.map(item => (
                <tr key={item.id}>
                  <td className={`${CELL} whitespace-nowrap font-medium text-ink`}>{formatDate(item.date)}</td>
                  <td className={MONEY_CELL}>{item.installments}</td>
                  <td className={MONEY_CELL}>{money(item.principal)}</td>
                  <td className={MONEY_CELL}>{money(item.interest)}</td>
                  <td className={CELL}>{item.reason}</td>
                  <td className={CELL}>
                    {item.undoneDate ? (
                      <>
                        <p className="whitespace-nowrap">{t('UI_UNDONE_ON', { date: formatDate(item.undoneDate) })}</p>
                        <p className="text-sm text-muted">{item.undoReason}</p>
                      </>
                    ) : <StatusBadge label={t('UI_IN_FORCE')} tone="bad" />}
                  </td>
                  <td className={CELL}><AuditCell date={item.createdAt} by={item.createdBy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title={t('UI_LATE_FEES')}>
        {penalties.length === 0 ? <Empty text={t('UI_NO_LATE_FEES')} /> : (
          <table className="w-full min-w-[1060px] text-left">
            <thead className={TABLE_HEAD}>
              <tr className="text-sm text-muted">
                <th className={HEADER_CELL}>{t('UI_INSTALLMENT_2')}</th>
                <th className={`${HEADER_CELL} text-right`}>{t('UI_FEE')}</th>
                <th className={HEADER_CELL}>{t('UI_STATUS')}</th>
                <th className={HEADER_CELL}>{t('UI_REASON')}</th>
                <th className={HEADER_CELL}>{t('UI_CREATED')}</th>
                <th className={HEADER_CELL}>{t('UI_UPDATED')}</th>
                <th className={HEADER_CELL}><span className="sr-only">{t('UI_ACTIONS')}</span></th>
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
                        label={t('UI_WAIVE')}
                        title={t('UI_WAIVE_THE_LATE_FEE_ON_INSTALLMENT', { installmentNo: item.installmentNo })}
                        message={t('UI_THE_FEE_STOPS_COUNTING_TOWARD_WHAT_THE_BORROWER_OWES_THE')}
                        reasonLabel={t('UI_REASON')}
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
