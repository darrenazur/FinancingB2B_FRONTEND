'use client'

import { useMemo, useState } from 'react'
import type { ScoreRow } from '../../lib/api/financing'
import { formatMoney } from '../../lib/format'
import { INPUT } from '../forms/FormDialog'
import GradeBadge from '../partners/GradeBadge'
import ScoreBreakdown from '../partners/ScoreBreakdown'
import ScoreDialog from '../partners/ScoreDialog'
import { t } from '../../lib/captions/t'

export interface ScoredPartner {
  id: number
  name: string
  partnerNo: string
  score: ScoreRow
}

const GRADES = ['A', 'B', 'C', 'D', 'E', 'NEW']
const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, NEW: 6 }
const BAR: Record<string, string> = { A: 'bg-good', B: 'bg-good', C: 'bg-accent', D: 'bg-bad', E: 'bg-bad', NEW: 'bg-muted' }
type Sort = 'score-desc' | 'score-asc' | 'name' | 'grade'

const n = (value: number | string | null | undefined) => String(Number(Number(value ?? 0).toFixed(2)))

// Every partner's credit score as a card: grade, score bar, suggested max, and the full working on request.
// Counts per grade double as filters. A partner opened from the Partners list (?p=<id>#p<id>) starts expanded,
// and the #p<id> part makes the browser scroll to its card.
export default function CreditScoreBoard({ partners, canRate, focusId }: { partners: ScoredPartner[]; canRate: boolean; focusId: number | null }) {
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('score-desc')
  const [open, setOpen] = useState<Set<number>>(() => new Set(focusId ? [focusId] : []))
  const [rating, setRating] = useState<ScoredPartner | null>(null)

  const counts = useMemo(() => Object.fromEntries(GRADES.map(g => [g, partners.filter(p => p.score.Grade === g).length])), [partners])

  const shown = useMemo(() => {
    const words = search.trim().toLowerCase()
    return partners
      .filter(p => !grade || p.score.Grade === grade)
      .filter(p => !words || `${p.name} ${p.partnerNo}`.toLowerCase().includes(words))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'grade') return (GRADE_ORDER[String(a.score.Grade)] ?? 9) - (GRADE_ORDER[String(b.score.Grade)] ?? 9)
        const diff = Number(a.score.FinalScore) - Number(b.score.FinalScore)
        return sort === 'score-asc' ? diff : -diff
      })
  }, [partners, search, grade, sort])

  const toggle = (id: number) => setOpen(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {GRADES.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setGrade(current => (current === g ? null : g))}
            aria-pressed={grade === g}
            className={[
              'rounded-2xl border bg-surface px-4 py-3 text-left transition-colors',
              grade === g ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:border-accent',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-muted">{g === 'NEW' ? t('UI_GRADE_NEW') : t('UI_GRADE_X', { grade: g })}</p>
            <p className="text-2xl font-semibold text-ink">{counts[g]}</p>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={t('UI_SEARCH_PARTNERS')}
          aria-label={t('UI_SEARCH_PARTNERS')}
          className={`${INPUT} px-3.5 py-2 text-sm sm:w-72`}
        />
        <select value={sort} onChange={event => setSort(event.target.value as Sort)} aria-label={t('UI_SORT')} className={`${INPUT} w-auto px-3.5 py-2 text-sm`}>
          <option value="score-desc">{t('UI_SORT_SCORE_HIGH')}</option>
          <option value="score-asc">{t('UI_SORT_SCORE_LOW')}</option>
          <option value="grade">{t('UI_SORT_GRADE')}</option>
          <option value="name">{t('UI_SORT_NAME')}</option>
        </select>
        {grade && (
          <button type="button" onClick={() => setGrade(null)} className="text-sm font-medium text-accent-strong hover:underline">
            {t('UI_CLEAR_FILTERS')}
          </button>
        )}
        <p className="ml-auto text-sm text-muted">{t('UI_SHOWING_N_OF_M', { shown: shown.length, total: partners.length })}</p>
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_PARTNERS_MATCH')}</p>
      )}

      <div className="flex flex-col gap-4">
        {shown.map(partner => {
          const g = String(partner.score.Grade)
          const final = Number(partner.score.FinalScore)
          const expanded = open.has(partner.id)
          return (
            <article key={partner.id} id={`p${partner.id}`} className="rounded-2xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start gap-4">
                <GradeBadge grade={g} score={final} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-ink">{partner.name}</p>
                  <p className="text-sm text-muted">{t('UI_NO')}{' '}{partner.partnerNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{t('UI_SUGGESTED_MAX')}</p>
                  <p className="text-lg font-semibold text-ink">{formatMoney(String(partner.score.SuggestedMax ?? '0'))}</p>
                </div>
              </div>

              <div className="mt-4 h-2.5 rounded-full bg-elevated" role="img" aria-label={t('UI_SCORE_OUT_OF_100', { score: n(final) })}>
                <div className={`h-2.5 rounded-full ${BAR[g] ?? 'bg-accent'}`} style={{ width: `${Math.max(0, Math.min(100, final))}%` }} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-body">
                <span>{t('UI_PERFORMANCE')}{': '}<strong className="text-ink">{n(partner.score.PerformanceScore)}</strong></span>
                <span>{t('UI_KPI_SCORE')}{': '}<strong className="text-ink">{Number(partner.score.KpiRated) > 0 ? n(partner.score.KpiScore) : t('UI_NOT_RATED')}</strong></span>
                <span>{t('UI_DUE_INSTALLMENTS')}{': '}<strong className="text-ink">{n(partner.score.DueInstallments)}</strong></span>
                {Number(partner.score.OverdueDays) > 0 && (
                  <span className="text-bad">{t('UI_OVERDUE_DAYS', { days: partner.score.OverdueDays })}</span>
                )}
                {Number(partner.score.HasWriteOff) === 1 && <span className="text-bad">{t('UI_HAS_WRITE_OFF')}</span>}
                <span className="ml-auto flex gap-2.5">
                  {canRate && (
                    <button type="button" onClick={() => setRating(partner)} className="rounded-xl border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-ink hover:bg-elevated">
                      {t('UI_RATE_KPIS')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggle(partner.id)}
                    aria-expanded={expanded}
                    className="rounded-xl bg-accent-soft px-3.5 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent hover:text-white"
                  >
                    {expanded ? t('UI_HIDE_WORKING') : t('UI_HOW_THIS_SCORE_WAS_WORKED_OUT')}
                  </button>
                </span>
              </div>

              {expanded && <div className="mt-5"><ScoreBreakdown score={partner.score} /></div>}
            </article>
          )
        })}
      </div>

      {rating && (
        <ScoreDialog key={rating.id} partnerId={rating.id} name={rating.name} canRate={canRate} onClose={() => setRating(null)} />
      )}
    </>
  )
}
