// The Business screens. Each one is a list from /biz-view/{entity}, saved through /biz-save/{entity}.
// Field names match the API and its procedures; the API checks every value again.

export type BizFieldType = 'money' | 'rate' | 'date' | 'futureDate' | 'month' | 'int' | 'text' | 'longtext' | 'select' | 'inout' | 'capitalType' | 'checkbox'
export type BizSource = 'fund' | 'bankLoan' | 'category' | 'agent' | 'investor' | 'cbf' | 'cbfLoan'
export type BizColumnKind = 'text' | 'number' | 'money' | 'date' | 'month' | 'percent' | 'inout' | 'capitalType' | 'opening' | 'paidOff' | 'cbfStatus' | 'risk'

export interface BizField {
  name: string
  label: string
  type: BizFieldType
  required?: boolean
  hint?: string
  source?: BizSource
  // Shown only when the chosen category has one of these codes.
  onlyForCategory?: string[]
  // A saved record keeps this value; to move it, delete the record and add it again.
  fixedOnEdit?: boolean
  // A select that opens a sortable table instead: one caption code per column, matching the options' cells.
  picker?: string[]
}

export interface BizColumn {
  name: string
  label: string
  kind: BizColumnKind
}

export interface BizResource {
  key: string
  label: string
  description: string
  idField: string
  // The column that names a row in Edit and Delete titles.
  titleField: string
  fields: BizField[]
  columns: BizColumn[]
  canAdd: boolean
  canDelete: boolean
  sources: BizSource[]
  // Wording for the row button that opens the form, when it isn't "Edit"
  editLabel?: string
  // Deleting a row only ends it (it stays as history): the buttons and status say Remove and Removed
  removeWording?: boolean
}

const remarks: BizField = { name: 'Remarks', label: 'UI_REMARKS', type: 'longtext' }

export const BIZ_RESOURCES: BizResource[] = [
  {
    key: 'capital',
    label: 'UI_CAPITAL',
    description: 'UI_CAPITAL_DESCRIPTION',
    idField: 'BizCapitalID',
    titleField: 'TxnDate',
    canAdd: true,
    canDelete: true,
    sources: [],
    fields: [
      { name: 'TxnDate', label: 'UI_DATE', type: 'date', required: true },
      // IN, OUT, or RET: profit kept from before this system (one only)
      { name: 'TxnType', label: 'UI_CAPITAL_TYPE', type: 'capitalType', required: true },
      { name: 'Amount', label: 'UI_AMOUNT', type: 'money', required: true },
      remarks,
    ],
    columns: [
      { name: 'TxnDate', label: 'UI_DATE', kind: 'date' },
      { name: 'TxnType', label: 'UI_CAPITAL_TYPE', kind: 'capitalType' },
      { name: 'Amount', label: 'UI_AMOUNT', kind: 'money' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'bank-loan',
    label: 'UI_BANK_LOANS',
    description: 'UI_BANK_LOANS_DESCRIPTION',
    idField: 'BizBankLoanID',
    titleField: 'BankName',
    canAdd: true,
    canDelete: true,
    sources: [],
    fields: [
      { name: 'BankName', label: 'UI_BANK', type: 'text', required: true },
      { name: 'ReferenceNo', label: 'UI_REFERENCE_NUMBER', type: 'text' },
      { name: 'LoanAmount', label: 'UI_LOAN_AMOUNT', type: 'money', required: true },
      { name: 'MonthlyRate', label: 'UI_MONTHLY_RATE', type: 'rate', required: true, hint: 'UI_MONTHLY_RATE_HINT' },
      { name: 'TenureMonths', label: 'UI_TENURE_MONTHS', type: 'int', required: true },
      { name: 'BankFee', label: 'UI_BANK_FEE', type: 'money', hint: 'UI_BANK_FEE_HINT' },
      { name: 'ReleaseDate', label: 'UI_RELEASE_DATE', type: 'date', required: true },
      { name: 'FirstDueDate', label: 'UI_FIRST_DUE_DATE', type: 'futureDate', required: true },
      { name: 'MonthlyAmortization', label: 'UI_MONTHLY_AMORTIZATION', type: 'money', required: true },
      remarks,
    ],
    columns: [
      { name: 'BankName', label: 'UI_BANK', kind: 'text' },
      { name: 'ReferenceNo', label: 'UI_REFERENCE_NUMBER', kind: 'text' },
      { name: 'LoanAmount', label: 'UI_LOAN_AMOUNT', kind: 'money' },
      { name: 'MonthlyRate', label: 'UI_MONTHLY_RATE', kind: 'percent' },
      { name: 'TenureMonths', label: 'UI_TENURE_MONTHS', kind: 'text' },
      { name: 'ReleaseDate', label: 'UI_RELEASE_DATE', kind: 'date' },
      { name: 'MonthlyAmortization', label: 'UI_MONTHLY_AMORTIZATION', kind: 'money' },
      { name: 'PrincipalPaid', label: 'UI_PRINCIPAL_PAID', kind: 'money' },
      { name: 'InterestPaid', label: 'UI_INTEREST_PAID', kind: 'money' },
      { name: 'Balance', label: 'UI_BALANCE', kind: 'money' },
      { name: 'Closed', label: 'UI_STATUS', kind: 'paidOff' },
    ],
  },
  {
    key: 'bank-payment',
    label: 'UI_BANK_PAYMENTS',
    description: 'UI_BANK_PAYMENTS_DESCRIPTION',
    idField: 'BizBankPaymentID',
    titleField: 'PaymentDate',
    canAdd: true,
    canDelete: true,
    sources: ['bankLoan'],
    fields: [
      { name: 'BizBankLoanID', label: 'UI_BANK_LOAN', type: 'select', source: 'bankLoan', required: true, fixedOnEdit: true },
      { name: 'PaymentDate', label: 'UI_PAYMENT_DATE', type: 'date', required: true },
      { name: 'PrincipalAmt', label: 'UI_PRINCIPAL', type: 'money', hint: 'UI_PRINCIPAL_HINT' },
      { name: 'InterestAmt', label: 'UI_INTEREST', type: 'money', hint: 'UI_INTEREST_HINT' },
      { name: 'PenaltyAmt', label: 'UI_PENALTY', type: 'money' },
      { name: 'ReferenceNo', label: 'UI_REFERENCE_NUMBER', type: 'text' },
      remarks,
    ],
    columns: [
      { name: 'BankName', label: 'UI_BANK', kind: 'text' },
      { name: 'PaymentDate', label: 'UI_PAYMENT_DATE', kind: 'date' },
      { name: 'PrincipalAmt', label: 'UI_PRINCIPAL', kind: 'money' },
      { name: 'InterestAmt', label: 'UI_INTEREST', kind: 'money' },
      { name: 'PenaltyAmt', label: 'UI_PENALTY', kind: 'money' },
      { name: 'TotalAmt', label: 'UI_TOTAL', kind: 'money' },
      { name: 'ReferenceNo', label: 'UI_REFERENCE_NUMBER', kind: 'text' },
    ],
  },
  {
    key: 'fund-txn',
    label: 'UI_FUNDS',
    description: 'UI_FUNDS_DESCRIPTION',
    idField: 'BizFundTxnID',
    titleField: 'TxnDate',
    canAdd: true,
    canDelete: true,
    sources: ['fund'],
    fields: [
      { name: 'BizFundID', label: 'UI_FUND', type: 'select', source: 'fund', required: true, fixedOnEdit: true },
      { name: 'TxnDate', label: 'UI_DATE', type: 'date', required: true },
      { name: 'TxnType', label: 'UI_IN_OR_OUT', type: 'inout', required: true },
      { name: 'Amount', label: 'UI_AMOUNT', type: 'money', required: true },
      remarks,
    ],
    columns: [
      { name: 'FundName', label: 'UI_FUND', kind: 'text' },
      { name: 'TxnDate', label: 'UI_DATE', kind: 'date' },
      { name: 'TxnType', label: 'UI_IN_OR_OUT', kind: 'inout' },
      { name: 'Amount', label: 'UI_AMOUNT', kind: 'money' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'expense',
    label: 'UI_EXPENSES',
    description: 'UI_EXPENSES_DESCRIPTION',
    idField: 'BizExpenseID',
    titleField: 'CategoryName',
    canAdd: true,
    canDelete: true,
    sources: ['category', 'agent'],
    fields: [
      { name: 'ExpenseCategoryID', label: 'UI_CATEGORY', type: 'select', source: 'category', required: true },
      { name: 'ExpenseDate', label: 'UI_DATE', type: 'date', required: true },
      { name: 'Amount', label: 'UI_AMOUNT', type: 'money', required: true },
      { name: 'PayeeUserID', label: 'UI_AGENT', type: 'select', source: 'agent', required: true, onlyForCategory: ['AGENT_SALARY'] },
      { name: 'PeriodMonth', label: 'UI_SALARY_MONTH', type: 'month', required: true, onlyForCategory: ['AGENT_SALARY'] },
      remarks,
    ],
    columns: [
      { name: 'CategoryName', label: 'UI_CATEGORY', kind: 'text' },
      { name: 'ExpenseDate', label: 'UI_DATE', kind: 'date' },
      { name: 'Amount', label: 'UI_AMOUNT', kind: 'money' },
      { name: 'PayeeName', label: 'UI_AGENT', kind: 'text' },
      { name: 'PeriodMonth', label: 'UI_SALARY_MONTH', kind: 'month' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'agent-pay',
    label: 'UI_AGENT_PAY',
    description: 'UI_AGENT_PAY_DESCRIPTION_2',
    idField: 'BizAgentPayRateID',
    titleField: 'Name',
    canAdd: true,
    canDelete: true,
    sources: ['agent'],
    fields: [
      { name: 'AdminUserID', label: 'UI_AGENT', type: 'select', source: 'agent', required: true, fixedOnEdit: true },
      { name: 'EffectiveMonth', label: 'UI_EFFECTIVE_MONTH', type: 'month', required: true, hint: 'UI_EFFECTIVE_MONTH_HINT' },
      { name: 'FixedMonthly', label: 'UI_FIXED_MONTHLY', type: 'money' },
      { name: 'CommissionPct', label: 'UI_COMMISSION_PCT', type: 'rate', hint: 'UI_COMMISSION_PCT_HINT' },
      remarks,
    ],
    columns: [
      { name: 'Name', label: 'UI_NAME', kind: 'text' },
      { name: 'Username', label: 'UI_USERNAME', kind: 'text' },
      { name: 'EffectiveMonth', label: 'UI_EFFECTIVE_MONTH', kind: 'month' },
      { name: 'FixedMonthly', label: 'UI_FIXED_MONTHLY', kind: 'money' },
      { name: 'CommissionPct', label: 'UI_COMMISSION_PCT', kind: 'percent' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'investor',
    label: 'UI_INVESTORS',
    description: 'UI_INVESTORS_DESCRIPTION',
    idField: 'BizInvestorID',
    titleField: 'Name',
    canAdd: true,
    canDelete: true,
    sources: [],
    fields: [
      { name: 'Name', label: 'UI_NAME', type: 'text', required: true },
      { name: 'ContactNo', label: 'UI_CONTACT_NUMBER', type: 'text' },
      { name: 'Email', label: 'UI_EMAIL', type: 'text' },
      remarks,
    ],
    columns: [
      { name: 'Name', label: 'UI_NAME', kind: 'text' },
      { name: 'ContactNo', label: 'UI_CONTACT_NUMBER', kind: 'text' },
      { name: 'OpenContracts', label: 'UI_OPEN_CONTRACTS', kind: 'number' },
      { name: 'Invested', label: 'UI_INVESTED', kind: 'money' },
      { name: 'DueAtMaturity', label: 'UI_DUE_AT_MATURITY', kind: 'money' },
      { name: 'NextMaturity', label: 'UI_NEXT_MATURITY', kind: 'date' },
      { name: 'PastMaturity', label: 'UI_PAST_MATURITY', kind: 'number' },
    ],
  },
  {
    key: 'cbf',
    label: 'UI_CBF_CONTRACTS',
    description: 'UI_CBF_CONTRACTS_DESCRIPTION',
    idField: 'BizCbfID',
    titleField: 'InvestorName',
    canAdd: true,
    canDelete: true,
    sources: ['investor'],
    fields: [
      { name: 'BizInvestorID', label: 'UI_INVESTOR', type: 'select', source: 'investor', required: true },
      { name: 'ContractNo', label: 'UI_CONTRACT_NUMBER', type: 'text' },
      { name: 'StartDate', label: 'UI_START_DATE', type: 'date', required: true },
      { name: 'Amount', label: 'UI_AMOUNT_INVESTED', type: 'money', required: true },
      { name: 'MonthlyRate', label: 'UI_MONTHLY_RATE', type: 'rate', hint: 'UI_CBF_RATE_HINT' },
      { name: 'LockInMonths', label: 'UI_LOCK_IN_MONTHS', type: 'int', hint: 'UI_CBF_LOCK_IN_HINT' },
      { name: 'InvestorBearsLoss', label: 'UI_INVESTOR_BEARS_LOSS', type: 'checkbox', hint: 'UI_INVESTOR_BEARS_LOSS_HINT' },
      { name: 'EarlyInterest', label: 'UI_EARLY_INTEREST', type: 'checkbox', hint: 'UI_EARLY_INTEREST_HINT' },
      remarks,
    ],
    columns: [
      { name: 'InvestorName', label: 'UI_INVESTOR', kind: 'text' },
      { name: 'ContractNo', label: 'UI_CONTRACT_NUMBER', kind: 'text' },
      { name: 'StartDate', label: 'UI_START_DATE', kind: 'date' },
      { name: 'Amount', label: 'UI_AMOUNT_INVESTED', kind: 'money' },
      { name: 'MonthlyRate', label: 'UI_MONTHLY_RATE', kind: 'percent' },
      { name: 'MaturityDate', label: 'UI_MATURITY_DATE', kind: 'date' },
      { name: 'Status', label: 'UI_STATUS', kind: 'cbfStatus' },
      { name: 'Backed', label: 'UI_BACKED_BY_LOANS', kind: 'money' },
      { name: 'Unbacked', label: 'UI_NOT_BACKED_YET', kind: 'money' },
      { name: 'LoansAtRisk', label: 'UI_LOANS_OVERDUE', kind: 'number' },
      { name: 'DueAtMaturity', label: 'UI_DUE_AT_MATURITY', kind: 'money' },
      { name: 'PayoutDate', label: 'UI_PAYOUT_DATE', kind: 'date' },
      { name: 'PayoutAmount', label: 'UI_PAYOUT_AMOUNT', kind: 'money' },
    ],
  },
  {
    key: 'cbf-loan',
    label: 'UI_CBF_LOANS',
    description: 'UI_CBF_LOANS_DESCRIPTION',
    idField: 'BizCbfLoanID',
    titleField: 'ClientName',
    canAdd: true,
    canDelete: true,
    removeWording: true,
    sources: ['cbf', 'cbfLoan'],
    fields: [
      { name: 'BizCbfID', label: 'UI_CBF_CONTRACT', type: 'select', source: 'cbf', required: true, fixedOnEdit: true },
      { name: 'FinancingInformationID', label: 'UI_LOAN_NUMBER', type: 'select', source: 'cbfLoan', required: true, fixedOnEdit: true,
        picker: ['UI_LOAN_NUMBER', 'UI_CLIENT', 'UI_AVAILABLE', 'UI_GRADE', 'UI_SUGGESTED_MAX'] },
      { name: 'Amount', label: 'UI_AMOUNT', type: 'money', required: true, hint: 'UI_CBF_LOAN_AMOUNT_HINT' },
      { name: 'AddedDate', label: 'UI_DATE_ADDED', type: 'date', required: true, fixedOnEdit: true },
      remarks,
    ],
    columns: [
      { name: 'ContractName', label: 'UI_CBF_CONTRACT', kind: 'text' },
      { name: 'LoanNo', label: 'UI_LOAN_NUMBER', kind: 'text' },
      { name: 'ClientName', label: 'UI_CLIENT', kind: 'text' },
      { name: 'Amount', label: 'UI_AMOUNT', kind: 'money' },
      { name: 'IsOverdue', label: 'UI_PAYMENTS', kind: 'risk' },
      { name: 'LoanBalance', label: 'UI_LOAN_PRINCIPAL_LEFT', kind: 'money' },
      { name: 'AddedDate', label: 'UI_DATE_ADDED', kind: 'date' },
      { name: 'RemovedDate', label: 'UI_DATE_REMOVED', kind: 'date' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'cbf-payout',
    label: 'UI_CBF_PAYOUTS',
    description: 'UI_CBF_PAYOUTS_DESCRIPTION',
    idField: 'BizCbfID',
    titleField: 'InvestorName',
    canAdd: false,
    canDelete: false,
    editLabel: 'UI_RECORD_PAYOUT',
    sources: [],
    fields: [
      { name: 'PayoutDate', label: 'UI_PAYOUT_DATE', type: 'date', hint: 'UI_CBF_PAYOUT_DATE_HINT' },
      { name: 'PayoutAmount', label: 'UI_PAYOUT_AMOUNT', type: 'money', hint: 'UI_CBF_PAYOUT_AMOUNT_HINT' },
    ],
    columns: [
      { name: 'InvestorName', label: 'UI_INVESTOR', kind: 'text' },
      { name: 'ContractNo', label: 'UI_CONTRACT_NUMBER', kind: 'text' },
      { name: 'Amount', label: 'UI_AMOUNT_INVESTED', kind: 'money' },
      { name: 'MaturityDate', label: 'UI_MATURITY_DATE', kind: 'date' },
      { name: 'Status', label: 'UI_STATUS', kind: 'cbfStatus' },
      { name: 'LossShare', label: 'UI_INVESTOR_LOSS_SHARE', kind: 'money' },
      { name: 'DueAtMaturity', label: 'UI_DUE_AT_MATURITY', kind: 'money' },
      { name: 'PayoutToday', label: 'UI_PAYOUT_TODAY', kind: 'money' },
      { name: 'PayoutDate', label: 'UI_PAYOUT_DATE', kind: 'date' },
      { name: 'PayoutAmount', label: 'UI_PAYOUT_AMOUNT', kind: 'money' },
    ],
  },
  {
    key: 'cash-count',
    label: 'UI_CASH_COUNTS',
    description: 'UI_CASH_COUNTS_DESCRIPTION',
    idField: 'BizCashCountID',
    titleField: 'CountDate',
    canAdd: true,
    canDelete: true,
    sources: [],
    fields: [
      { name: 'CountDate', label: 'UI_COUNT_DATE', type: 'date', required: true },
      { name: 'Amount', label: 'UI_AMOUNT', type: 'money', required: true },
      { name: 'IsOpening', label: 'UI_OPENING_BALANCE', type: 'checkbox', hint: 'UI_OPENING_BALANCE_HINT' },
      remarks,
    ],
    columns: [
      { name: 'CountDate', label: 'UI_COUNT_DATE', kind: 'date' },
      { name: 'Amount', label: 'UI_AMOUNT', kind: 'money' },
      { name: 'IsOpening', label: 'UI_OPENING_BALANCE', kind: 'opening' },
      { name: 'Remarks', label: 'UI_REMARKS', kind: 'text' },
    ],
  },
  {
    key: 'setting',
    label: 'UI_BUSINESS_SETTINGS',
    description: 'UI_BUSINESS_SETTINGS_DESCRIPTION',
    idField: 'SettingCd',
    titleField: 'Description',
    canAdd: false,
    canDelete: false,
    sources: [],
    fields: [
      { name: 'SettingValue', label: 'UI_VALUE', type: 'rate', required: true, hint: 'UI_SETTING_VALUE_HINT' },
    ],
    columns: [
      { name: 'Description', label: 'UI_DESCRIPTION', kind: 'text' },
      { name: 'SettingValue', label: 'UI_VALUE', kind: 'number' },
    ],
  },
]

export const findBizResource = (key: string) => BIZ_RESOURCES.find(resource => resource.key === key)
