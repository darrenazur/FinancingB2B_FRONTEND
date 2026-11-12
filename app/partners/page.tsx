import { redirect } from 'next/navigation'
import PageHeader from '../../components/PageHeader'
import type { LoanStats } from '../../components/partners/AssignPartnersDialog'
import PartnersTable from '../../components/partners/PartnersTable'
import { getAssignableUsers, getLoans, getPartnerLookups, getPartners, Loan } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { sumMoney, toAmount } from '../../lib/format'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

// Open loans and their principal per partner, shown in the assign window.
function loanStatsOf(loans: Loan[]): Record<number, LoanStats> {
  const open = new Map<number, string[]>()
  for (const loan of loans) {
    if (loan.closed || loan.deleted) continue
    open.set(loan.partnerId, [...(open.get(loan.partnerId) ?? []), loan.principal])
  }
  return Object.fromEntries([...open].map(([partnerId, principals]) => [
    partnerId,
    { open: principals.length, principal: toAmount(sumMoney(principals)) },
  ]))
}

export default async function PartnersPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'partner.view')) redirect('/dashboard')

  const canAssign = can(permissions, 'partner.assign')
  const [partners, lookups, users, loans] = await Promise.all([
    getPartners(),
    getPartnerLookups(),
    canAssign ? getAssignableUsers() : [],
    // Without loan.view the assign window shows 0 open loans.
    canAssign && can(permissions, 'loan.view') ? getLoans().catch(() => []) : [],
  ])

  return (
    <>
      <PageHeader title={t('UI_PARTNERS')} description={t('UI_ON_RECORD', { count: partners.length })} />
      <PartnersTable partners={partners} lookups={lookups} users={users} loanStats={loanStatsOf(loans)} permissions={permissions} />
    </>
  )
}
