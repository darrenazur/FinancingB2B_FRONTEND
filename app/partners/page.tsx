import PageHeader from '../../components/PageHeader'
import PartnersTable from '../../components/partners/PartnersTable'
import { getPartners } from '../../lib/api/financing'

export default async function PartnersPage() {
  const partners = await getPartners()

  return (
    <>
      <PageHeader title="Partners" description={`${partners.length} on record`} />
      <PartnersTable partners={partners} />
    </>
  )
}
