import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import CbfContractLoans from '../../../../components/business/CbfContractLoans'
import { displayValue } from '../../../../components/business/display'
import PageHeader from '../../../../components/PageHeader'
import { getBizOptions, getCbfContract } from '../../../../lib/api/business'
import { getCurrentUser } from '../../../../lib/api/session'
import { can } from '../../../../lib/permissions'
import { t } from '../../../../lib/captions/t'

// One CBF contract with everything that backs it: maturity, payout due, and each loan's grade and last due date
export default async function CbfContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const [found, options] = await Promise.all([getCbfContract(id), getBizOptions(['cbfLoan'])])
  if (!found) notFound()
  const { contract, loans } = found

  const amount = Number(contract.Amount) || 0
  const backedPct = amount > 0 ? Math.min(100, (Number(contract.Backed) || 0) / amount * 100) : 0
  const facts: [string, string][] = [
    ['UI_AMOUNT_INVESTED', displayValue('money', contract.Amount)],
    ['UI_MONTHLY_RATE', displayValue('percent', contract.MonthlyRate)],
    ['UI_START_DATE', displayValue('date', contract.StartDate)],
    ['UI_MATURITY_DATE', displayValue('date', contract.MaturityDate)],
    ['UI_DUE_AT_MATURITY', displayValue('money', contract.DueAtMaturity)],
    ['UI_STATUS', displayValue('cbfStatus', contract.Status)],
  ]

  return (
    <>
      <Link href="/business/cbf" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_CBF_CONTRACTS')}
      </Link>
      <PageHeader
        title={[contract.ContractNo, contract.InvestorName].filter(Boolean).join(' · ')}
        description={t('UI_CBF_CONTRACTS_DESCRIPTION')}
      />

      <section className="mb-10 flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{t(label)}</dt>
              <dd className="text-lg font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <div className="h-3 overflow-hidden rounded-full bg-page" role="progressbar" aria-valuenow={Math.round(backedPct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${backedPct}%` }} />
          </div>
          <p className="text-base text-body">
            {t('UI_BACKED_OF_AMOUNT', { backed: displayValue('money', contract.Backed || '0'), amount: displayValue('money', contract.Amount) })}
            {' · '}{t('UI_NOT_BACKED_YET')}{': '}<span className="font-semibold text-ink">{displayValue('money', contract.Unbacked || '0')}</span>
          </p>
        </div>
      </section>

      <CbfContractLoans
        contractId={id}
        maturityDate={contract.MaturityDate}
        loans={loans}
        options={options}
        canEdit={can(permissions, 'business.manage')}
      />
    </>
  )
}
