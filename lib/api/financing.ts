import 'server-only'
import { Audit, AuditRow, readAudit } from '../audit'
import { getAllPages, getList, getRecord } from './client'

// id is the database key for API calls and stays off the screen. People see the number from NORANGE.
export interface Partner extends Audit {
  id: number
  partnerNo: string
  name: string
  email: string
  contactNo: string
  status: string
  hasIdNumber: boolean
  deleted: boolean
}

export interface PartnerDetails {
  id: number
  firstName: string
  middleName: string
  lastName: string
  birthDate: string
  address: string
  countryId: string
  provinceId: string
  cityId: string
  zipCodeId: string
  contactNo: string
  email: string
  telephoneNo: string
  idType1: string
  idImgPath1: string
  idType2: string
  idImgPath2: string
  selfiePath: string
}

export interface Loan extends Audit {
  id: number
  loanNo: string
  partnerId: number
  partnerName: string
  principal: string
  interest: string
  currency: string
  monthlyRate: number
  term: string
  termTypeId: number
  durationMonths: number
  tenureId: number
  settlementName: string
  settlementId: number
  maturityDate: string
  closed: boolean
  deleted: boolean
}

export interface Installment {
  id: number
  number: number
  principal: string
  interest: string
  paid: string
  dueDate: string
  status: string
}

export interface Payment extends Audit {
  id: number
  paymentNo: string
  amount: string
  date: string
  methodId: number
  referenceNo: string
  reversalOf: number | null
  reversalReason: string
}

export interface Penalty extends Audit {
  id: number
  installmentNo: number
  fee: string
  status: string
  waiveReason: string
}

export interface Option {
  id: number
  label: string
}

export interface LoanLookups {
  currencies: string[]
  terms: Option[]
  tenures: Option[]
  settlements: Option[]
}

export interface PartnerLookups {
  countries: (Option & { code: string })[]
  provinces: (Option & { countryId: number })[]
  cities: (Option & { provinceId: number })[]
  zipCodes: (Option & { cityId: number })[]
}

interface PartnerAuditRow extends AuditRow {
  PartnerProfileID: number
}

interface PartnerRow {
  PartnerProfileID: number
  PartnerNo: string | null
  FirstName: string | null
  MiddleName: string | null
  LastName: string | null
  BirthDate: string | null
  Address: string | null
  CountryID: number
  ProvinceID: number
  CityID: number
  ZIPCodeID: number
  ContactNo: string | null
  Email: string | null
  TelephoneNo: string | null
  IDType1: string | null
  IDImgPath1: string | null
  IDType2: string | null
  IDImgPath2: string | null
  SelfiePath: string | null
  VerificationStatus: string
  HasIDNumber: number
  Deleted: boolean
}

interface LoanRow extends AuditRow {
  FinancingInformationID: number
  LoanNo: string | null
  PartnerProfileID: number
  PartnerName: string
  TotalPrincipalAmt: string
  TotalInterestAmt: string
  CurrencyCd: string
  InterestRate: number
  TermName: string
  TermTypeID: number
  Duration: number
  TenureDurationID: number
  SettlementName: string
  SettlementStructID: number
  MaturityDate: string
  Closed: boolean
  Deleted: boolean
}

interface InstallmentRow {
  SettlementPlanID: number
  InstallmentNo: number
  PrincipalAmt: string
  InterestAmt: string
  PaidAmt: string
  DueDate: string
  StatusName: string
}

interface PaymentRow extends AuditRow {
  PaymentTransactionID: number
  PaymentNo: string | null
  AmountPaid: string
  TransactionDt: string
  PaymentMethodID: number
  ReferenceNo: string | null
  ReversalOfPaymentID: number | null
  ReversalReason: string | null
}

interface PenaltyRow extends AuditRow {
  SettlementPenID: number
  InstallmentNo: number
  PenaltyFeeValue: string
  PenaltyStatusName: string
  WaiveReason: string | null
  Deleted: boolean
}

type LookupRow = Record<string, string | number | boolean | null>

const fullName = (row: PartnerRow) => [row.FirstName, row.MiddleName, row.LastName].filter(Boolean).join(' ')
const live = (rows: LookupRow[]) => rows.filter(row => !row.Deleted)

function toLoan(row: LoanRow): Loan {
  return {
    id: row.FinancingInformationID,
    loanNo: row.LoanNo ?? '',
    partnerId: row.PartnerProfileID,
    partnerName: row.PartnerName,
    principal: row.TotalPrincipalAmt,
    interest: row.TotalInterestAmt,
    currency: row.CurrencyCd.trim(),
    monthlyRate: row.InterestRate,
    term: row.TermName,
    termTypeId: row.TermTypeID,
    durationMonths: row.Duration,
    tenureId: row.TenureDurationID,
    settlementName: row.SettlementName,
    settlementId: row.SettlementStructID,
    maturityDate: row.MaturityDate,
    closed: Boolean(row.Closed),
    deleted: Boolean(row.Deleted),
    ...readAudit(row),
  }
}

// The list carries only what the table shows. The full record reaches the browser when Edit is opened.
// The audit columns come from the profile view, because the summary view doesn't carry them.
export async function getPartners(): Promise<Partner[]> {
  const [rows, auditRows] = await Promise.all([
    getAllPages<PartnerRow>('/partner-summary-view'),
    getAllPages<PartnerAuditRow>('/partner-profile-view'),
  ])
  const audit = new Map(auditRows.map(row => [row.PartnerProfileID, row]))

  return rows.map(row => ({
    id: row.PartnerProfileID,
    partnerNo: row.PartnerNo ?? '',
    name: fullName(row),
    email: row.Email ?? '',
    contactNo: row.ContactNo ?? '',
    status: row.VerificationStatus,
    hasIdNumber: Boolean(row.HasIDNumber),
    deleted: Boolean(row.Deleted),
    ...readAudit(audit.get(row.PartnerProfileID) ?? {}),
  }))
}

export async function getPartnerDetails(id: number): Promise<PartnerDetails | null> {
  const rows = await getAllPages<PartnerRow>('/partner-summary-view')
  const row = rows.find(item => item.PartnerProfileID === id)
  if (!row) return null

  return {
    id: row.PartnerProfileID,
    firstName: row.FirstName ?? '',
    middleName: row.MiddleName ?? '',
    lastName: row.LastName ?? '',
    birthDate: row.BirthDate?.slice(0, 10) ?? '',
    address: row.Address ?? '',
    countryId: String(row.CountryID),
    provinceId: String(row.ProvinceID),
    cityId: String(row.CityID),
    zipCodeId: String(row.ZIPCodeID),
    contactNo: row.ContactNo ?? '',
    email: row.Email ?? '',
    telephoneNo: row.TelephoneNo ?? '',
    idType1: row.IDType1 ?? '',
    idImgPath1: row.IDImgPath1 ?? '',
    idType2: row.IDType2 ?? '',
    idImgPath2: row.IDImgPath2 ?? '',
    selfiePath: row.SelfiePath ?? '',
  }
}

export async function getLoans(): Promise<Loan[]> {
  const rows = await getAllPages<LoanRow>('/financing-information-view')
  return rows.map(toLoan)
}

export async function getLoan(loanNo: string): Promise<Loan | null> {
  const row = await getRecord<LoanRow>(`/financing-information-get-by-no/${loanNo}`)
  return row && toLoan(row)
}

export async function getInstallments(loanId: number): Promise<Installment[]> {
  const rows = await getList<InstallmentRow>(`/settlement-plan-view/${loanId}`)
  return rows
    .map(row => ({
      id: row.SettlementPlanID,
      number: row.InstallmentNo,
      principal: row.PrincipalAmt,
      interest: row.InterestAmt,
      paid: row.PaidAmt,
      dueDate: row.DueDate,
      status: row.StatusName,
    }))
    .sort((a, b) => a.number - b.number)
}

export async function getPayments(loanId: number): Promise<Payment[]> {
  const rows = await getList<PaymentRow>(`/payment-view/${loanId}`)
  return rows
    .map(row => ({
      id: row.PaymentTransactionID,
      paymentNo: row.PaymentNo ?? '',
      amount: row.AmountPaid,
      date: row.TransactionDt,
      methodId: row.PaymentMethodID,
      referenceNo: row.ReferenceNo ?? '',
      reversalOf: row.ReversalOfPaymentID,
      reversalReason: row.ReversalReason ?? '',
      ...readAudit(row),
    }))
    .sort((a, b) => b.id - a.id)
}

export async function getPenalties(loanId: number): Promise<Penalty[]> {
  const rows = await getList<PenaltyRow>(`/penalty-view/${loanId}`)
  return rows
    .filter(row => !row.Deleted)
    .map(row => ({
      id: row.SettlementPenID,
      installmentNo: row.InstallmentNo,
      fee: row.PenaltyFeeValue,
      status: row.PenaltyStatusName,
      waiveReason: row.WaiveReason ?? '',
      ...readAudit(row),
    }))
    .sort((a, b) => b.id - a.id)
}

export async function getPaymentMethods(): Promise<Option[]> {
  const rows = await getList<LookupRow>('/payment-method-view')
  return rows.map(row => ({ id: Number(row.PMID), label: String(row.ProviderName) }))
}

export async function getLoanLookups(): Promise<LoanLookups> {
  const [currencies, terms, tenures, settlements] = await Promise.all([
    getList<LookupRow>('/currency-view'),
    getList<LookupRow>('/term-type-view'),
    getList<LookupRow>('/tenure-duration-view'),
    getList<LookupRow>('/settlement-structure-view'),
  ])

  return {
    currencies: live(currencies).map(row => String(row.CurrencyCd).trim()),
    terms: live(terms).map(row => ({ id: Number(row.TermTypeID), label: String(row.TermName) })),
    tenures: live(tenures).map(row => ({ id: Number(row.TenureDurationID), label: `${row.Duration} months` })),
    settlements: live(settlements).map(row => ({ id: Number(row.SettlementStructID), label: String(row.Name) })),
  }
}

export async function getPartnerLookups(): Promise<PartnerLookups> {
  const [countries, provinces, cities, zipCodes] = await Promise.all([
    getList<LookupRow>('/country-view'),
    getList<LookupRow>('/province-view'),
    getList<LookupRow>('/city-view'),
    getList<LookupRow>('/zipcode-view'),
  ])

  return {
    countries: live(countries).map(row => ({
      id: Number(row.CountryID),
      label: String(row.CountryName),
      code: String(row.CountryCd).trim(),
    })),
    provinces: live(provinces).map(row => ({
      id: Number(row.ProvinceID),
      label: String(row.ProvinceName),
      countryId: Number(row.CountryID),
    })),
    cities: live(cities).map(row => ({
      id: Number(row.CityID),
      label: String(row.CityName),
      provinceId: Number(row.ProvinceID),
    })),
    zipCodes: live(zipCodes).map(row => ({
      id: Number(row.ZIPCodeID),
      label: String(row.ZipCode),
      cityId: Number(row.CityID),
    })),
  }
}
