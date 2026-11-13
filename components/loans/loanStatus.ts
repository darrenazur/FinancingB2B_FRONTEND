import type { Loan } from '../../lib/api/financing'
import { daysBetween, manilaToday } from '../../lib/format'
import { t } from '../../lib/captions/t'

// Overdue = an installment past its due date and still open (same rule as the Overview); Process overdue isn't needed.
export const isOverdue = (loan: Loan) => !loan.deleted && !loan.closed && loan.overdueSince !== null
export const loanStatusLabel = (loan: Loan) =>
  loan.deleted ? t('UI_DELETED_2') : loan.closed ? t('UI_CLOSED_2') : isOverdue(loan) ? t('UI_OVERDUE') : t('UI_OPEN')
export const loanStatusTone = (loan: Loan): 'good' | 'neutral' | 'bad' =>
  loan.deleted || isOverdue(loan) ? 'bad' : loan.closed ? 'neutral' : 'good'
export const daysLate = (loan: Loan) => (loan.overdueSince ? daysBetween(loan.overdueSince, manilaToday()) : 0)
