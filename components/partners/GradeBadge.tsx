import StatusBadge from '../StatusBadge'
import { t } from '../../lib/captions/t'

const TONE: Record<string, 'good' | 'neutral' | 'bad'> = { A: 'good', B: 'good', D: 'bad', E: 'bad' }

// "B · 72.4". NEW (nothing due yet) shows without a score, since its 50 is only a starting point.
export default function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const label = grade === 'NEW' ? t('UI_GRADE_NEW') : t('UI_GRADE_AND_SCORE', { grade, score: String(Number(score.toFixed(2))) })
  return <StatusBadge label={label} tone={TONE[grade] ?? 'neutral'} />
}
