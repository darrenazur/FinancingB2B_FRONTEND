import { redirect } from 'next/navigation'
import RefreshButton from '../../components/actions/RefreshButton'
import CreditScoreBoard, { ScoredPartner } from '../../components/credit/CreditScoreBoard'
import PageHeader from '../../components/PageHeader'
import { getPartners, getPartnerScoreRows } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'
import { t } from '../../lib/captions/t'

// Every partner's credit score with the full working. Follows the user's data scope like the Partners list.
export default async function CreditScorePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'partner.view')) redirect('/dashboard')

  const { p } = await searchParams
  const focusId = /^\d+$/.test(p ?? '') ? Number(p) : null
  const [partners, scores] = await Promise.all([getPartners(), getPartnerScoreRows()])
  const byId = new Map(scores.map(row => [Number(row.PartnerProfileID), row]))
  const scored: ScoredPartner[] = partners
    .filter(partner => !partner.deleted && byId.has(partner.id))
    .map(partner => ({ id: partner.id, name: partner.name, partnerNo: partner.partnerNo, score: byId.get(partner.id)! }))

  return (
    <>
      <PageHeader title={t('UI_CREDIT_SCORE')} description={t('UI_CREDIT_SCORE_DESCRIPTION')} />
      <div className="mb-5 flex justify-end"><RefreshButton /></div>
      {scores.length === 0
        ? <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_CANT_LOAD_THE_CREDIT_SCORE')}</p>
        : <CreditScoreBoard partners={scored} canRate={can(permissions, 'partner.rate')} focusId={focusId} />}
    </>
  )
}
