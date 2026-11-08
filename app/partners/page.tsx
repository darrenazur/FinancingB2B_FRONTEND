import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import PartnersTable from '../../components/partners/PartnersTable'
import { getAssignableUsers, getPartnerLookups, getPartners } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

export default async function PartnersPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'partner.view')) redirect('/dashboard')

  const [partners, lookups, users] = await Promise.all([
    getPartners(),
    getPartnerLookups(),
    can(permissions, 'partner.assign') ? getAssignableUsers() : [],
  ])

  return (
    <>
      <PageHeader title={t('UI_PARTNERS')} description={t('UI_ON_RECORD', { count: partners.length })} />
      <PartnersTable partners={partners} lookups={lookups} users={users} permissions={permissions} />
    </>
  )
}
