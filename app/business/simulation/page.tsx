import Link from 'next/link'
import { redirect } from 'next/navigation'
import SimulationForm, { type AgentOption, type LoanStats } from '../../../components/business/SimulationForm'
import PageHeader from '../../../components/PageHeader'
import { getProjectionInput, getSimSnapshots } from '../../../lib/api/business'
import { getLoans } from '../../../lib/api/financing'
import { getCurrentUser } from '../../../lib/api/session'
import { projectionFields } from '../../../lib/business/projection'
import { parseSnapshot } from '../../../lib/business/snapshot'
import { daysBetween, sumMoney, toAmount } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

const STATS_MONTHS = 3
const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthOf = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`

// Loans released in the last 3 months up to the base month: average size = principal ÷ loans,
// average term = (maturity - release) days ÷ 30. Only these numbers go to the browser, no names.
async function loanStats(baseMonth: string): Promise<LoanStats | null> {
  if (!baseMonth) return null
  const to = monthIndex(baseMonth)
  const from = to - STATS_MONTHS + 1
  const loans = (await getLoans()).filter(loan => {
    if (loan.deleted || !loan.releaseDate) return false
    const month = monthIndex(loan.releaseDate)
    return month >= from && month <= to
  })
  if (loans.length === 0) return null
  const days = loans.reduce((sum, loan) => sum + daysBetween(loan.releaseDate.slice(0, 10), loan.maturityDate.slice(0, 10)), 0)
  return {
    loans: loans.length,
    from: `${monthOf(from)}-01`,
    to: `${monthOf(to)}-01`,
    avgLoan: toAmount(sumMoney(loans.map(loan => loan.principal)) / BigInt(loans.length)),
    termMonths: (days / loans.length / 30).toFixed(2),
  }
}

// What-ifs on top of the projection, from the same real data. Only the fields the projection reads go to the browser.
// ?snapshot=ID starts from a saved snapshot's fields (Load into simulator); the numbers are worked out again from today's data.
export default async function SimulationPage({ searchParams }: { searchParams: Promise<{ snapshot?: string }> }) {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const { snapshot: snapshotId } = await searchParams
  const loaded = snapshotId ? (await getSimSnapshots()).map(parseSnapshot).find(snapshot => snapshot.id === snapshotId) ?? null : null

  const raw = await getProjectionInput()
  const input = projectionFields(raw)
  // Staff names for choosing who gets a pay change (the same names Business > Agents shows); no borrower or investor names
  const agents: AgentOption[] = raw.agents.map(agent => ({ id: agent.AdminUserID ?? '', name: agent.Name ?? agent.Username ?? '' }))
  const stats = await loanStats(input.months[0]?.MonthStart ?? '')

  return (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t('UI_SIMULATION')} description={t('UI_SIMULATION_DESCRIPTION')} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {loaded ? (
          <p className="rounded-xl bg-accent-soft px-5 py-3.5 text-base text-accent-strong">{t('UI_SIM_LOADED_FROM', { name: loaded.name })}</p>
        ) : <span />}
        <Link href="/business/simulation/snapshots" className="text-base font-medium text-accent-strong hover:underline">{t('UI_SIM_SNAPSHOTS')}</Link>
      </div>
      <SimulationForm
        key={loaded?.id ?? 'new'}
        input={input}
        stats={stats}
        agents={agents}
        initial={loaded?.inputs?.form ?? null}
        canSave={can(permissions, 'business.manage')}
      />
    </>
  )
}
