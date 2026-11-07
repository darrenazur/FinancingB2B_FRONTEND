import { redirect } from 'next/navigation'
import LoansTable from '../../components/loans/LoansTable'
import PageHeader from '../../components/PageHeader'
import { getLoanLookups, getLoans, getPartners } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

export default async function LoansPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'loan.view')) redirect('/dashboard')

  const [loans, partners, lookups] = await Promise.all([
    getLoans(),
    can(permissions, 'partner.view') ? getPartners() : [],
    getLoanLookups(),
  ])
  const verifiedPartners = partners
    .filter(partner => partner.status === 'VERIFIED' && !partner.deleted)
    .map(partner => ({ id: partner.id, label: partner.name }))

  return (
    <>
      <PageHeader title={t('UI_LOANS')} description={t('UI_ON_RECORD', { count: loans.length })} />
      <LoansTable loans={loans} verifiedPartners={verifiedPartners} lookups={lookups} permissions={permissions} />
    </>
  )
}
