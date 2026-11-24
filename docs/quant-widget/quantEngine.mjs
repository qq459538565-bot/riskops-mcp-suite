/**
 * QuantCalc-JS — Pure Deterministic Financial Mathematics Engine (Zero Dependencies)
 * Educational & analytical calculation engine for DCF valuation, portfolio risk,
 * Kelly sizing, and cashflow IRR / amortization. Not investment advice.
 */

const round = (n, d = 2) => {
  const f = 10 ** d;
  return Math.round((Number(n) + Number.EPSILON) * f) / f;
};

/**
 * 1. Two-Stage DCF Valuation + 5x5 Sensitivity Matrix + Bull/Base/Bear Scenarios
 */
export function calculateDcf({
  freeCashFlow = 1000,
  growthRate = 0.12,
  wacc = 0.095,
  terminalGrowth = 0.03,
  years = 5,
  netDebt = 0,
  shares = 100,
  currentPrice = 0,
} = {}) {
  if (wacc <= terminalGrowth) {
    throw new Error('WACC must be strictly greater than terminal growth rate (g).');
  }
  if (shares <= 0 || years < 1) {
    throw new Error('Shares and projection years must be positive.');
  }

  function runSingle(g, r, tg) {
    let pvCashFlows = 0;
    let fcf = freeCashFlow;
    const projections = [];
    for (let t = 1; t <= years; t++) {
      fcf = fcf * (1 + g);
      const pv = fcf / (1 + r) ** t;
      pvCashFlows += pv;
      projections.push({ year: t, fcf: round(fcf, 2), pv: round(pv, 2) });
    }
    const terminalFcf = fcf * (1 + tg);
    const terminalValue = terminalFcf / (r - tg);
    const pvTerminal = terminalValue / (1 + r) ** years;
    const enterpriseValue = pvCashFlows + pvTerminal;
    const equityValue = enterpriseValue - netDebt;
    const intrinsicPerShare = equityValue / shares;
    return {
      projections,
      pvCashFlows: round(pvCashFlows, 2),
      pvTerminal: round(pvTerminal, 2),
      terminalWeightPct: round((pvTerminal / Math.max(enterpriseValue, 1e-9)) * 100, 1),
      enterpriseValue: round(enterpriseValue, 2),
      equityValue: round(equityValue, 2),
      intrinsicPerShare: round(intrinsicPerShare, 2),
    };
  }

  const base = runSingle(growthRate, wacc, terminalGrowth);
  const bull = runSingle(growthRate + 0.03, Math.max(wacc - 0.01, terminalGrowth + 0.015), Math.min(terminalGrowth + 0.005, wacc - 0.015));
  const bear = runSingle(Math.max(growthRate - 0.04, -0.1), wacc + 0.015, Math.max(terminalGrowth - 0.005, 0));

  const waccSteps = [-0.02, -0.01, 0, 0.01, 0.02].map((d) => round(wacc + d, 4));
  const tgSteps = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => round(Math.max(terminalGrowth + d, 0), 4));

  const sensitivityMatrix = waccSteps.map((r) => ({
    wacc: r,
    cells: tgSteps.map((tg) => ({
      terminalGrowth: tg,
      intrinsicPerShare: r > tg + 0.002 ? runSingle(growthRate, r, tg).intrinsicPerShare : null,
    })),
  }));

  const marginOfSafetyPct =
    currentPrice > 0 ? round(((base.intrinsicPerShare - currentPrice) / base.intrinsicPerShare) * 100, 1) : null;

  return {
    assumptions: { freeCashFlow, growthRate, wacc, terminalGrowth, years, netDebt, shares, currentPrice },
    base,
    scenarios: {
      bear: { intrinsicPerShare: bear.intrinsicPerShare, equityValue: bear.equityValue },
      base: { intrinsicPerShare: base.intrinsicPerShare, equityValue: base.equityValue },
      bull: { intrinsicPerShare: bull.intrinsicPerShare, equityValue: bull.equityValue },
    },
    marginOfSafetyPct,
    waccSteps,
    tgSteps,
    sensitivityMatrix,
  };
}

/**
 * 2. Portfolio Risk Analytics (CAGR, Volatility, Sharpe, Sortino, Max Drawdown, 95% VaR & CVaR)
 */
export function calculatePortfolioRisk({
  returns = [],
  periodsPerYear = 12,
  riskFreeAnnual = 0.04,
} = {}) {
  const clean = returns.map(Number).filter(Number.isFinite);
  if (clean.length < 2) {
    throw new Error('Provide at least 2 periodic returns (e.g., 0.02 for +2%).');
  }
  const n = clean.length;
  const mean = clean.reduce((a, b) => a + b, 0) / n;
  const variance = clean.reduce((a, r) => a + (r - mean) ** 2, 0) / (n - 1);
  const stdPeriod = Math.sqrt(variance);
  const annVol = stdPeriod * Math.sqrt(periodsPerYear);

  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  for (const r of clean) {
    equity *= 1 + r;
    if (equity > peak) peak = equity;
    const dd = (equity - peak) / peak;
    if (dd < maxDrawdown) maxDrawdown = dd;
  }

  const totalReturn = equity - 1;
  const years = n / periodsPerYear;
  const cagr = equity > 0 ? equity ** (1 / Math.max(years, 1e-6)) - 1 : -1;

  const rfPeriod = riskFreeAnnual / periodsPerYear;
  const sharpe = stdPeriod > 0 ? ((mean - rfPeriod) / stdPeriod) * Math.sqrt(periodsPerYear) : 0;

  const downsideSq = clean.reduce((a, r) => a + Math.min(0, r - rfPeriod) ** 2, 0) / n;
  const downsideDev = Math.sqrt(downsideSq);
  const sortino = downsideDev > 0 ? ((mean - rfPeriod) / downsideDev) * Math.sqrt(periodsPerYear) : 0;

  const sorted = [...clean].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor(0.05 * sorted.length));
  const var95 = sorted[idx];
  const tail = sorted.slice(0, Math.max(1, idx + 1));
  const cvar95 = tail.reduce((a, b) => a + b, 0) / tail.length;
  const calmar = maxDrawdown < 0 ? cagr / Math.abs(maxDrawdown) : 0;

  return {
    observations: n,
    totalReturnPct: round(totalReturn * 100, 2),
    cagrPct: round(cagr * 100, 2),
    annualizedVolatilityPct: round(annVol * 100, 2),
    sharpeRatio: round(sharpe, 2),
    sortinoRatio: round(sortino, 2),
    calmarRatio: round(calmar, 2),
    maxDrawdownPct: round(maxDrawdown * 100, 2),
    historicalVar95Pct: round(var95 * 100, 2),
    historicalCvar95Pct: round(cvar95 * 100, 2),
  };
}

/**
 * 3. Kelly Criterion Position Sizing & Expected Value
 */
export function calculateKelly({ winRate = 0.55, rewardRiskRatio = 1.8, capital = 100000 } = {}) {
  if (winRate <= 0 || winRate >= 1 || rewardRiskRatio <= 0) {
    throw new Error('Win rate must be between 0 and 1, and reward/risk ratio must be positive.');
  }
  const q = 1 - winRate;
  const fullKelly = winRate - q / rewardRiskRatio;
  const expectedValueR = winRate * rewardRiskRatio - q;
  const clampedFull = Math.max(0, fullKelly);

  return {
    hasPositiveEdge: fullKelly > 0,
    expectedValuePerUnitRisk: round(expectedValueR, 3),
    fullKellyPct: round(clampedFull * 100, 2),
    halfKellyPct: round((clampedFull / 2) * 100, 2),
    quarterKellyPct: round((clampedFull / 4) * 100, 2),
    suggestedHalfKellyAllocation: round((clampedFull / 2) * capital, 2),
    suggestedQuarterKellyAllocation: round((clampedFull / 4) * capital, 2),
  };
}

/**
 * 4. Loan Amortization & Periodic IRR Solver
 */
export function calculateLoan({ principal = 300000, annualRate = 0.06, years = 30 } = {}) {
  if (principal <= 0 || years <= 0 || annualRate < 0) {
    throw new Error('Principal and years must be positive, rate non-negative.');
  }
  const n = Math.round(years * 12);
  const r = annualRate / 12;
  const monthlyPayment = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const totalPaid = monthlyPayment * n;
  const totalInterest = totalPaid - principal;
  return {
    months: n,
    monthlyPayment: round(monthlyPayment, 2),
    totalPaid: round(totalPaid, 2),
    totalInterest: round(totalInterest, 2),
    interestToPrincipalPct: round((totalInterest / principal) * 100, 1),
  };
}

export function calculateIrr(cashflows = [-1000, 300, 420, 680]) {
  const cfs = cashflows.map(Number).filter(Number.isFinite);
  if (cfs.length < 2) throw new Error('At least 2 cashflows required.');
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < cfs.length; t++) {
      const denom = (1 + rate) ** t;
      npv += cfs[t] / denom;
      if (t > 0) dNpv -= (t * cfs[t]) / (1 + rate) ** (t + 1);
    }
    if (Math.abs(npv) < 1e-7) return round(rate * 100, 2);
    if (Math.abs(dNpv) < 1e-9) break;
    rate = rate - npv / dNpv;
    if (rate <= -0.99) rate = -0.95;
  }
  return round(rate * 100, 2);
}
