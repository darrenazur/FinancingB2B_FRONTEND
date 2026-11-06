import 'server-only'
import { getAllPages } from './client'

export interface Partner {
  id: number
  name: string
  createdAt: string
  deleted: boolean
}

export interface Loan {
  id: number
  partnerName: string
  principal: string
  interest: string
  currency: string
  monthlyRate: number
  term: string
  durationMonths: number
  maturityDate: string
  closed: boolean
  deleted: boolean
}

interface PartnerRow {
  PartnerProfileID: number
  FirstName: string | null
  MiddleName: string | null
  LastName: string | null
  CreatedDt: string
  Deleted: boolean
}

interface LoanRow {
  FinancingInformationID: number
  PartnerName: string
  TotalPrincipalAmt: string
  TotalInterestAmt: string
  CurrencyCd: string
  InterestRate: number
  TermName: string
  Duration: number
  MaturityDate: string
  Closed: boolean
  Deleted: boolean
}

// Only the fields a screen needs leave this file. Address, birth date and device data stay out.
export async function getPartners(): Promise<Partner[]> {
  const rows = await getAllPages<PartnerRow>('/partner-profile-view')
  return rows.map(row => ({
    id: row.PartnerProfileID,
    name: [row.FirstName, row.MiddleName, row.LastName].filter(Boolean).join(' '),
    createdAt: row.CreatedDt,
    deleted: Boolean(row.Deleted),
  }))
}

export async function getLoans(): Promise<Loan[]> {
  const rows = await getAllPages<LoanRow>('/financing-information-view')
  return rows.map(row => ({
    id: row.FinancingInformationID,
    partnerName: row.PartnerName,
    principal: row.TotalPrincipalAmt,
    interest: row.TotalInterestAmt,
    currency: row.CurrencyCd.trim(),
    monthlyRate: row.InterestRate,
    term: row.TermName,
    durationMonths: row.Duration,
    maturityDate: row.MaturityDate,
    closed: Boolean(row.Closed),
    deleted: Boolean(row.Deleted),
  }))
}
