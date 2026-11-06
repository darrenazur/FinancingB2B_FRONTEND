import LoansTable from '../../components/loans/LoansTable'
import PageHeader from '../../components/PageHeader'
import { getLoanLookups, getLoans, getPartners } from '../../lib/api/financing'

export default async function LoansPage() {
  const [loans, partners, lookups] = await Promise.all([getLoans(), getPartners(), getLoanLookups()])
  const verifiedPartners = partners
    .filter(partner => partner.status === 'VERIFIED' && !partner.deleted)
    .map(partner => ({ id: partner.id, label: partner.name }))

  return (
    <>
      <PageHeader title="Loans" description={`${loans.length} on record`} />
      <LoansTable loans={loans} verifiedPartners={verifiedPartners} lookups={lookups} />
    </>
  )
}
