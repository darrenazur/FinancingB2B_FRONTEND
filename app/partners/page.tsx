import PageHeader from '../../components/PageHeader'
import PartnersTable from '../../components/partners/PartnersTable'
import { getPartnerLookups, getPartners } from '../../lib/api/financing'

export default async function PartnersPage() {
  const [partners, lookups] = await Promise.all([getPartners(), getPartnerLookups()])

  return (
    <>
      <PageHeader title="Partners" description={`${partners.length} on record`} />
      <PartnersTable partners={partners} lookups={lookups} />
    </>
  )
}
