import LoansTable from '../../components/loans/LoansTable'
import PageHeader from '../../components/PageHeader'
import { getLoans } from '../../lib/api/financing'

export default async function LoansPage() {
  const loans = await getLoans()

  return (
    <>
      <PageHeader title="Loans" description={`${loans.length} on record`} />
      <LoansTable loans={loans} />
    </>
  )
}
