import {
  calculateDcf,
  calculateIrr,
  calculateKelly,
  calculateLoan,
  calculatePortfolioRisk,
} from './quantEngine.mjs';

/**
 * Mount a self-contained, responsive QuantCalc-JS widget inside any DOM container.
 * Example: mountQuantWidget(document.getElementById('my-calc'), { currency: '$', defaultTab: 'dcf' })
 */
export function mountQuantWidget(container, config = {}) {
  const { currency = '$', defaultTab = 'dcf', title = 'QuantCalc Financial & Valuation Suite' } = config;

  container.innerHTML = `
  <div class="qc-root">
    <div class="qc-head">
      <div>
        <div class="qc-title">${title}</div>
        <div class="qc-sub">Deterministic Client-Side Engine · Zero Server Latency</div>
      </div>
      <div class="qc-tabs">
        <button class="qc-tab ${defaultTab === 'dcf' ? 'active' : ''}" data-t="dcf">DCF &amp; 5×5 Matrix</button>
        <button class="qc-tab ${defaultTab === 'risk' ? 'active' : ''}" data-t="risk">Portfolio Risk</button>
        <button class="qc-tab ${defaultTab === 'kelly' ? 'active' : ''}" data-t="kelly">Kelly Sizing</button>
        <button class="qc-tab ${defaultTab === 'loan' ? 'active' : ''}" data-t="loan">Loan &amp; IRR</button>
      </div>
    </div>

    <div class="qc-pane ${defaultTab === 'dcf' ? '' : 'qc-hide'}" data-p="dcf">
      <div class="qc-inputs">
        <label>Base FCF (${currency}M)<input id="qc-fcf" type="number" value="1200" step="50" /></label>
        <label>5Y Growth (%)<input id="qc-g" type="number" value="14" step="0.5" /></label>
        <label>WACC (%)<input id="qc-wacc" type="number" value="9.5" step="0.25" /></label>
        <label>Terminal g (%)<input id="qc-tg" type="number" value="3.0" step="0.25" /></label>
        <label>Net Debt (${currency}M)<input id="qc-debt" type="number" value="-500" step="100" /></label>
        <label>Shares (M)<input id="qc-sh" type="number" value="100" step="1" /></label>
        <label>Market Price (${currency})<input id="qc-px" type="number" value="185" step="1" /></label>
      </div>
      <div id="qc-dcf-out"></div>
    </div>

    <div class="qc-pane ${defaultTab === 'risk' ? '' : 'qc-hide'}" data-p="risk">
      <div class="qc-inputs">
        <label style="grid-column:1/-1;">Periodic Returns (comma-separated decimals, e.g. 0.03 = +3%)
          <input id="qc-rets" type="text" value="0.032, -0.018, 0.045, 0.012, -0.061, 0.028, 0.051, -0.022, 0.019, 0.038, -0.014, 0.029" />
        </label>
        <label>Periods / Year<input id="qc-ppy" type="number" value="12" /></label>
        <label>Risk-Free Rate (%)<input id="qc-rf" type="number" value="4.2" step="0.1" /></label>
      </div>
      <div id="qc-risk-out"></div>
    </div>

    <div class="qc-pane ${defaultTab === 'kelly' ? '' : 'qc-hide'}" data-p="kelly">
      <div class="qc-inputs">
        <label>Win Probability (%)<input id="qc-win" type="number" value="56" step="1" /></label>
        <label>Reward / Risk Ratio<input id="qc-rr" type="number" value="1.8" step="0.1" /></label>
        <label>Portfolio Capital (${currency})<input id="qc-cap" type="number" value="100000" step="5000" /></label>
      </div>
      <div id="qc-kelly-out"></div>
    </div>

    <div class="qc-pane ${defaultTab === 'loan' ? '' : 'qc-hide'}" data-p="loan">
      <div class="qc-inputs">
        <label>Loan Principal (${currency})<input id="qc-prin" type="number" value="350000" step="10000" /></label>
        <label>Annual Rate (%)<input id="qc-rate" type="number" value="6.25" step="0.125" /></label>
        <label>Term (Years)<input id="qc-yrs" type="number" value="30" step="1" /></label>
        <label style="grid-column:1/-1;">Cashflows for IRR (t0, t1, t2...)<input id="qc-cfs" type="text" value="-10000, 3200, 4100, 5800" /></label>
      </div>
      <div id="qc-loan-out"></div>
    </div>
    <div class="qc-note">Analytical &amp; educational mathematical calculator only — not personalized financial or investment advice.</div>
  </div>`;

  const q = (sel) => container.querySelector(sel);

  function renderDcf() {
    try {
      const res = calculateDcf({
        freeCashFlow: parseFloat(q('#qc-fcf').value),
        growthRate: parseFloat(q('#qc-g').value) / 100,
        wacc: parseFloat(q('#qc-wacc').value) / 100,
        terminalGrowth: parseFloat(q('#qc-tg').value) / 100,
        netDebt: parseFloat(q('#qc-debt').value),
        shares: parseFloat(q('#qc-sh').value),
        currentPrice: parseFloat(q('#qc-px').value),
      });
      const mos = res.marginOfSafetyPct;
      const headCols = res.tgSteps.map((tg) => `<th>g=${(tg * 100).toFixed(1)}%</th>`).join('');
      const rows = res.sensitivityMatrix
        .map(
          (row) =>
            `<tr><th>WACC ${(row.wacc * 100).toFixed(1)}%</th>${row.cells
              .map((c) => {
                const isBase = Math.abs(row.wacc - res.assumptions.wacc) < 1e-4 && Math.abs(c.terminalGrowth - res.assumptions.terminalGrowth) < 1e-4;
                return `<td class="${isBase ? 'qc-hl' : ''}">${c.intrinsicPerShare !== null ? `${currency}${c.intrinsicPerShare.toFixed(2)}` : '—'}</td>`;
              })
              .join('')}</tr>`
        )
        .join('');
      q('#qc-dcf-out').innerHTML = `
        <div class="qc-cards">
          <div class="qc-card"><div class="k">Bear Case</div><div class="v">${currency}${res.scenarios.bear.intrinsicPerShare}</div></div>
          <div class="qc-card qc-accent"><div class="k">Base Intrinsic Value</div><div class="v">${currency}${res.scenarios.base.intrinsicPerShare}</div></div>
          <div class="qc-card"><div class="k">Bull Case</div><div class="v">${currency}${res.scenarios.bull.intrinsicPerShare}</div></div>
          <div class="qc-card"><div class="k">Margin of Safety</div><div class="v" style="color:${mos >= 0 ? '#34d399' : '#f87171'}">${mos !== null ? `${mos > 0 ? '+' : ''}${mos}%` : '—'}</div></div>
        </div>
        <div class="qc-tbl-wrap"><table class="qc-tbl"><thead><tr><th>WACC \\ Term g</th>${headCols}</tr></thead><tbody>${rows}</tbody></table></div>`;
    } catch (e) {
      q('#qc-dcf-out').innerHTML = `<div class="qc-err">${e.message}</div>`;
    }
  }

  function renderRisk() {
    try {
      const returns = q('#qc-rets').value.split(/[\s,;]+/).filter(Boolean).map(Number);
      const res = calculatePortfolioRisk({
        returns,
        periodsPerYear: parseFloat(q('#qc-ppy').value),
        riskFreeAnnual: parseFloat(q('#qc-rf').value) / 100,
      });
      q('#qc-risk-out').innerHTML = `
        <div class="qc-cards">
          <div class="qc-card qc-accent"><div class="k">Sharpe Ratio</div><div class="v">${res.sharpeRatio}</div></div>
          <div class="qc-card"><div class="k">Sortino Ratio</div><div class="v">${res.sortinoRatio}</div></div>
          <div class="qc-card"><div class="k">CAGR</div><div class="v">${res.cagrPct}%</div></div>
          <div class="qc-card"><div class="k">Max Drawdown</div><div class="v" style="color:#f87171">${res.maxDrawdownPct}%</div></div>
          <div class="qc-card"><div class="k">Ann. Volatility</div><div class="v">${res.annualizedVolatilityPct}%</div></div>
          <div class="qc-card"><div class="k">95% VaR / CVaR</div><div class="v">${res.historicalVar95Pct}% / ${res.historicalCvar95Pct}%</div></div>
        </div>`;
    } catch (e) {
      q('#qc-risk-out').innerHTML = `<div class="qc-err">${e.message}</div>`;
    }
  }

  function renderKelly() {
    try {
      const res = calculateKelly({
        winRate: parseFloat(q('#qc-win').value) / 100,
        rewardRiskRatio: parseFloat(q('#qc-rr').value),
        capital: parseFloat(q('#qc-cap').value),
      });
      q('#qc-kelly-out').innerHTML = `
        <div class="qc-cards">
          <div class="qc-card"><div class="k">Expected Edge / R</div><div class="v" style="color:${res.hasPositiveEdge ? '#34d399' : '#f87171'}">${res.expectedValuePerUnitRisk}R</div></div>
          <div class="qc-card"><div class="k">Full Kelly</div><div class="v">${res.fullKellyPct}%</div></div>
          <div class="qc-card qc-accent"><div class="k">Half-Kelly (Recommended)</div><div class="v">${res.halfKellyPct}% (${currency}${res.suggestedHalfKellyAllocation.toLocaleString()})</div></div>
          <div class="qc-card"><div class="k">Quarter-Kelly</div><div class="v">${res.quarterKellyPct}% (${currency}${res.suggestedQuarterKellyAllocation.toLocaleString()})</div></div>
        </div>`;
    } catch (e) {
      q('#qc-kelly-out').innerHTML = `<div class="qc-err">${e.message}</div>`;
    }
  }

  function renderLoan() {
    try {
      const loan = calculateLoan({
        principal: parseFloat(q('#qc-prin').value),
        annualRate: parseFloat(q('#qc-rate').value) / 100,
        years: parseFloat(q('#qc-yrs').value),
      });
      const irr = calculateIrr(q('#qc-cfs').value.split(/[\s,;]+/).filter(Boolean).map(Number));
      q('#qc-loan-out').innerHTML = `
        <div class="qc-cards">
          <div class="qc-card qc-accent"><div class="k">Monthly Payment</div><div class="v">${currency}${loan.monthlyPayment.toLocaleString()}</div></div>
          <div class="qc-card"><div class="k">Total Interest</div><div class="v">${currency}${loan.totalInterest.toLocaleString()}</div></div>
          <div class="qc-card"><div class="k">Total Repaid</div><div class="v">${currency}${loan.totalPaid.toLocaleString()}</div></div>
          <div class="qc-card"><div class="k">Cashflow IRR</div><div class="v" style="color:#34d399">${irr}%</div></div>
        </div>`;
    } catch (e) {
      q('#qc-loan-out').innerHTML = `<div class="qc-err">${e.message}</div>`;
    }
  }

  container.querySelectorAll('.qc-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.qc-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.getAttribute('data-t');
      container.querySelectorAll('.qc-pane').forEach((p) => p.classList.toggle('qc-hide', p.getAttribute('data-p') !== t));
    });
  });

  ['#qc-fcf', '#qc-g', '#qc-wacc', '#qc-tg', '#qc-debt', '#qc-sh', '#qc-px'].forEach((id) => q(id).addEventListener('input', renderDcf));
  ['#qc-rets', '#qc-ppy', '#qc-rf'].forEach((id) => q(id).addEventListener('input', renderRisk));
  ['#qc-win', '#qc-rr', '#qc-cap'].forEach((id) => q(id).addEventListener('input', renderKelly));
  ['#qc-prin', '#qc-rate', '#qc-yrs', '#qc-cfs'].forEach((id) => q(id).addEventListener('input', renderLoan));

  renderDcf();
  renderRisk();
  renderKelly();
  renderLoan();
}
