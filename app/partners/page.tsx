import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import PartnersTable from '../../components/partners/PartnersTable'
import { getAssignableUsers, getPartnerLookups, getPartners } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'

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
      <PageHeader title="Partners" description={`${partners.length} on record`} />
      <PartnersTable partners={partners} lookups={lookups} users={users} permissions={permissions} />
    </>
  )
}
