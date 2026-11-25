import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates live public GitHub Pages dashboard `docs/sec-8k-radar/index.html`,
 * `docs/sec-8k-radar/latest.json`, and `docs/sec-8k-radar/latest-x-post.txt`
 * directly from `DAILY_SEC_RISK_DIGEST.md` (zero extra API spend).
 */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildSecRadarPages(repoRoot = process.cwd()) {
  const mdPath = path.join(repoRoot, 'DAILY_SEC_RISK_DIGEST.md');
  const md = fs.readFileSync(mdPath, 'utf8');
  const dateMatch = md.match(/\((\d{4}-\d{2}-\d{2})\)/);
  const digestDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

  const items = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.startsWith('| 20')) continue;
    const cols = line.split('|').map(s => s.trim()).filter(Boolean);
    if (cols.length < 6) continue;
    const filingDate = cols[0];
    const companyMatch = cols[1].match(/\*\*([A-Z0-9.-]+)\*\*\s*\(([^)]+)\)/);
    const ticker = companyMatch ? companyMatch[1] : cols[1].replace(/\*/g, '');
    const companyName = companyMatch ? companyMatch[2] : ticker;
    const scoreRaw = cols[2].replace(/`/g, '');
    const scoreMatch = scoreRaw.match(/(\d+)\/100/);
    const riskScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 80;
    const severity = riskScore >= 90 ? 'RED' : 'AMBER';
    const secItems = cols[3].replace(/`/g, '');
    const redFlags = cols[4] === '—' ? 'High-Severity Exchange / Governance Filing Alert' : cols[4];
    const linkMatch = cols[5].match(/\((https?:\/\/[^)]+)\)/);
    const filingUrl = linkMatch ? linkMatch[1] : 'https://www.sec.gov/edgar/searchedgar/companysearch';

    items.push({ filingDate, ticker, companyName, riskScore, severity, secItems, redFlags, filingUrl });
  }

  const prioritized = [...items].sort((a, b) => b.riskScore - a.riskScore);
  const cashtags = prioritized.map(i => `$${i.ticker}`).join(' ');
  const latestFilingDate = items[0]?.filingDate || digestDate;

  const outDir = path.join(repoRoot, 'docs', 'sec-8k-radar');
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, 'latest.json'),
    JSON.stringify({ updatedAt: digestDate, latestFilingDate, cashtags, count: items.length, items: prioritized }, null, 2),
    'utf8'
  );

  const xLines = prioritized.slice(0, 5).map(r => `• $${r.ticker} Item ${r.secItems} [${r.riskScore}/100]`).join('\n');
  const xPost = `🚨 US SEC 8-K Red-Flag Radar (${latestFilingDate})\n\n${xLines}\n\nObjective EDGAR parser (not investment advice). Free daily feed & API in bio.`;
  fs.writeFileSync(path.join(outDir, 'latest-x-post.txt'), xPost, 'utf8');

  const tableRows = prioritized.map(r => `
    <tr>
      <td><strong>${esc(r.filingDate)}</strong></td>
      <td><strong style="color:#fff;font-size:15px;">$${esc(r.ticker)}</strong><br><span style="color:#93a4c3;font-size:12px;">${esc(r.companyName)}</span></td>
      <td><span class="pill ${r.severity}">${r.severity} ${r.riskScore}/100</span></td>
      <td><code>Item ${esc(r.secItems)}</code></td>
      <td>${esc(r.redFlags)}</td>
      <td><a class="link" href="${esc(r.filingUrl)}" target="_blank" rel="noopener">SEC EDGAR ↗</a></td>
    </tr>`).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Live US SEC 8-K Red-Flag Radar (${esc(latestFilingDate)}): ${esc(cashtags)} — RiskOps MCP Lab</title>
  <meta name="description" content="Auto-updated daily US SEC EDGAR Form 8-K forensic alerts (${esc(cashtags)}): Item 4.02 financial restatements, Item 4.01 auditor exits, Item 3.01 delisting notices &amp; Item 1.05 cyber breaches." />
  <link rel="canonical" href="https://qq459538565-bot.github.io/riskops-mcp-suite/sec-8k-radar/" />
  <style>
    :root{--bg:#060b16;--panel:#0e1628;--border:#1f2e4d;--text:#e6edf7;--muted:#93a4c3;--accent:#38bdf8;--green:#10b981;--red:#f43f5e;--amber:#f59e0b;}
    *{box-sizing:border-box;}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;background:radial-gradient(circle at top right,#112240 0%,var(--bg) 52%);color:var(--text);line-height:1.6;}
    .wrap{max-width:1080px;margin:0 auto;padding:24px 20px 64px;}
    header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:24px;}
    .brand{font-weight:800;font-size:17px;color:#fff;text-decoration:none;}
    .nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;}
    .nav a{color:var(--muted);text-decoration:none;font-weight:600;}
    .nav a:hover{color:#fff;}
    .cta{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff!important;text-decoration:none;font-size:13.5px;font-weight:700;}
    .cta-green{background:linear-gradient(135deg,#059669,#10b981);color:#04121c!important;}
    .cta-sec{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;background:#131f38;color:#fff!important;text-decoration:none;font-size:13.5px;font-weight:700;border:1px solid var(--border);}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:18px;}
    .pill{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;}
    .pill.RED{background:rgba(244,63,94,.16);color:#fb7185;border:1px solid rgba(244,63,94,.4);}
    .pill.AMBER{background:rgba(245,158,11,.16);color:#fbbf24;border:1px solid rgba(245,158,11,.4);}
    .pill.LIVE{background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.4);}
    table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:12px;}
    th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--border);vertical-align:top;}
    th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;}
    code{background:#09101f;border:1px solid var(--border);padding:3px 7px;border-radius:6px;font-size:12px;color:#7dd3fc;}
    a.link{color:var(--accent);text-decoration:none;font-weight:600;}
    a.link:hover{text-decoration:underline;}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:16px;}
    .box{background:#09101f;border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;}
    footer{margin-top:32px;border-top:1px solid var(--border);padding-top:16px;color:var(--muted);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  </style>
</head>
<body>
<div class="wrap">
  <header>
    <a class="brand" href="../index.html">RiskOps MCP Lab · SEC 8-K Radar</a>
    <nav class="nav">
      <a href="../index.html">All Tools</a>
      <a href="../reports/yc-2026-security-benchmark.html">YC 1,200 Study</a>
      <a href="https://tradeguard.localledgerstudio.xyz/" target="_blank" rel="noopener">TradeGuard Risk Math</a>
      <a class="cta" data-partner="apify" href="https://apify.com/durative_hairstreak/sec-8k-risk-signals" target="_blank" rel="noopener">Run Bulk SEC 8-K API &rarr;</a>
    </nav>
  </header>

  <section class="card">
    <span class="pill LIVE">AUTO-UPDATED EVERY US TRADING DAY · LAST SYNC ${esc(digestDate)}</span>
    <h1 style="margin:12px 0 10px;font-size:clamp(24px,3.8vw,36px);line-height:1.18;">Live US SEC Form 8-K Forensic Red-Flag Radar</h1>
    <p style="color:var(--muted);font-size:15px;margin:0 0 16px;">Automated public SEC EDGAR scanner tracking <strong>Item 4.02</strong> (Financial Non-Reliance / Restatements), <strong>Item 4.01</strong> (Auditor Resignations), <strong>Item 3.01</strong> (Exchange Delisting Notices), <strong>Item 1.03</strong> (Bankruptcy), and <strong>Item 1.05</strong> (Material Cybersecurity Incidents). Today's highlighted tickers: <code>${esc(cashtags)}</code>.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <a class="cta" data-partner="apify" href="https://apify.com/durative_hairstreak/sec-8k-risk-signals" target="_blank" rel="noopener">Scan 500+ Live Filings / Connect Claude MCP &rarr;</a>
      <a class="cta-green cta" href="https://riskopsradar.substack.com/subscribe" target="_blank" rel="noopener">Get Free Weekly Email Radar &rarr;</a>
      <a class="cta-sec" href="https://tradeguard.localledgerstudio.xyz/" target="_blank" rel="noopener">Free TradeGuard Risk Math</a>
      <a class="cta-sec" href="./latest.json" target="_blank">Raw JSON Feed</a>
    </div>
  </section>

  <section class="card" style="border-color:rgba(16,185,129,0.45);background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(14,22,40,0.96));">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
      <div style="max-width:660px;">
        <span class="pill LIVE">FREE WEEKLY EMAIL RADAR</span>
        <h2 style="margin:10px 0 6px;font-size:20px;">Never Miss a Form 8-K Restatement, Delisting, or Breach Again</h2>
        <p style="color:var(--muted);font-size:13.5px;margin:0;">Every week we send one zero-fluff digest summarizing the highest-severity US SEC 8-K forensic alerts, direct <code>sec.gov</code> filings, and open empirical benchmarks — free on Substack.</p>
      </div>
      <a class="cta cta-green" style="padding:13px 22px;font-size:14.5px;" href="https://riskopsradar.substack.com/subscribe" target="_blank" rel="noopener">Subscribe Free on Substack &rarr;</a>
    </div>
  </section>

  <section class="card">
    <h2 style="margin:0 0 6px;font-size:20px;">Latest High-Severity SEC 8-K Alerts (Free Top-5 Preview)</h2>
    <p style="color:var(--muted);font-size:13.5px;margin:0;">Direct links to official SEC.gov EDGAR filings. Informational public-data parser only — never investment, accounting, or legal advice.</p>
    <div style="overflow-x:auto;">
      <table>
        <thead><tr><th>Filing Date</th><th>Ticker &amp; Company</th><th>Risk Score</th><th>SEC Item</th><th>Detected Forensic Flags</th><th>Official Source</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  </section>

  <section class="card" style="border-color:#0284c7;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
      <h2 style="margin:0;font-size:20px;">Choose Your Path — Built for Both Individual Investors &amp; Developers</h2>
      <span class="pill LIVE">100% VERIFIABLE SEC.GOV LINKS · ZERO HYPE · 14-DAY REFUND ON PRO TOOLS</span>
    </div>
    <p style="color:var(--muted);font-size:13.5px;margin:0 0 14px;">Every filing links straight to official <code>sec.gov</code> EDGAR records so you can verify every signal yourself in 1 click.</p>
    <div class="grid">
      <div class="box" style="border-color:rgba(16,185,129,0.45);">
        <div>
          <span class="pill LIVE" style="margin-bottom:8px;">FOR INVESTORS · $0 TO START</span>
          <strong style="display:block;font-size:16px;color:#fff;">1. Free Weekly Email Alert + TradeGuard Risk Math</strong>
          <p style="color:var(--muted);font-size:13.5px;margin:8px 0 0;">Don't write code? Get one clean weekly SEC 8-K red-flag summary by email, and run free browser-local Average Down &amp; Kelly risk math before buying any sharp dip. <strong style="color:#6ee7b7;">Launch Early-Bird: TradeGuard Pro $19 (one-time, zero subscription, 14-day refund).</strong></p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="cta cta-green" href="https://riskopsradar.substack.com/subscribe" target="_blank" rel="noopener">Free Email Alerts &rarr;</a>
          <a class="cta-sec" href="https://tradeguard.localledgerstudio.xyz/" target="_blank" rel="noopener">Try TradeGuard Free</a>
        </div>
      </div>
      <div class="box" style="border-color:rgba(56,189,248,0.45);">
        <div>
          <span class="pill" style="background:rgba(56,189,248,0.16);color:#7dd3fc;border:1px solid rgba(56,189,248,0.4);margin-bottom:8px;">FOR DEVS &amp; QUANTS · TRY FREE</span>
          <strong style="display:block;font-size:16px;color:#fff;">2. Live Bulk SEC 8-K API &amp; Claude / n8n MCP</strong>
          <p style="color:var(--muted);font-size:13.5px;margin:8px 0 0;">Audit 500+ tickers or stream real-time Item 4.02 / 1.05 / 1.03 alerts into Claude Desktop, Cursor, or n8n. <strong style="color:#7dd3fc;">Zero-risk trial: Apify's free $5/mo tier covers ~400 SEC filing scans — test with your own watchlist before spending $1.</strong></p>
        </div>
        <a class="cta" data-partner="apify" href="https://apify.com/durative_hairstreak/sec-8k-risk-signals" target="_blank" rel="noopener">Test Free (~400 Scans) on Apify &rarr;</a>
      </div>
      <div class="box">
        <div>
          <span class="pill AMBER" style="margin-bottom:8px;">INSTANT DOWNLOAD · LIVE TODAY</span>
          <strong style="display:block;font-size:16px;color:#fff;">3. Embeddable QuantCalc JS Financial Widget ($29)</strong>
          <p style="color:var(--muted);font-size:13.5px;margin:8px 0 0;">Zero-dependency DCF, Kelly Criterion &amp; drawdown-recovery JavaScript widget for fintech blogs, Substack portals &amp; trading apps. Commercial license &amp; instant zip download verified on Codester.</p>
        </div>
        <a class="cta-sec" href="https://www.codester.com/items/76738/quantcalc-js-financial-analysis-widget" target="_blank" rel="noopener">Instant Purchase on Codester ($29) &rarr;</a>
      </div>
    </div>
  </section>

  <footer>
    <span>RiskOps MCP Lab &middot; Automated SEC EDGAR Form 8-K Public Parser (Informational Only)</span>
    <span><a class="link" href="https://x.com/taozhu327757" target="_blank" rel="noopener">Follow Daily Alerts on X (@taozhu327757)</a> &middot; <a class="link" href="../index.html">Back to Suite</a></span>
  </footer>
</div>
<script src="../assets/monetization-config.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`Built live SEC Radar web dashboard: docs/sec-8k-radar/index.html (${items.length} tickers: ${cashtags})`);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  buildSecRadarPages(process.cwd());
}
