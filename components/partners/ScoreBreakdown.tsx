import type { ScoreRow } from '../../lib/api/financing'
import { formatMoney } from '../../lib/format'
import { t } from '../../lib/captions/t'

// Numbers from PARTNERSCORE_VW, shown without trailing zeros (40.00 -> 40, 13.33 stays)
const n = (value: number | string | null | undefined) => String(Number(Number(value ?? 0).toFixed(2)))

interface Factor {
  label: string
  working: string
  points: number
  max: number
}

// The working behind a credit score: one row per factor with its formula, points and a bar, then how the
// performance, KPI score, final score, grade and suggested max follow. Every number comes from the view,
// including the settings it used (Business > Settings, SCORE_...), so anyone can check each step.
export default function ScoreBreakdown({ score }: { score: ScoreRow }) {
  const isNew = Number(score.IsNew) === 1
  const kpiRated = Number(score.KpiRated)
  const grace = n(score.GraceDays)
  const overdueDays = Number(score.OverdueDays)

  const factors: Factor[] = [
    {
      label: t('UI_FACTOR_ON_TIME'),
      working: t('UI_SCORE_W_ONTIME', { onTime: n(score.OnTimeInstallments), due: n(score.DueInstallments), grace, w: n(score.WOnTime) }),
      points: Number(score.PtsOnTime), max: Number(score.WOnTime),
    },
    {
      label: t('UI_FACTOR_LATENESS'),
      working: t('UI_SCORE_W_LATENESS', { avg: n(score.AvgDaysLate), grace, w: n(score.WLateness), zero: n(score.LateDaysZero) }),
      points: Number(score.PtsLateness), max: Number(score.WLateness),
    },
    {
      label: t('UI_FACTOR_PAID_LOANS'),
      working: t('UI_SCORE_W_PAID', {
        paid: n(score.PaidLoans), full: n(score.PaidLoansFull), used: Math.min(Number(score.PaidLoans), Number(score.PaidLoansFull)), w: n(score.WPaidLoans),
      }),
      points: Number(score.PtsPaidLoans), max: Number(score.WPaidLoans),
    },
    {
      label: t('UI_FACTOR_PENALTIES'),
      working: t('UI_SCORE_W_PENALTY', { count: n(score.Penalties), w: n(score.WPenalty), each: n(score.PenaltyEach) }),
      points: Number(score.PtsPenalty), max: Number(score.WPenalty),
    },
    {
      label: t('UI_FACTOR_OVERDUE'),
      working: overdueDays > 0
        ? t('UI_SCORE_W_OVERDUE', { days: overdueDays, w: n(score.WOverdue), zero: n(score.OverdueDaysZero) })
        : t('UI_SCORE_W_OVERDUE_NONE'),
      points: Number(score.PtsOverdue), max: Number(score.WOverdue),
    },
  ]

  const results: { label: string; working: string; value: string }[] = [
    {
      label: t('UI_PERFORMANCE'),
      working: isNew
        ? t('UI_SCORE_NEW_LINE', { value: n(score.NewPerformance) })
        : factors.map(factor => n(factor.points)).join(' + '),
      value: n(score.PerformanceScore),
    },
    {
      label: t('UI_KPI_SCORE'),
      working: kpiRated > 0
        ? t('UI_SCORE_W_KPI', { avg: n(score.KpiAverage), count: kpiRated })
        : t('UI_SCORE_KPI_NONE_LINE'),
      value: kpiRated > 0 ? n(score.KpiScore) : '—',
    },
    {
      label: t('UI_FINAL_SCORE'),
      working: kpiRated > 0
        ? t('UI_SCORE_W_FINAL', { perf: n(score.PerformanceScore), pw: n(100 - Number(score.KpiWeightPct)), kpi: n(score.KpiScore), kw: n(score.KpiWeightPct) })
        : t('UI_SCORE_W_FINAL_PERF_ONLY'),
      value: n(score.FinalScore),
    },
    {
      label: t('UI_GRADE'),
      working: Number(score.HasWriteOff) === 1
        ? t('UI_SCORE_WRITEOFF_LINE')
        : isNew
          ? t('UI_SCORE_GRADE_NEW_LINE')
          : t('UI_SCORE_W_GRADE', { a: n(score.GradeA), b: n(score.GradeB), c: n(score.GradeC), d: n(score.GradeD) }),
      value: String(score.Grade) === 'NEW' ? t('UI_GRADE_NEW') : String(score.Grade),
    },
    {
      label: t('UI_SUGGESTED_MAX'),
      working: isNew
        ? t('UI_SCORE_W_MAX_NEW')
        : t('UI_SCORE_W_MAX', {
            baseLabel: score.BiggestPaidLoan ? t('UI_BIGGEST_FULLY_PAID_LOAN') : t('UI_STARTING_AMOUNT'),
            base: formatMoney(String(score.BiggestPaidLoan ?? score.StartLimit ?? '0')),
            mult: n(score.Multiplier), grade: String(score.Grade),
          }),
      value: formatMoney(String(score.SuggestedMax ?? '0')),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-left text-base">
          <thead className="bg-elevated text-sm uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{t('UI_FACTOR')}</th>
              <th className="px-4 py-2.5 font-semibold">{t('UI_HOW_IT_IS_COUNTED')}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t('UI_POINTS')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {!isNew && factors.map(factor => (
              <tr key={factor.label}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{factor.label}</td>
                <td className="px-4 py-3 text-body">{factor.working}</td>
                <td className="w-40 px-4 py-3">
                  <p className="text-right font-semibold text-ink">{n(factor.points)}<span className="font-normal text-muted"> / {n(factor.max)}</span></p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-elevated">
                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${factor.max > 0 ? Math.min(100, (factor.points / factor.max) * 100) : 0}%` }} />
                  </div>
                </td>
              </tr>
            ))}
            {results.map(result => (
              <tr key={result.label} className="bg-elevated/40">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{result.label}</td>
                <td className="px-4 py-3 text-body">{result.working}</td>
                <td className="px-4 py-3 text-right font-semibold text-ink">{result.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">{t('UI_SCORE_SETTINGS_NOTE')}</p>
    </div>
  )
}
