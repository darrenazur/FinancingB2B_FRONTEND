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
          ].filter(Boolean).join(' · '),
          code: '',
        }))
  }
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

export async function getFunds(): Promise<BizFund[]> {
  return (await view('fund')).filter(row => !row.Deleted)
    .map(row => ({ id: Number(row.BizFundID), name: cell(row.Name), balance: cell(row.Balance) || '0' }))
}
