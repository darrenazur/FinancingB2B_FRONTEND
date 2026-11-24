import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatMonth } from '../../../../components/business/display'
import PageHeader from '../../../../components/PageHeader'
import { getSimSnapshots } from '../../../../lib/api/business'
import { getCurrentUser } from '../../../../lib/api/session'
import { parseSnapshot } from '../../../../lib/business/snapshot'
import { formatMoney } from '../../../../lib/format'
import { can } from '../../../../lib/permissions'
import { t } from '../../../../lib/captions/t'

const amount = (value: string | undefined) => (value && /^-?\d+(\.\d+)?$/.test(value) ? formatMoney(value) : '—')

// Saved simulations, newest first. Each opens read-only, with plan vs actual for the months that have passed.
export default async function SnapshotsPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const snapshots = (await getSimSnapshots()).map(parseSnapshot)

  return (
    <>
      <Link href="/business/simulation" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_SIMULATION')}
      </Link>
      <PageHeader title={t('UI_SIM_SNAPSHOTS')} description={t('UI_SIM_SNAPSHOTS_DESCRIPTION')} />

      {snapshots.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="text-sm text-muted">
                <th className="px-5 py-4 font-medium">{t('UI_SIM_SNAPSHOT_NAME')}</th>
                <th className="px-5 py-4 font-medium">{t('UI_SIM_SAVED')}</th>
                <th className="px-5 py-4 font-medium">{t('UI_SIM_BASE_MONTH')}</th>
                <th className="px-5 py-4 text-right font-medium">{t('UI_SIM_END_PORTFOLIO')}</th>
                <th className="px-5 py-4 text-right font-medium">{t('UI_SIM_END_MONTH')}</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map(snapshot => {
                const last = snapshot.result?.simulated[snapshot.result.simulated.length - 1]
                return (
                  <tr key={snapshot.id} className="border-t border-line">
                    <td className="px-5 py-4">
                      <Link href={`/business/simulation/snapshots/${snapshot.id}`} className="font-medium text-accent-strong hover:underline">{snapshot.name}</Link>
                      {snapshot.notes && <p className="mt-1 text-sm text-muted">{snapshot.notes}</p>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-body">{t('UI_SIM_SAVED_BY', { at: snapshot.savedAt, by: snapshot.savedBy })}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-body">{snapshot.baseMonth ? formatMonth(snapshot.baseMonth) : '—'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-ink">{amount(last?.Portfolio)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-body">{last?.MonthStart ? formatMonth(last.MonthStart) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
