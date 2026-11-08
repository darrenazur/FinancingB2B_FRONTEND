import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import Dashboard from '../../components/business/Dashboard'
import { getDashboard, getFunds } from '../../lib/api/business'
import { getCurrentUser } from '../../lib/api/session'
import { BIZ_RESOURCES } from '../../lib/business/resources'
import { formatMoney } from '../../lib/format'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

export default async function BusinessPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const [funds, dashboard] = await Promise.all([getFunds(), getDashboard()])

  return (
    <>
      <PageHeader title={t('UI_BUSINESS')} description={t('UI_BUSINESS_DESCRIPTION')} />

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_SCALING_AND_LEVERAGE')}</h2>
        <Dashboard data={dashboard} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_REPORTS')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/business/report" className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent">
            <p className="text-lg font-semibold text-ink">{t('UI_MONTHLY_REPORT')}</p>
            <p className="mt-2 text-base text-body">{t('UI_MONTHLY_REPORT_DESCRIPTION')}</p>
          </Link>
          <Link href="/business/statements" className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent">
            <p className="text-lg font-semibold text-ink">{t('UI_FINANCIAL_STATEMENTS')}</p>
            <p className="mt-2 text-base text-body">{t('UI_FINANCIAL_STATEMENTS_DESCRIPTION')}</p>
          </Link>
          <Link href="/business/projection" className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent">
            <p className="text-lg font-semibold text-ink">{t('UI_PROJECTION')}</p>
            <p className="mt-2 text-base text-body">{t('UI_PROJECTION_DESCRIPTION')}</p>
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_FUND_BALANCES')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {funds.map(fund => <StatCard key={fund.id} label={fund.name} value={formatMoney(fund.balance)} />)}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{t('UI_RECORDS')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {BIZ_RESOURCES.map(resource => (
            <Link
              key={resource.key}
              href={`/business/${resource.key}`}
              className="rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-accent"
            >
              <p className="text-lg font-semibold text-ink">{t(resource.label)}</p>
              <p className="mt-2 text-base text-body">{t(resource.description)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
