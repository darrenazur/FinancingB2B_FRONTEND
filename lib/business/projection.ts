// Projection of the months ahead, from the latest actual month and the projection settings.
// Money is worked in whole centavos as BigInt, so no float rounding creeps in month after month.
//
// Each month (accrual, like the owner's sheet: a loan earns from the month after it is released):
//   reserves  = last reserves + emergency fund a month
//   booked    = this month's portfolio less principal due from this month on (past-due principal stays, earning nothing)
//   new       = (capital - reserves) x target utilization - booked, never below 0
//   portfolio = booked + new
//   gross     = interest due this month on booked loans + last month's new lending x interest %
//               (the first month has no new lending from the month before: those loans are already booked)
//   interest % = the setting; 0 = the active loans' contract rate; no active loans = last 3 months collected
//   costs     = owner salary + overhead + other + agent fixed pay + commission + bank interest
//   net       = gross - costs; cash flow = net - bank principal
//   capital   = last capital + net - bank principal   (own capital + retained profit + bank debt left)
// Bank amortization follows each open bank loan's schedule: interest is the loan amount x the
// monthly rate (add-on), principal is the rest of the amortization, and the last month clears the balance.
// Investor (CBF) contracts not paid out are paid in their maturity month (or the first month, if past it):
//   interest (payout less the amount invested) is a cost; the amount paid back comes off cash and capital.
// Agent pay follows each agent's rate for that month, so a raise set ahead shows from its month:
//   agent pay = sum of fixed pay + sum of (gross x the agent's share of interest collected) x commission %
// Quota: the gross profit at which net cash flow reaches the target (PROJ_TARGET_CASHFLOW_AMT, 0 = break-even):
//   quota  = (owner salary + overhead + other + agent fixed pay + bank interest + investor interest
//             + bank principal + investor principal + target) ÷ (1 − agent commission share)
//   short  = quota − gross, never below 0; extra loans = short ÷ interest %, released the month before
//   status = MET (nothing short), STRETCH (extra loans fit in the capital not lent out), SHORT (they don't)
//
// What-ifs (the Simulation page only; without them every number above is the same):
//   money in  = cash put in + new investor money + new bank loans, at the start of its month, so it is lent that month
//   new CBF   = paid back at the end of its term: the amount + amount x rate x months as investor interest
//   new bank  = add-on, from the month after: amount ÷ months principal + amount x rate interest; fees are a cost that month
//   releases  = the month's new lending ÷ average loan term in months (loans run past a month, so not all of it is released anew)
//   fee       = fee % x releases, or (releases ÷ average loan size, rounded up) x fee per loan; income that month
//   pay       = owner pay from a month on; a real agent's new rate from a month on; a new agent: fixed + commission
//               on gross ÷ agents paid that month
//   emergency = the emergency fund a month from a month on (the setting before); set aside, so not lent, not a cost
//   bank put in reserve = part of a new bank loan set aside in the funds that month, so not lent
//   funds out = taken from the funds at the start of the month, so it can be lent; capital stays the same
//   loss      = (default loss % a month + the bad month's loss %) of the loans still out (booked, their schedule from now on, last month's new lending), gone for good
//   drop      = drop % of what is due that month comes in the month after; that principal stays lent, earning nothing
//   net       = gross + fees - costs - bank fees - loss; cash flow leaves the loss out (no cash moves when a loan is lost)

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
// a ÷ b rounded up (a ≥ 0, b > 0): a quota never falls a centavo short
const ceilDiv = (a: bigint, b: bigint) => (a + b - ONE) / b
// ₱1,000,000 in centavos: the agent commission on it gives the commission share of each peso
const PROBE = BigInt(100000000)

const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthStart = (index: number) => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`

export interface ProjectionInput {
  // Actual months from the monthly report, newest first
  months: Row[]
  // Loans already booked, per due month: principal still to collect and interest due
  schedule: Row[]
  // Monthly % of active loans, weighted by amount ('' when none)
  contractRatePct: string
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
  interestSource: 'setting' | 'loans' | 'history'
  commissionPct: string
  agentFixed: string
  ownerSalary: string
  overhead: string
  other: string
  emergencyMonthly: string
  openBankLoans: number
  openContracts: number
  targetCashFlow: string
}

// What-ifs for the Simulation page. Months are YYYY-MM; money and percentages are text, like the settings. Nothing is saved.
export interface WhatIf {
  // Months to show instead of the setting (0 = the setting)
  monthsAhead: number
  // Processing fee: PCT = feePct % of each loan; AMT = feeAmt per loan, loans counted as releases ÷ avgLoan ('' = none)
  feeType: 'PCT' | 'AMT'
  feePct: string
  feeAmt: string
  avgLoan: string
  // Average loan term in months, like 1.5: releases a month = new lending ÷ this ('' = 1)
  termMonths: string
  // Interest a month % on new lending ('' = the projection's rate)
  interestPct: string
  // Default loss % every month, on top of any bad month ('' = none)
  monthlyLossPct: string
  cash: { month: string; amount: string }[]
  // Taken from the emergency fund or the amortization backup into money that can be lent
  funds: { month: string; amount: string }[]
  cbf: { month: string; amount: string; ratePct: string; months: number }[]
  // reserve: the part set aside in the funds, not lent
  bank: { month: string; amount: string; ratePct: string; months: number; fees: string; reserve: string }[]
  // Emergency fund a month from a month on
  emergency: { month: string; amount: string }[]
  risks: { month: string; dropPct: string; lossPct: string }[]
  // Pay from a month on: who = OWNER, a real agent's AdminUserID, or NEW-n for a new agent
  pay: { who: string; month: string; fixed: string; commissionPct: string }[]
}

const HISTORY_MONTHS = 3
const MAX_MONTHS = 60
const ALL = HUNDRED * PCT_SCALE

// Only the fields project() reads, so no borrower, investor or agent names reach the browser.
const pick = (rows: Row[], names: string[]) => rows.map(row => Object.fromEntries(names.map(name => [name, row[name] ?? ''])))
const SETTINGS = ['PROJ_INTEREST_PCT', 'PROJ_OWNER_SALARY_AMT', 'PROJ_OVERHEAD_AMT', 'PROJ_OTHER_AMT', 'PROJ_TARGET_CASHFLOW_AMT',
  'EMERGENCY_MONTHLY_AMT', 'PROJ_UTILIZATION_PCT', 'PROJ_MONTHS']
export function projectionFields(input: ProjectionInput): ProjectionInput {
  return {
    months: pick(input.months.slice(0, 1 + HISTORY_MONTHS), ['MonthStart', 'Portfolio', 'InterestIncome', 'Capital', 'Reserves', 'BankDebt', 'InvestorDebt']),
    schedule: pick(input.schedule, ['MonthStart', 'PrincipalDue', 'InterestDue']),
    contractRatePct: input.contractRatePct,
    agentMonths: pick(input.agentMonths, ['AdminUserID', 'MonthStart', 'InterestCollected']),
    settings: Object.fromEntries(SETTINGS.map(code => [code, input.settings[code] ?? ''])),
    bankLoans: pick(input.bankLoans, ['Deleted', 'Closed', 'Balance', 'LoanAmount', 'MonthlyRate', 'MonthlyAmortization', 'FirstDueDate', 'TenureMonths']),
    agents: pick(input.agents, ['AdminUserID']),
    agentRates: pick(input.agentRates, ['AdminUserID', 'Deleted', 'EffectiveMonth', 'FixedMonthly', 'CommissionPct']),
    contracts: pick(input.contracts, ['Deleted', 'Status', 'DueAtMaturity', 'Amount', 'MaturityDate']),
  }
}

export function project(input: ProjectionInput, whatIf?: WhatIf): { rows: Row[]; assumptions: Assumptions } | null {
  const base = input.months[0]
  if (!base?.MonthStart) return null

  // Interest %: the setting, or the last full months' interest over their portfolio.
  const history = input.months.slice(1, 1 + HISTORY_MONTHS).filter(row => cents(row.Portfolio) > ZERO)
  const historyMonths = history.length > 0 ? history : [base]
  const historyInterest = historyMonths.reduce((sum, row) => sum + cents(row.InterestIncome), ZERO)
  const historyPortfolio = historyMonths.reduce((sum, row) => sum + cents(row.Portfolio), ZERO)
  const settingInterest = pct(input.settings.PROJ_INTEREST_PCT)
  const contractInterest = pct(input.contractRatePct)
  const interestSource = settingInterest > ZERO ? 'setting' : contractInterest > ZERO ? 'loans' : 'history'
  const projectedInterest = interestSource === 'setting' ? settingInterest
    : interestSource === 'loans' ? contractInterest
    : (historyPortfolio > ZERO ? historyInterest * HUNDRED * PCT_SCALE / historyPortfolio : ZERO)
  // A what-if rate applies to new lending only: booked loans keep the interest on their schedule
  const interestPct = pct(whatIf?.interestPct) > ZERO ? pct(whatIf?.interestPct) : projectedInterest

  // Booked loans per due month (index), from the base month on
  const baseMonth = monthIndex(base.MonthStart)
  const scheduled = new Map<number, { principal: bigint; interest: bigint }>()
  for (const row of input.schedule) {
    const month = monthIndex(row.MonthStart ?? '')
    if (month < baseMonth) continue
    scheduled.set(month, { principal: cents(row.PrincipalDue), interest: cents(row.InterestDue) })
  }
  // Principal due in the base month is taken as collected in it
  let booked = cents(base.Portfolio) - (scheduled.get(baseMonth)?.principal ?? ZERO)
  let lastNew = ZERO

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
    return { id, collected, rates, shared: false }
  })

  // What-if pay. A real agent's new rate joins their rates (the what-if wins in the same month);
  // a new agent has no history, so their commission is on an equal share of gross among the agents paid that month.
  const ownerChanges: { from: number; amount: bigint }[] = []
  for (const item of whatIf?.pay ?? []) {
    const from = monthIndex(`${item.month}-01`)
    if (item.who === 'OWNER') {
      ownerChanges.push({ from, amount: cents(item.fixed) })
      continue
    }
    let agent = agents.find(a => a.id === item.who)
    if (!agent) agents.push(agent = { id: item.who, collected: ZERO, rates: [], shared: true })
    agent.rates.push({ from, fixed: cents(item.fixed), commission: pct(item.commissionPct) })
    agent.rates.sort((a, b) => a.from - b.from)
  }
  ownerChanges.sort((a, b) => a.from - b.from)

  // Fixed pay and commission for one month, using the rate in force that month (none means 0 and 0).
  const agentPayFor = (month: number, gross: bigint) => {
    let fixed = ZERO
    let commission = ZERO
    const paid = agents.filter(agent => agent.rates.some(r => r.from <= month)).length
    for (const agent of agents) {
      const rate = agent.rates.filter(r => r.from <= month).pop()
      if (!rate) continue
      fixed += rate.fixed
      if (agent.shared) commission += times(gross / BigInt(paid), rate.commission)
      else if (historyInterest > ZERO) commission += times(gross * agent.collected / historyInterest, rate.commission)
    }
    return { fixed, commission }
  }
  const ownerSalary = cents(input.settings.PROJ_OWNER_SALARY_AMT)
  // Owner pay for one month: the latest what-if change in force, else the setting
  const ownerFor = (month: number) => ownerChanges.filter(change => change.from <= month).pop()?.amount ?? ownerSalary
  const overhead = cents(input.settings.PROJ_OVERHEAD_AMT)
  const other = cents(input.settings.PROJ_OTHER_AMT)
  const targetCash = cents(input.settings.PROJ_TARGET_CASHFLOW_AMT)
  const emergencyMonthly = cents(input.settings.EMERGENCY_MONTHLY_AMT)
  // Emergency fund for one month: the latest what-if change in force, else the setting
  const emergencyChanges = (whatIf?.emergency ?? []).map(item => ({ from: monthIndex(`${item.month}-01`), amount: cents(item.amount) }))
    .sort((a, b) => a.from - b.from)
  const emergencyFor = (month: number) => emergencyChanges.filter(change => change.from <= month).pop()?.amount ?? emergencyMonthly
  const utilizationPct = pct(input.settings.PROJ_UTILIZATION_PCT)
  const monthsAhead = Math.min(MAX_MONTHS, Math.max(1, whatIf?.monthsAhead || Number(input.settings.PROJ_MONTHS) || 12))

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
  const openBankLoans = loans.length
  const openContracts = contracts.length

  // What-ifs, by month: money in, new bank loans and contracts, and bad months
  const ym = (value: string) => monthIndex(`${value}-01`)
  const term = (months: number) => Math.max(1, Math.floor(months) || 1)
  const feeByLoan = whatIf?.feeType === 'AMT'
  const feePct = pct(whatIf?.feePct)
  const feeAmt = cents(whatIf?.feeAmt)
  const avgLoan = cents(whatIf?.avgLoan)
  const termMonths = pct(whatIf?.termMonths) || PCT_SCALE
  const moneyIn = new Map<number, { cash: bigint; investor: bigint; bank: bigint; bankFees: bigint; funds: bigint; reserve: bigint }>()
  const inOf = (month: number) => {
    let entry = moneyIn.get(month)
    if (!entry) moneyIn.set(month, entry = { cash: ZERO, investor: ZERO, bank: ZERO, bankFees: ZERO, funds: ZERO, reserve: ZERO })
    return entry
  }
  for (const item of whatIf?.cash ?? []) inOf(ym(item.month)).cash += cents(item.amount)
  for (const item of whatIf?.funds ?? []) inOf(ym(item.month)).funds += cents(item.amount)
  for (const item of whatIf?.cbf ?? []) {
    const amount = cents(item.amount)
    const months = term(item.months)
    inOf(ym(item.month)).investor += amount
    contracts.push({ month: ym(item.month) + months, amount, principal: amount, interest: times(amount, pct(item.ratePct) * BigInt(months)) })
  }
  for (const item of whatIf?.bank ?? []) {
    const amount = cents(item.amount)
    const months = term(item.months)
    const interest = times(amount, pct(item.ratePct))
    const entry = inOf(ym(item.month))
    entry.bank += amount
    entry.bankFees += cents(item.fees)
    entry.reserve += min(amount, cents(item.reserve))
    loans.push({ balance: amount, interest, amortization: amount / BigInt(months) + interest, firstMonth: ym(item.month) + 1, lastMonth: ym(item.month) + months })
  }
  const risks = new Map<number, { drop: bigint; loss: bigint }>()
  for (const item of whatIf?.risks ?? []) {
    const month = ym(item.month)
    const risk = risks.get(month) ?? { drop: ZERO, loss: ZERO }
    risks.set(month, { drop: min(ALL, risk.drop + pct(item.dropPct)), loss: min(ALL, risk.loss + pct(item.lossPct)) })
  }
  const monthlyLossPct = min(ALL, pct(whatIf?.monthlyLossPct))
  // The share of the booked schedule still to come after losses (100% until one)
  let survive = ALL
  let lateInterest = ZERO
  let latePrincipal = ZERO

  let capital = cents(base.Capital)
  let reserves = cents(base.Reserves)
  let bankDebt = cents(base.BankDebt)
  let investorDebt = cents(base.InvestorDebt)
  let prevPortfolio = cents(base.Portfolio)
  const rows: Row[] = []
  // Shown in the assumptions: the first projected month's agent pay
  let firstAgentFixed = ZERO
  let firstCommissionPct = ZERO

  for (let step = 1; step <= monthsAhead; step++) {
    const month = monthIndex(base.MonthStart) + step

    // What-if money comes in at the start of the month; bank fees are a cost below
    const extra = moneyIn.get(month)
    const moneyInTotal = extra ? extra.cash + extra.investor + extra.bank : ZERO
    const bankFees = extra?.bankFees ?? ZERO
    capital += moneyInTotal
    bankDebt += extra?.bank ?? ZERO
    investorDebt += extra?.investor ?? ZERO

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

    const emergency = emergencyFor(month)
    const bankReserve = extra?.reserve ?? ZERO
    reserves += emergency + bankReserve
    // Funds taken out (never more than the funds hold) can be lent; capital stays the same
    const fundsOut = min(max(ZERO, reserves), extra?.funds ?? ZERO)
    reserves -= fundsOut
    const usable = capital - reserves
    // A loss (the default loss every month + a bad month's) comes off the loans still out, and off their schedule from this month on
    const risk = risks.get(month)
    const lossPct = min(ALL, (risk?.loss ?? ZERO) + monthlyLossPct)
    let riskLoss = ZERO
    if (lossPct > ZERO) {
      const lostBooked = times(booked, lossPct)
      const lostNew = times(lastNew, lossPct)
      booked -= lostBooked
      lastNew -= lostNew
      riskLoss = lostBooked + lostNew
      survive -= times(survive, lossPct)
    }
    const due = scheduled.get(month)
    const duePrincipal = due ? times(due.principal, survive) : ZERO
    const interestDue = (due ? times(due.interest, survive) : ZERO) + times(lastNew, interestPct)
    // A drop in collection: that share comes in next month instead
    const missedPrincipal = risk ? times(duePrincipal, risk.drop) : ZERO
    const missedInterest = risk ? times(interestDue, risk.drop) : ZERO
    booked = max(ZERO, booked - (duePrincipal - missedPrincipal) - latePrincipal)
    const newLending = max(ZERO, times(usable, utilizationPct) - booked)
    const portfolio = booked + newLending
    const gross = interestDue - missedInterest + lateInterest
    const lateCollected = latePrincipal + lateInterest
    latePrincipal = missedPrincipal
    lateInterest = missedInterest
    const releases = newLending * PCT_SCALE / termMonths
    const loansReleased = feeByLoan && avgLoan > ZERO ? ceilDiv(releases, avgLoan) : ZERO
    const fees = feeByLoan ? loansReleased * feeAmt : times(releases, feePct)
    lastNew = newLending
    const agentPay = agentPayFor(month, gross)
    const agentSalary = agentPay.fixed + agentPay.commission
    if (step === 1) {
      firstAgentFixed = agentPay.fixed
      firstCommissionPct = gross > ZERO ? agentPay.commission * HUNDRED * PCT_SCALE / gross : ZERO
    }
    const owner = ownerFor(month)
    const totalCosts = owner + overhead + other + agentSalary + bankInterest + investorInterest + bankFees + riskLoss
    const netProfit = gross + fees - totalCosts
    const netCash = netProfit + riskLoss - bankPrincipal - investorPrincipal
    // Commission grows with gross, so the fixed outflows are divided by what each peso keeps after commission
    const commissionOnProbe = agentPayFor(month, PROBE).commission
    const outflows = max(ZERO, owner + overhead + other + agentPay.fixed + bankInterest + investorInterest
      + bankPrincipal + investorPrincipal + targetCash + bankFees - fees)
    const quota = PROBE > commissionOnProbe ? ceilDiv(outflows * PROBE, PROBE - commissionOnProbe) : ZERO
    const short = max(ZERO, quota - gross)
    const extraLending = interestPct > ZERO ? ceilDiv(short * HUNDRED * PCT_SCALE, interestPct) : ZERO
    const quotaStatus = short === ZERO ? 'MET'
      : interestPct > ZERO && extraLending <= max(ZERO, usable - portfolio) ? 'STRETCH' : 'SHORT'

    rows.push({
      MonthStart: monthStart(month),
      Capital: text(capital),
      Portfolio: text(portfolio),
      UtilizationPct: usable > ZERO ? pctText(portfolio * HUNDRED * PCT_SCALE / usable) : '',
      InterestIncome: text(gross),
      // Gross profit over the portfolio it came from: the month before's (the first month: the base month's)
      IncomePct: prevPortfolio > ZERO ? pctText(gross * HUNDRED * PCT_SCALE / prevPortfolio) : '',
      OwnerSalary: text(owner),
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
      CashQuota: text(quota),
      QuotaShort: text(short),
      ExtraLending: text(extraLending),
      QuotaStatus: quotaStatus,
      Reserves: text(reserves),
      BankDebt: text(max(ZERO, bankDebt - bankPrincipal)),
      InvestorDebt: text(max(ZERO, investorDebt)),
      // What-if columns: 0 without what-ifs
      MoneyIn: text(moneyInTotal),
      FundsOut: text(fundsOut),
      EmergencyIn: text(emergency),
      BankReserve: text(bankReserve),
      Releases: text(releases),
      LoansReleased: String(loansReleased),
      ProcessingFees: text(fees),
      BankFees: text(bankFees),
      RiskLoss: text(riskLoss),
      // The loss % used that month: default loss + the bad month's
      LossPct: pctText(lossPct),
      MissedCollection: text(missedPrincipal + missedInterest),
      LateCollected: text(lateCollected),
    })

    prevPortfolio = portfolio
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
      interestSource,
      commissionPct: pctText(firstCommissionPct),
      agentFixed: text(firstAgentFixed),
      ownerSalary: text(ownerSalary),
      overhead: text(overhead),
      other: text(other),
      emergencyMonthly: text(emergencyMonthly),
      openBankLoans,
      openContracts,
      targetCashFlow: text(targetCash),
    },
  }
}
