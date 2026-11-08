// Projection of the months ahead, from the latest actual month and the projection settings.
// Money is worked in whole centavos as BigInt, so no float rounding creeps in month after month.
//
// Each month:
//   reserves  = last reserves + emergency fund a month
//   portfolio = (capital - reserves) x target utilization
//   gross     = portfolio x interest %
//   costs     = owner salary + overhead + other + agent fixed pay + commission + bank interest
//   net       = gross - costs; cash flow = net - bank principal
//   capital   = last capital + net - bank principal   (own capital + retained profit + bank debt left)
// Bank amortization follows each open bank loan's schedule: interest is the loan amount x the
// monthly rate (add-on), principal is the rest of the amortization, and the last month clears the balance.
// Investor (CBF) contracts not paid out are paid in their maturity month (or the first month, if past it):
//   interest (payout less the amount invested) is a cost; the amount paid back comes off cash and capital.
// Agent pay follows each agent's rate for that month, so a raise set ahead shows from its month:
//   agent pay = sum of fixed pay + sum of (gross x the agent's share of interest collected) x commission %

type Row = Record<string, string>

const ZERO = BigInt(0)
const ONE = BigInt(1)
const HUNDRED = BigInt(100)
// Percentages carry 5 decimals: 9.72612% is 972612.
const PCT_SCALE = BigInt(100000)

function cents(value: string | undefined): bigint {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec((value ?? '').trim())
  if (!match) return ZERO
  const fraction = (match[3] ?? '').padEnd(3, '0')
  let result = BigInt(match[2]) * HUNDRED + BigInt(fraction.slice(0, 2))
  if (Number(fraction[2]) >= 5) result += ONE
  return match[1] ? -result : result
}

function pct(value: string | undefined): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec((value ?? '').trim())
  if (!match) return ZERO
  return BigInt(match[1]) * PCT_SCALE + BigInt((match[2] ?? '').padEnd(5, '0').slice(0, 5))
}

// amount x percent, rounded to the nearest centavo
function times(amount: bigint, percent: bigint): bigint {
  const scaled = amount * percent
  const divisor = HUNDRED * PCT_SCALE
  const half = divisor / BigInt(2)
  return scaled >= ZERO ? (scaled + half) / divisor : -((-scaled + half) / divisor)
}

const text = (value: bigint) => {
  const negative = value < ZERO
  const abs = negative ? -value : value
  return `${negative ? '-' : ''}${abs / HUNDRED}.${(abs % HUNDRED).toString().padStart(2, '0')}`
}
const pctText = (value: bigint) => `${value / PCT_SCALE}.${(value % PCT_SCALE).toString().padStart(5, '0').slice(0, 2)}`
const max = (a: bigint, b: bigint) => (a > b ? a : b)
const min = (a: bigint, b: bigint) => (a < b ? a : b)

const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthStart = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`

export interface ProjectionInput {
  // Actual months from the monthly report, newest first
  months: Row[]
  agentMonths: Row[]
  settings: Record<string, string>
  bankLoans: Row[]
  // Agents to pay (active ones, and anyone with a rate)
  agents: Row[]
  // Every rate set, deleted ones included
  agentRates: Row[]
  // Investor (CBF) contracts
  contracts: Row[]
}

export interface Assumptions {
  startMonth: string
  monthsAhead: number
  utilizationPct: string
  interestPct: string
  interestFromHistory: boolean
  commissionPct: string
  agentFixed: string
  ownerSalary: string
  overhead: string
  other: string
  emergencyMonthly: string
  openBankLoans: number
  openContracts: number
}

const HISTORY_MONTHS = 3
const MAX_MONTHS = 60

export function project(input: ProjectionInput): { rows: Row[]; assumptions: Assumptions } | null {
  const base = input.months[0]
  if (!base?.MonthStart) return null

  // Interest %: the setting, or the last full months' interest over their portfolio.
  const history = input.months.slice(1, 1 + HISTORY_MONTHS).filter(row => cents(row.Portfolio) > ZERO)
  const historyMonths = history.length > 0 ? history : [base]
  const historyInterest = historyMonths.reduce((sum, row) => sum + cents(row.InterestIncome), ZERO)
  const historyPortfolio = historyMonths.reduce((sum, row) => sum + cents(row.Portfolio), ZERO)
  const settingInterest = pct(input.settings.PROJ_INTEREST_PCT)
  const interestFromHistory = settingInterest === ZERO
  const interestPct = interestFromHistory
    ? (historyPortfolio > ZERO ? historyInterest * HUNDRED * PCT_SCALE / historyPortfolio : ZERO)
    : settingInterest

  // Each agent's share of the interest collected in the same months, and their rates oldest first.
  const historyStarts = new Set(historyMonths.map(row => row.MonthStart))
  const agents = input.agents.map(agent => {
    const id = agent.AdminUserID
    const collected = input.agentMonths
      .filter(row => row.AdminUserID === id && historyStarts.has(row.MonthStart))
      .reduce((sum, row) => sum + cents(row.InterestCollected), ZERO)
    const rates = input.agentRates
      .filter(rate => rate.AdminUserID === id && rate.Deleted !== '1' && rate.EffectiveMonth)
      .map(rate => ({ from: monthIndex(rate.EffectiveMonth), fixed: cents(rate.FixedMonthly), commission: pct(rate.CommissionPct) }))
      .sort((a, b) => a.from - b.from)
    return { collected, rates }
  })

  // Fixed pay and commission for one month, using the rate in force that month (none means 0 and 0).
  const agentPayFor = (month: number, gross: bigint) => {
    let fixed = ZERO
    let commission = ZERO
    for (const agent of agents) {
      const rate = agent.rates.filter(r => r.from <= month).pop()
      if (!rate) continue
      fixed += rate.fixed
      if (historyInterest > ZERO) commission += times(gross * agent.collected / historyInterest, rate.commission)
    }
    return { fixed, commission }
  }
  const ownerSalary = cents(input.settings.PROJ_OWNER_SALARY_AMT)
  const overhead = cents(input.settings.PROJ_OVERHEAD_AMT)
  const other = cents(input.settings.PROJ_OTHER_AMT)
  const emergencyMonthly = cents(input.settings.EMERGENCY_MONTHLY_AMT)
  const utilizationPct = pct(input.settings.PROJ_UTILIZATION_PCT)
  const monthsAhead = Math.min(MAX_MONTHS, Math.max(1, Number(input.settings.PROJ_MONTHS) || 12))

  const loans = input.bankLoans
    .filter(row => row.Deleted !== '1' && row.Closed !== '1' && cents(row.Balance) > ZERO)
    .map(row => ({
      balance: cents(row.Balance),
      interest: times(cents(row.LoanAmount), pct(row.MonthlyRate)),
      amortization: cents(row.MonthlyAmortization),
      firstMonth: monthIndex(row.FirstDueDate ?? ''),
      lastMonth: monthIndex(row.FirstDueDate ?? '') + Number(row.TenureMonths) - 1,
    }))

  const firstMonth = monthIndex(base.MonthStart) + 1
  const contracts = input.contracts
    .filter(row => row.Deleted !== '1' && row.Status !== 'PAID')
    .map(row => {
      const payout = cents(row.DueAtMaturity)
      const amount = cents(row.Amount)
      const principal = min(payout, amount)
      return { month: Math.max(monthIndex(row.MaturityDate ?? ''), firstMonth), amount, principal, interest: payout - principal }
    })

  let capital = cents(base.Capital)
  let reserves = cents(base.Reserves)
  let bankDebt = cents(base.BankDebt)
  let investorDebt = cents(base.InvestorDebt)
  const rows: Row[] = []
  // Shown in the assumptions: the first projected month's agent pay
  let firstAgentFixed = ZERO
  let firstCommissionPct = ZERO

  for (let step = 1; step <= monthsAhead; step++) {
    const month = monthIndex(base.MonthStart) + step

    let bankInterest = ZERO
    let bankPrincipal = ZERO
    for (const loan of loans) {
      if (month < loan.firstMonth || loan.balance <= ZERO) continue
      const principal = month >= loan.lastMonth ? loan.balance : min(loan.balance, max(ZERO, loan.amortization - loan.interest))
      bankInterest += loan.interest
      bankPrincipal += principal
      loan.balance -= principal
    }

    let investorInterest = ZERO
    let investorPrincipal = ZERO
    for (const contract of contracts) {
      if (contract.month !== month) continue
      investorInterest += contract.interest
      investorPrincipal += contract.principal
      investorDebt -= contract.amount
    }

    reserves += emergencyMonthly
    const usable = capital - reserves
    const portfolio = max(ZERO, times(usable, utilizationPct))
    const gross = times(portfolio, interestPct)
    const agentPay = agentPayFor(month, gross)
    const agentSalary = agentPay.fixed + agentPay.commission
    if (step === 1) {
      firstAgentFixed = agentPay.fixed
      firstCommissionPct = gross > ZERO ? agentPay.commission * HUNDRED * PCT_SCALE / gross : ZERO
    }
    const totalCosts = ownerSalary + overhead + other + agentSalary + bankInterest + investorInterest
    const netProfit = gross - totalCosts
    const netCash = netProfit - bankPrincipal - investorPrincipal

    rows.push({
      MonthStart: monthStart(month),
      Capital: text(capital),
      Portfolio: text(portfolio),
      UtilizationPct: usable > ZERO ? pctText(portfolio * HUNDRED * PCT_SCALE / usable) : '',
      InterestIncome: text(gross),
      IncomePct: pctText(interestPct),
      OwnerSalary: text(ownerSalary),
      AgentSalary: text(agentSalary),
      Overhead: text(overhead),
      OtherCost: text(other),
      BankInterest: text(bankInterest),
      InvestorInterest: text(investorInterest),
      TotalCosts: text(totalCosts),
      NetProfit: text(netProfit),
      BankPrincipal: text(bankPrincipal),
      InvestorPrincipal: text(investorPrincipal),
      NetCashFlow: text(netCash),
      Reserves: text(reserves),
      BankDebt: text(max(ZERO, bankDebt - bankPrincipal)),
      InvestorDebt: text(max(ZERO, investorDebt)),
    })

    bankDebt = max(ZERO, bankDebt - bankPrincipal)
    capital += netProfit - bankPrincipal - investorPrincipal
  }

  return {
    rows,
    assumptions: {
      startMonth: base.MonthStart,
      monthsAhead,
      utilizationPct: pctText(utilizationPct),
      interestPct: pctText(interestPct),
      interestFromHistory,
      commissionPct: pctText(firstCommissionPct),
      agentFixed: text(firstAgentFixed),
      ownerSalary: text(ownerSalary),
      overhead: text(overhead),
      other: text(other),
      emergencyMonthly: text(emergencyMonthly),
      openBankLoans: loans.length,
      openContracts: contracts.length,
    },
  }
}
