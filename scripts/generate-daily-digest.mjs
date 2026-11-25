import fs from 'node:fs';
import { buildSecRadarPages } from './build-sec-radar-page.mjs';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('Set APIFY_TOKEN env variable to run the daily digest lead-gen flywheel.');
    process.exit(1);
}

const url = `https://api.apify.com/v2/acts/durative_hairstreak~sec-8k-risk-signals/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        mode: 'market_scan',
        riskItems: ['1.05', '4.01', '4.02', '1.03', '3.01'],
        lookbackDays: 14,
        maxResults: 5,
        includeExcerpts: true,
        minRiskScore: 65,
        excerptMaxChars: 350,
    }),
});

if (!res.ok) {
    console.error('Apify call failed:', res.status, await res.text());
    process.exit(1);
}

const items = await res.json();
const today = new Date().toISOString().slice(0, 10);

const rows = items.map(
    (item) =>
        `| ${item.filingDate} | **${item.ticker || 'N/A'}** (${item.companyName}) | \`${item.riskTrafficLight} ${item.riskScore}/100\` | \`${(item.matchedRiskItems || []).join(', ')}\` | ${(item.detectedRedFlags || []).slice(0, 2).join('; ') || '—'} | [SEC Filing](${item.filingUrl}) |`,
);

const md = `# Live US Public Company SEC 8-K Risk Signals Digest (${today})

> Auto-updated every weekday directly from official US SEC EDGAR disclosures via **[SEC 8-K Risk Signals & Corporate Distress Monitor](https://apify.com/durative_hairstreak/sec-8k-risk-signals)** (Apify Store & Hosted MCP Tool).

## Latest High-Severity Alerts (Top 5 Free Preview)

| Filing Date | Company | Risk Score | SEC Items | Forensic Red Flags | Source |
| :--- | :--- | :---: | :---: | :--- | :---: |
${rows.join('\n')}

---

## Want Full Market Scans (500+ Filings), Watchlist Audits, or Real-Time Claude/n8n Alerts?

- **Run on Apify Store (Free monthly credits included):** https://apify.com/durative_hairstreak/sec-8k-risk-signals
- **Connect directly to Claude / Cursor via MCP:** \`https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals\`

*Informational public SEC EDGAR filing parser only — not investment, accounting, or legal advice.*
`;

fs.writeFileSync('DAILY_SEC_RISK_DIGEST.md', md, 'utf8');
buildSecRadarPages(process.cwd());
console.log(`Updated DAILY_SEC_RISK_DIGEST.md and live web dashboard docs/sec-8k-radar/ with ${items.length} live signals.`);
