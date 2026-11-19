import 'server-only'
import { Audit, AuditRow, readAudit } from '../audit'
import { BizResource, BizSource } from '../business/resources'
import { formatDate, formatMoney } from '../format'
import { t } from '../captions/t'
import { getList } from './client'

type ApiValue = string | number | boolean | null
type ApiRow = AuditRow & Record<string, ApiValue | undefined>

export interface BizRow extends Audit {
  key: number
  id: string
  deleted: boolean
  deleteReason: string
  values: Record<string, string>
}

export interface BizOption {
  value: string
  label: string
  code: string
  // Picker tables only: one cell per column; sort is the raw number when text would sort wrong (money)
  cells?: { text: string; sort?: number }[]
  warn?: boolean
}

export interface BizFund {
  id: number
  name: string
  balance: string
}

// Dates come as ISO text; the screens use YYYY-MM-DD. Money is already exact text.
function cell(value: ApiValue | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? '1' : '0'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}T/.test(text) ? text.slice(0, 10) : text
}

const view = (entity: string) => getList<ApiRow>(`/biz-view/${entity}`)

// Only the configured fields reach the browser.
export async function getBizRows(resource: BizResource): Promise<BizRow[]> {
  const names = new Set([resource.idField, resource.titleField, ...resource.fields.map(f => f.name), ...resource.columns.map(c => c.name)])
  const rows = await view(resource.key)
  return rows.map((row, index) => ({
    key: index + 1,
    id: cell(row[resource.idField]),
    deleted: Boolean(row.Deleted),
    deleteReason: cell(row.DeleteReason),
    values: Object.fromEntries([...names].map(name => [name, cell(row[name])])),
    ...readAudit(row),
  }))
}

async function optionsFor(source: BizSource): Promise<BizOption[]> {
  switch (source) {
    case 'fund':
      return (await view('fund')).filter(row => !row.Deleted)
        .map(row => ({ value: cell(row.BizFundID), label: cell(row.Name), code: cell(row.FundCd) }))
    case 'bankLoan':
      return (await view('bank-loan')).filter(row => !row.Deleted)
        .map(row => ({
          value: cell(row.BizBankLoanID),
          label: [cell(row.BankName), cell(row.ReferenceNo), formatMoney(cell(row.LoanAmount))].filter(Boolean).join(' · '),
          code: '',
        }))
    case 'category':
      return (await view('expense-category')).filter(row => !row.Deleted)
        .map(row => ({ value: cell(row.ExpenseCategoryID), label: cell(row.Name), code: cell(row.CategoryCd) }))
    case 'incomeCategory':
      return (await view('income-category')).filter(row => !row.Deleted)
        .map(row => ({ value: cell(row.IncomeCategoryID), label: cell(row.Name), code: cell(row.CategoryCd) }))
    case 'agent':
      return (await view('agent'))
        .map(row => ({ value: cell(row.AdminUserID), label: cell(row.Name) || cell(row.Username), code: cell(row.RoleName) }))
    case 'investor':
      return (await view('investor')).filter(row => !row.Deleted)
        .map(row => ({ value: cell(row.BizInvestorID), label: cell(row.Name), code: '' }))
    // Contracts not paid out yet
    case 'cbf':
      return (await view('cbf')).filter(row => !row.Deleted && cell(row.Status) !== 'PAID')
        .map(row => ({
          value: cell(row.BizCbfID),
          label: [cell(row.InvestorName), cell(row.ContractNo), formatMoney(cell(row.Amount)), formatDate(cell(row.StartDate))].filter(Boolean).join(' · '),
          code: '',
        }))
    // Open loans, with the principal not yet backing a contract
    case 'cbfLoan':
      return (await view('cbf-loan-option')).filter(row => !row.Closed)
        .map(row => ({
          value: cell(row.FinancingInformationID),
          label: [
            cell(row.LoanNo), cell(row.ClientName), t('UI_AVAILABLE_AMOUNT', { amount: formatMoney(cell(row.Available)) }),
            row.IsOverdue ? t('UI_OVERDUE') : '',
            row.Grade ? t('UI_GRADE_X', { grade: cell(row.Grade) }) : '',
            row.SuggestedMax ? t('UI_MAX_AMOUNT', { amount: formatMoney(cell(row.SuggestedMax)) }) : '',
            row.Grade && !['A', 'B'].includes(cell(row.Grade)) ? t('UI_CBF_NOT_ADVISED') : '',
          ].filter(Boolean).join(' · '),
          code: '',
          cells: [
            { text: cell(row.LoanNo) },
            { text: cell(row.ClientName) },
            { text: formatMoney(cell(row.Available)), sort: Number(cell(row.Available)) },
            { text: cell(row.Grade) },
            { text: formatMoney(cell(row.SuggestedMax)), sort: Number(cell(row.SuggestedMax)) },
            { text: cell(row.LastDueDate) ? formatDate(cell(row.LastDueDate)) : '', sort: Date.parse(cell(row.LastDueDate)) || 0 },
          ],
          warn: Boolean(row.Grade) && !['A', 'B'].includes(cell(row.Grade)),
        }))
  }
}

export interface CbfBackingLoan {
  id: string
  loanNo: string
  client: string
  amount: string
  principalLeft: string
  grade: string
  lastDue: string
  isOverdue: boolean
}

export interface CbfContract {
  contract: Record<string, string>
  loans: CbfBackingLoan[]
}

// One contract and the loans backing it now, with each loan's grade and last due date
export async function getCbfContract(id: string): Promise<CbfContract | null> {
  const [contracts, loans, options] = await Promise.all([view('cbf'), view('cbf-loan'), view('cbf-loan-option')])
  const row = contracts.find(item => cell(item.BizCbfID) === id && !item.Deleted)
  if (!row) return null
  const byLoan = new Map(options.map(option => [cell(option.FinancingInformationID), option]))
  return {
    contract: Object.fromEntries(['InvestorName', 'ContractNo', 'StartDate', 'MaturityDate', 'Amount', 'MonthlyRate',
      'Status', 'Backed', 'Unbacked', 'DueAtMaturity'].map(name => [name, cell(row[name])])),
    loans: loans.filter(item => cell(item.BizCbfID) === id && !item.Deleted).map((item): CbfBackingLoan => {
      const option = byLoan.get(cell(item.FinancingInformationID))
      return {
        id: cell(item.BizCbfLoanID),
        loanNo: cell(item.LoanNo),
        client: cell(item.ClientName),
        amount: cell(item.Amount),
        principalLeft: cell(item.LoanBalance),
        grade: cell(option?.Grade),
        lastDue: cell(option?.LastDueDate),
        isOverdue: Boolean(item.IsOverdue),
      }
    }),
  }
}

// One live notice for the bell (see NOTIFICATION_VW): Items, Amount, Compare and RefDate mean different things per code
export interface Notice {
  code: string
  items: number
  amount: string
  compare: string
  refDate: string
}

export async function getNotifications(): Promise<Notice[]> {
  return (await view('notification')).map(row => ({
    code: cell(row.Code),
    items: Number(row.Items) || 0,
    amount: cell(row.Amount),
    compare: cell(row.Compare),
    refDate: cell(row.RefDate),
  }))
}

export async function getBizOptions(sources: BizSource[]): Promise<Partial<Record<BizSource, BizOption[]>>> {
  const lists = await Promise.all(sources.map(optionsFor))
  return Object.fromEntries(sources.map((source, index) => [source, lists[index]]))
}

// One row per month, newest first. Every value is exact text from the report view.
export type ReportRow = Record<string, string>

async function report(entity: string): Promise<ReportRow[]> {
  const rows = (await view(entity)).map(row => Object.fromEntries(Object.entries(row).map(([name, value]) => [name, cell(value)])))
  return rows.sort((a, b) => (b.MonthStart ?? '').localeCompare(a.MonthStart ?? ''))
}

export const getMonthlyReport = () => report('monthly')
export const getAgentMonthly = () => report('agent-monthly')
// Accrual statements: one row per month, and each bank loan per month (newest first)
export const getStatements = () => report('statement')
export const getStatementBanks = () => report('statement-bank')
// Where the money is: outstanding principal by loan purpose (PURPOSE) and by source of income (INCOME)
export const getConcentration = () => report('concentration')

// Everything the projection reads, as exact text.
export async function getProjectionInput() {
  const [months, agentMonths, settings, bankLoans, agents, agentRates, contracts, schedule, loanRate] = await Promise.all([
    report('monthly'), report('agent-monthly'), report('setting'), report('bank-loan'), report('agent'), report('agent-pay'), report('cbf'),
    report('schedule'), report('loan-rate'),
  ])
  return {
    months,
    schedule,
    contractRatePct: loanRate[0]?.ContractRatePct ?? '',
    agentMonths,
    settings: Object.fromEntries(settings.map(row => [row.SettingCd ?? '', row.SettingValue ?? ''])),
    bankLoans,
    agents,
    agentRates,
    contracts,
  }
}

// One row as of today, or null before any loan or business record exists.
export async function getDashboard(): Promise<ReportRow | null> {
  return (await report('dashboard'))[0] ?? null
}

// One row as of today: what borrowers still owe and what came in.
export async function getOverview(): Promise<ReportRow | null> {
  return (await report('overview'))[0] ?? null
}

// Each loan with an installment past due, most days late first.
export async function getOverdueLoans(): Promise<ReportRow[]> {
  return (await report('overdue-loan')).sort((a, b) => Number(b.DaysLate) - Number(a.DaysLate))
}

// Each loan that paid today, net of reversals, biggest first.
export async function getPaidToday(): Promise<ReportRow[]> {
  return (await report('paid-today')).sort((a, b) => Number(b.AmountPaid) - Number(a.AmountPaid))
}

// Each loan that paid, per day: newest day first, biggest first within a day.
export async function getPaidDays(): Promise<ReportRow[]> {
  return (await report('paid-day')).sort((a, b) =>
    (b.PayDate ?? '').localeCompare(a.PayDate ?? '') || Number(b.AmountPaid) - Number(a.AmountPaid))
}

export async function getFunds(): Promise<BizFund[]> {
  return (await view('fund')).filter(row => !row.Deleted)
    .map(row => ({ id: Number(row.BizFundID), name: cell(row.Name), balance: cell(row.Balance) || '0' }))
}
