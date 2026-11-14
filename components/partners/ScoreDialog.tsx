'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { loadPartnerScore, ratePartnerKpis } from '../../app/partners/actions'
import type { ScoreDetails } from '../../lib/api/financing'
import { formatDate, formatMoney } from '../../lib/format'
import FormDialog, { Field, INPUT } from '../forms/FormDialog'
import GradeBadge from './GradeBadge'
import ScoreBreakdown from './ScoreBreakdown'
import { t } from '../../lib/captions/t'

const RATINGS = [1, 2, 3, 4, 5]

interface ScoreDialogProps {
  partnerId: number
  name: string
  canRate: boolean
  onClose: () => void
}

// A partner's credit score with the working shown, and the owner's KPI ratings.
// With partner.rate the window is a form: picking ratings and saving adds a new rating per KPI.
export default function ScoreDialog({ partnerId, name, canRate, onClose }: ScoreDialogProps) {
  const [details, setDetails] = useState<ScoreDetails | null>(null)
  const [failed, setFailed] = useState(false)
  const [, startLoading] = useTransition()

  useEffect(() => {
    startLoading(async () => {
      const loaded = await loadPartnerScore(partnerId)
      if (loaded) setDetails(loaded)
      else setFailed(true)
    })
  }, [partnerId])

  const title = t('UI_CREDIT_SCORE_OF', { name })
  const body = failed
    ? <p role="alert" className="text-base text-bad">{t('UI_CANT_LOAD_THE_CREDIT_SCORE')}</p>
    : !details
      ? <p className="text-base text-muted">{t('UI_LOADING')}</p>
      : <ScoreContent details={details} canRate={canRate} />

  if (canRate && details) {
    return (
      <FormDialog title={title} action={ratePartnerKpis.bind(null, partnerId)} onClose={onClose} wide>
        {body}
      </FormDialog>
    )
  }
  return <ViewDialog title={title} onClose={onClose}>{body}</ViewDialog>
}

function ScoreContent({ details, canRate }: { details: ScoreDetails; canRate: boolean }) {
  const { score, kpis, ratings } = details
  const latest = new Map(ratings.map(rating => [rating.kpiId, rating]))
  const lastRemark = [...ratings].filter(rating => rating.remarks).sort((a, b) => b.ratedDt.localeCompare(a.ratedDt))[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <GradeBadge grade={String(score.Grade)} score={Number(score.FinalScore)} />
        <p className="text-base text-body">
          {t('UI_SUGGESTED_MAX')}{': '}<span className="font-semibold text-ink">{formatMoney(String(score.SuggestedMax ?? '0'))}</span>
        </p>
      </div>
      <p className="text-sm text-muted">{t('UI_SCORE_ADVICE_ONLY')}</p>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-ink">{t('UI_HOW_THIS_SCORE_WAS_WORKED_OUT')}</h3>
        <ScoreBreakdown score={score} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-ink">{t('UI_KPI_RATINGS')}</h3>
        {lastRemark && (
          <p className="rounded-xl bg-page px-4 py-3 text-base text-body">
            {t('UI_LAST_REMARKS', { remarks: lastRemark.remarks, by: lastRemark.ratedBy, date: formatDate(lastRemark.ratedDt) })}
          </p>
        )}
        {kpis.length === 0 && <p className="text-base text-muted">{t('UI_NO_KPIS_YET')}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {kpis.map(kpi => {
            const last = latest.get(kpi.id)
            const hint = !last
              ? t('UI_NOT_RATED_YET')
              : last.rating === null
                ? t('UI_RATING_CLEARED', { by: last.ratedBy, date: formatDate(last.ratedDt) })
                : t('UI_LAST_RATED', { rating: last.rating, by: last.ratedBy, date: formatDate(last.ratedDt) })
            return canRate ? (
              <Field key={kpi.id} label={kpi.label} hint={hint}>
                <select name={`Kpi_${kpi.id}`} defaultValue={last?.rating ? String(last.rating) : ''} className={INPUT}>
                  <option value="">{t('UI_NOT_RATED')}</option>
                  {RATINGS.map(value => <option key={value} value={value}>{t('UI_RATING_OF_5', { value })}</option>)}
                </select>
              </Field>
            ) : (
              <div key={kpi.id} className="rounded-xl border border-line px-4 py-3">
                <p className="text-base font-medium text-ink">{kpi.label}</p>
                <p className="text-sm text-muted">{hint}</p>
              </div>
            )
          })}
        </div>
        {canRate && kpis.length > 0 && (
          <Field label={t('UI_KPI_REMARKS_OPTIONAL')}>
            <textarea name="Remarks" rows={2} maxLength={500} className={INPUT} />
          </Field>
        )}
      </section>
    </div>
  )
}

// For users who can see the score but not rate: the same window with only a Close button
function ViewDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-surface p-8 text-left text-ink shadow-xl backdrop:bg-black/30"
    >
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover">
          {t('UI_CLOSE')}
        </button>
      </div>
    </dialog>
  )
}
