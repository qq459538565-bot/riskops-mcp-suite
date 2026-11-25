import fs from 'node:fs';
import { buildSecRadarPages } from './build-sec-radar-page.mjs';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('Set APIFY_TOKEN env variable to run the daily digest lead-gen flywheel.');
    process.exit(1);
}

// High-attention US liquid / headline tickers get a visibility tie-breaker boost
// while 5-letter OTC/SPAC suffixes (F/Q/W/U/Y) get deprioritized so FinTwit & YT feeds
// consistently spotlight liquid NASDAQ/NYSE stocks real investors actively search.
const OTC_SPAC_SUFFIX = /^[A-Z]{4}[FQWUY]$/;
const HIGH_PROFILE_TICKERS = new Set([
    'AAPL','MSFT','NVDA','AMZN','GOOGL','GOOG','META','TSLA','AVGO','TSM','ORCL','CRM','AMD','NFLX','INTC',
    'PLTR','COIN','MSTR','SMCI','UBER','ABNB','SNOW','DDOG','NET','CRWD','PANW','OKTA','ZS','MDB','SHOP',
    'PYPL','SQ','XYZ','HOOD','SOFI','AFRM','UPST','RIVN','LCID','NIO','XPEV','LI','BABA','PDD','JD','BIDU',
    'GDRX','CRMT','DRVN','WBA','CVS','UNH','LLY','NVO','MRNA','PFE','BA','LMT','RTX','DIS','WBD','PARA',
    'NKE','SBUX','MCD','TGT','WMT','COST','HD','LOW','GM','F','DAL','UAL','AAL','CCL','RCL','NCLH','GME','AMC',
    'JPM','BAC','WFC','C','GS','MS','SCHW','BLK','V','MA','AXP','XOM','CVX','OXY','SLB','BABA','SE','GRAB','NU'
]);

function computeAttentionCompositeScore(item) {
    const ticker = String(item.ticker || '').toUpperCase().trim();
    const baseRisk = Number(item.riskScore || 0);
    const items = item.matchedRiskItems || [];

    let attentionBonus = 0;
    if (!ticker || ticker === 'N/A') {
        attentionBonus -= 40;
    } else if (HIGH_PROFILE_TICKERS.has(ticker)) {
        attentionBonus += 28;
    } else if (/^[A-Z]{1,4}$/.test(ticker)) {
        // Standard NYSE/NASDAQ 1-4 letter ticker
        attentionBonus += 14;
    } else if (OTC_SPAC_SUFFIX.test(ticker)) {
        // 5-letter foreign OTC / bankrupt Q / warrant W / unit U / ADR Y
        attentionBonus -= 18;
    }

    // High-interest forensic items get extra visibility weight
    if (items.includes('1.05')) attentionBonus += 14; // Material Cybersecurity Incident
    if (items.includes('1.03')) attentionBonus += 12; // Bankruptcy / Insolvency
    if (items.includes('4.02')) attentionBonus += 10; // Financial Restatement / Non-Reliance
    if (items.includes('4.01')) attentionBonus += 8;  // Sudden Auditor Resignation
    if (items.includes('5.02') && HIGH_PROFILE_TICKERS.has(ticker)) attentionBonus += 10; // Major-cap exec exit

    // Slight recency preference (newer filing date first)
    const daysOld = item.filingDate
        ? Math.max(0, (Date.now() - new Date(item.filingDate).getTime()) / 86400000)
        : 7;
    const recencyBonus = Math.max(0, 8 - daysOld * 1.2);

    return baseRisk + attentionBonus + recencyBonus;
}

const url = `https://api.apify.com/v2/acts/durative_hairstreak~sec-8k-risk-signals/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        mode: 'market_scan',
        riskItems: ['1.05', '4.01', '4.02', '1.03', '3.01', '5.02'],
        lookbackDays: 10,
        maxResults: 25,
        includeExcerpts: true,
        minRiskScore: 60,
        excerptMaxChars: 350,
    }),
});

if (!res.ok) {
    console.error('Apify call failed:', res.status, await res.text());
    process.exit(1);
}

const rawItems = await res.json();
// Deduplicate by ticker (keep highest risk filing per ticker) then rank by Risk x Market Attention
const dedupMap = new Map();
for (const it of rawItems) {
    const key = (it.ticker || it.companyName || '').toUpperCase();
    if (!key) continue;
    const prev = dedupMap.get(key);
    if (!prev || Number(it.riskScore || 0) > Number(prev.riskScore || 0)) {
        dedupMap.set(key, it);
    }
}

const ranked = [...dedupMap.values()]
    .map(it => ({ ...it, _compositeRank: computeAttentionCompositeScore(it) }))
    .sort((a, b) => b._compositeRank - a._compositeRank);

const items = ranked.slice(0, 5);
const today = new Date().toISOString().slice(0, 10);

const rows = items.map(
    (item) =>
        `| ${item.filingDate} | **${item.ticker || 'N/A'}** (${item.companyName}) | \`${item.riskTrafficLight} ${item.riskScore}/100\` | \`${(item.matchedRiskItems || []).join(', ')}\` | ${(item.detectedRedFlags || []).slice(0, 2).join('; ') || '—'} | [SEC Filing](${item.filingUrl}) |`,
);

const md = `# Live US Public Company SEC 8-K Risk Signals Digest (${today})

> Auto-updated every weekday directly from official US SEC EDGAR disclosures via **[SEC 8-K Risk Signals & Corporate Distress Monitor](https://apify.com/durative_hairstreak/sec-8k-risk-signals)** (Apify Store & Hosted MCP Tool). Ranked by **Forensic Severity × US Liquid Equity Relevance** (prioritizing standard NYSE/NASDAQ tickers & Item 1.05 / 4.02 / 4.01 / 1.03 alerts).

## Latest High-Severity Alerts (Top 5 Free Preview)

| Filing Date | Company | Risk Score | SEC Items | Forensic Red Flags | Source |
| :--- | :--- | :---: | :---: | :--- | :---: |
${rows.join('\n')}

---

## Want Full Market Scans (500+ Filings), Watchlist Audits, or Real-Time Claude/n8n Alerts?

- **Live Auto-Updating Web Dashboard & JSON Feed:** https://qq459538565-bot.github.io/riskops-mcp-suite/sec-8k-radar/
- **Run on Apify Store (Free monthly credits included):** https://apify.com/durative_hairstreak/sec-8k-risk-signals
- **Connect directly to Claude / Cursor via MCP:** \`https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals\`

*Informational public SEC EDGAR filing parser only — not investment, accounting, or legal advice.*
`;

fs.writeFileSync('DAILY_SEC_RISK_DIGEST.md', md, 'utf8');
buildSecRadarPages(process.cwd());
console.log(`Updated DAILY_SEC_RISK_DIGEST.md (scanned ${rawItems.length} -> ranked top ${items.length}: ${items.map(i => i.ticker).join(', ')}) and rebuilt docs/sec-8k-radar/.`);
