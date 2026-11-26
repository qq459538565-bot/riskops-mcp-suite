import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://qq459538565-bot.github.io/riskops-mcp-suite';
const DOCS_DIR = path.resolve('docs');
const SNAPSHOT_PATH = path.join(DOCS_DIR, 'vendors', 'snapshot.json');
const REPORTS_DIR = path.join(DOCS_DIR, 'reports');
const EXT_DIR = path.join(DOCS_DIR, 'extension');

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const records = snap.records || [];
const auditedDate = (snap.generatedAt || new Date().toISOString()).slice(0, 10);

const total = records.length;
const avgScore = (records.reduce((acc, r) => acc + Number(r.score || 0), 0) / Math.max(total, 1)).toFixed(1);
const dmarcReject = records.filter((r) => (r.dmarcPolicy || '').toLowerCase() === 'reject').length;
const dmarcQuarantine = records.filter((r) => (r.dmarcPolicy || '').toLowerCase() === 'quarantine').length;
const dmarcWeak = total - dmarcReject;
const caaCount = records.filter((r) => r.caaPresent).length;
const spfStrictCount = records.filter((r) => r.spfStrict).length;

const grcCounts = {};
const emailCounts = {};
const catMap = {};

for (const r of records) {
  const g = r.grcPlatform || 'None Detected via DNS';
  grcCounts[g] = (grcCounts[g] || 0) + 1;
  const e = r.emailProvider || 'Other';
  emailCounts[e] = (emailCounts[e] || 0) + 1;
  if (!catMap[r.category]) {
    catMap[r.category] = { category: r.category, count: 0, sumScore: 0, reject: 0, caa: 0, trustDetected: 0 };
  }
  const c = catMap[r.category];
  c.count++;
  c.sumScore += Number(r.score || 0);
  if ((r.dmarcPolicy || '').toLowerCase() === 'reject') c.reject++;
  if (r.caaPresent) c.caa++;
  if (g !== 'None Detected via DNS') c.trustDetected++;
}

const categories = Object.values(catMap)
  .map((c) => ({
    ...c,
    avgScore: (c.sumScore / c.count).toFixed(1),
    rejectPct: ((c.reject / c.count) * 100).toFixed(1),
    caaPct: ((c.caa / c.count) * 100).toFixed(1),
    trustPct: ((c.trustDetected / c.count) * 100).toFixed(1),
  }))
  .sort((a, b) => Number(b.rejectPct) - Number(a.rejectPct));

const aiCat = categories.find((c) => c.category === 'AI & LLM') || { count: 0, reject: 0, rejectPct: '0.0', caaPct: '0.0' };
const finCat = categories.find((c) => c.category === 'Fintech & HR') || { count: 0, reject: 0, rejectPct: '0.0', caaPct: '0.0' };
const secCat = categories.find((c) => c.category === 'Security & GRC') || { count: 0, reject: 0, rejectPct: '0.0', caaPct: '0.0' };

const vantaCount = grcCounts['Vanta'] || 0;
const safebaseDrataCount = (grcCounts['SafeBase (Drata)'] || 0) + (grcCounts['Drata'] || 0);
const customTrustCount = grcCounts['Custom / Self-Hosted Trust Subdomain'] || 0;
const noTrustCount = grcCounts['None Detected via DNS'] || 0;
const withTrustCount = total - noTrustCount;
const googleMxCount = emailCounts['Google Workspace'] || 0;
const proofpointCount = emailCounts['Proofpoint Enterprise'] || 0;

const pct = (n, d = total) => ((n / Math.max(d, 1)) * 100).toFixed(1);

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(EXT_DIR, { recursive: true });

// 1) Open downloadable CSV dataset (high-value GEO/research backlink magnet)
const csvHeaders = [
  'Company',
  'Domain',
  'Category',
  'Score_0_100',
  'Grade',
  'DMARC_Policy',
  'SPF_Present',
  'SPF_Strict_Hardfail',
  'CAA_Present',
  'GRC_Trust_Platform',
  'Trust_Subdomain',
  'Email_Provider',
  'Audited_Date',
  'Live_Audit_URL',
];
const csvRows = [
  csvHeaders.join(','),
  ...records.map((r) =>
    [
      r.name,
      r.domain,
      r.category,
      r.score,
      r.grade,
      r.dmarcPolicy,
      r.spfPresent,
      r.spfStrict,
      r.caaPresent,
      r.grcPlatform,
      r.trustSubdomain || '',
      r.emailProvider,
      r.auditedAt || auditedDate,
      `${BASE_URL}/vendor/${r.slug}.html`,
    ]
      .map(csvCell)
      .join(',')
  ),
];
fs.writeFileSync(path.join(REPORTS_DIR, 'saas-security-benchmark-2026.csv'), csvRows.join('\n') + '\n', 'utf8');

// 2) Original GEO/AEO Flagship Benchmark Report HTML
const SHARED_CSS = `
:root{--bg:#070b14;--panel:#0e1628;--panel2:#131f38;--border:#1f2e4d;--text:#e6edf7;--muted:#93a4c3;--accent:#38bdf8;--green:#10b981;--amber:#f59e0b;--red:#ef4444;}
*{box-sizing:border-box;}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;background:radial-gradient(circle at top right,#112240 0%,var(--bg) 55%);color:var(--text);line-height:1.65;}
.wrap{max-width:1100px;margin:0 auto;padding:24px 20px 64px;}
header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:26px;}
.brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px;color:#fff;text-decoration:none;}
.badge{font-size:11px;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.15);color:#7dd3fc;border:1px solid rgba(56,189,248,.35);font-weight:700;}
nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;}
nav a{color:var(--muted);text-decoration:none;font-weight:600;}
nav a:hover{color:#fff;}
.card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:18px;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px;}
.stat{background:#09101f;border:1px solid var(--border);border-radius:12px;padding:16px;}
.stat .k{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);}
.stat .v{font-size:28px;font-weight:800;margin:4px 0;}
.stat .sub{font-size:12.5px;color:var(--muted);}
.pill{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;}
.pill.GREEN{background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.35);}
.pill.AMBER{background:rgba(245,158,11,.16);color:#fbbf24;border:1px solid rgba(245,158,11,.35);}
.pill.CYAN{background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.35);}
.cta{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff!important;text-decoration:none;font-size:13.5px;font-weight:700;}
.cta-green{background:linear-gradient(135deg,#059669,#10b981);}
.cta-sec{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;background:var(--panel2);color:#fff!important;text-decoration:none;font-size:13.5px;font-weight:600;border:1px solid var(--border);}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:12px;}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--border);}
th{color:var(--muted);font-size:11.5px;text-transform:uppercase;}
.bar-wrap{width:100%;height:8px;background:#09101f;border-radius:999px;overflow:hidden;border:1px solid var(--border);margin-top:5px;}
.bar{height:100%;background:linear-gradient(90deg,#06b6d4,#10b981);}
a.link{color:var(--accent);text-decoration:none;}
a.link:hover{text-decoration:underline;}
.disclosure{font-size:12px;color:var(--muted);border-left:3px solid var(--border);padding-left:10px;margin-top:14px;}
footer{margin-top:34px;border-top:1px solid var(--border);padding-top:18px;color:var(--muted);font-size:12.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;}
`;

const reportJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Dataset',
      name: `2026 State of SaaS & AI Vendor DNS Security & Trust Center Benchmark (${total} Vendors)`,
      description: `Live DNS-over-HTTPS security posture dataset auditing ${total} top AI, Cloud, Fintech, Security, and Productivity SaaS vendors across DMARC enforcement, SPF strictness, CAA records, Trust Center platforms (Vanta, SafeBase, Drata, Conveyor), and enterprise email providers. Updated weekly.`,
      url: `${BASE_URL}/reports/state-of-saas-security-2026.html`,
      dateModified: auditedDate,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      creator: { '@type': 'Organization', name: 'RiskOps MCP Lab', url: BASE_URL },
      distribution: [
        { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${BASE_URL}/reports/saas-security-benchmark-2026.csv` },
        { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${BASE_URL}/vendors/snapshot.json` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What percentage of leading AI & LLM SaaS vendors enforce strict DMARC p=reject in 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `In RiskOps MCP Lab's live DNS-over-HTTPS audit of ${total} leading SaaS companies (${auditedDate}), only ${aiCat.reject} of ${aiCat.count} (${aiCat.rejectPct}%) leading AI & LLM vendors enforce strict DMARC p=reject, compared to ${finCat.reject} of ${finCat.count} (${finCat.rejectPct}%) Fintech & HR leaders.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Which Trust Center GRC platform has the highest DNS-verified market share among top SaaS vendors in 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Across ${total} audited SaaS leaders, ${withTrustCount} (${pct(withTrustCount)}%) expose a public DNS trust subdomain. Vanta leads with ${vantaCount} vendors (${pct(vantaCount)}% of all ${total}, or ${pct(vantaCount, withTrustCount)}% of detected Trust Centers), followed by SafeBase/Drata with ${safebaseDrataCount} vendors (${pct(safebaseDrataCount)}%) and Custom/Self-Hosted portals with ${customTrustCount} (${pct(customTrustCount)}%).`,
          },
        },
        {
          '@type': 'Question',
          name: 'How often is the 112-SaaS DNS security benchmark refreshed?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An automated GitHub Actions pipeline re-queries public Cloudflare DNS-over-HTTPS records for all 112 domains every Sunday at 04:00 UTC and publishes updated JSON and CSV datasets without paywalls.',
          },
        },
      ],
    },
  ],
};

const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>2026 State of SaaS &amp; AI Vendor DNS Security &amp; Trust Center Benchmark (${total} Vendors Live Audit)</title>
  <meta name="description" content="Original live DNS-over-HTTPS benchmark of ${total} leading AI, Cloud, Fintech &amp; Security SaaS companies (${auditedDate}). ${finCat.rejectPct}% of Fintech vs only ${aiCat.rejectPct}% of AI vendors enforce DMARC p=reject. Free CSV &amp; JSON dataset." />
  <link rel="canonical" href="${BASE_URL}/reports/state-of-saas-security-2026.html" />
  <script type="application/ld+json">${JSON.stringify(reportJsonLd)}</script>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="../index.html">RiskOps MCP Lab <span class="badge">Live Open Research · ${auditedDate}</span></a>
      <nav>
        <a href="../vendors/index.html">112 SaaS Directory</a>
        <a href="../vendors/compare.html">Side-by-Side Compare</a>
        <a href="../extension/index.html">Chrome/Edge Extension</a>
        <a href="../bank-converter/index.html">LocalLedger PDF→CSV</a>
        <a href="../templates/index.html">n8n Templates</a>
      </nav>
    </header>

    <section class="card">
      <span class="pill CYAN">Original Primary Benchmark · Updated Weekly via Public DoH</span>
      <h1 style="margin:12px 0 8px;font-size:clamp(26px,3.8vw,38px);line-height:1.18;">2026 State of SaaS &amp; AI Vendor Security: ${finCat.rejectPct}% of Fintech Leaders Enforce DMARC Reject — Only ${aiCat.rejectPct}% of Top AI Companies Do</h1>
      <p style="color:var(--muted);font-size:15.5px;max-width:860px;">
        We continuously audit public DNS-over-HTTPS records (<code>DMARC</code>, <code>SPF</code>, <code>CAA</code>, <code>MX</code>, and <code>trust.* / security.*</code> CNAMEs) across <strong>${total} leading B2B SaaS &amp; AI vendors</strong>. Every metric below is reproducible, unpaywalled, and refreshed every Sunday at 04:00 UTC.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <a class="cta" href="./saas-security-benchmark-2026.csv" download>Download Full CSV Dataset (${total} Rows) &darr;</a>
        <a class="cta-sec" href="../vendors/snapshot.json" target="_blank">Open Raw JSON API</a>
        <a class="cta-green cta" href="../extension/index.html">Install 1-Click Chrome/Edge Inspector &rarr;</a>
      </div>

      <div class="grid">
        <div class="stat">
          <div class="k">AI &amp; LLM DMARC p=reject</div>
          <div class="v" style="color:var(--amber);">${aiCat.rejectPct}%</div>
          <div class="sub">${aiCat.reject} of ${aiCat.count} top AI vendors (vs ${finCat.rejectPct}% in Fintech)</div>
        </div>
        <div class="stat">
          <div class="k">Overall Strict DMARC</div>
          <div class="v" style="color:var(--accent);">${pct(dmarcReject)}%</div>
          <div class="sub">${dmarcReject}/${total} reject · ${dmarcQuarantine} quarantine · ${total - dmarcReject - dmarcQuarantine} none/missing</div>
        </div>
        <div class="stat">
          <div class="k">Vanta vs SafeBase/Drata</div>
          <div class="v" style="color:var(--green);">${vantaCount} vs ${safebaseDrataCount}</div>
          <div class="sub">${withTrustCount}/${total} (${pct(withTrustCount)}%) expose a public Trust Center subdomain</div>
        </div>
        <div class="stat">
          <div class="k">DNS CAA Adoption</div>
          <div class="v">${pct(caaCount)}%</div>
          <div class="sub">Only ${caaCount}/${total} lock down SSL certificate issuance (${secCat.caaPct}% in Security!)</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:20px;">1. Category Breakdown: The AI Security Maturity Gap</h2>
      <p style="color:var(--muted);font-size:14px;">Fintech &amp; HR vendors lead every email anti-spoofing benchmark, while hyper-growth AI infrastructure companies trail behind on strict <code>p=reject</code> DMARC enforcement despite handling sensitive enterprise prompts.</p>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr><th>SaaS Sector</th><th>Vendors</th><th>Avg Score</th><th>DMARC p=reject</th><th>DNS CAA Present</th><th>Public Trust Center</th></tr>
          </thead>
          <tbody>
            ${categories
              .map(
                (c) => `<tr>
              <td><strong>${escHtml(c.category)}</strong></td>
              <td>${c.count}</td>
              <td><strong>${c.avgScore}</strong> / 100</td>
              <td>${c.reject}/${c.count} (<strong>${c.rejectPct}%</strong>)<div class="bar-wrap"><div class="bar" style="width:${c.rejectPct}%"></div></div></td>
              <td>${c.caa}/${c.count} (${c.caaPct}%)</td>
              <td>${c.trustDetected}/${c.count} (${c.trustPct}%)</td>
            </tr>`
              )
              .join('\n')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:20px;">1B. Full 24 AI &amp; LLM Companies Breakdown (Reproducible via <code>dig TXT _dmarc.&lt;domain&gt;</code>)</h2>
      <p style="color:var(--muted);font-size:14px;">Every single record below is verifiable from any terminal using <code>dig +short TXT _dmarc.huggingface.co</code> or <code>dig +short TXT _dmarc.cursor.com</code>. Out of 24 leading AI vendors audited on ${auditedDate}, <strong>${aiCat.reject} enforce strict <code>p=reject</code></strong> while <strong>${aiCat.count - aiCat.reject} sit at <code>p=quarantine</code> or <code>p=none</code></strong>:</p>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>AI Vendor</th><th>Domain</th><th>Score</th><th>DMARC Policy</th><th>SPF Strict (-all)</th><th>DNS CAA</th><th>Trust Center (DNS CNAME)</th></tr></thead>
          <tbody>
            ${records
              .filter((r) => r.category === 'AI & LLM')
              .sort((a, b) => a.score - b.score)
              .map(
                (r) => `<tr>
              <td><a class="link" href="../vendor/${escHtml(r.slug)}.html"><strong>${escHtml(r.name)}</strong></a></td>
              <td><code>${escHtml(r.domain)}</code></td>
              <td><strong>${r.score}</strong> (${escHtml(r.grade)})</td>
              <td><span class="pill ${r.dmarcPolicy === 'reject' ? 'GREEN' : 'AMBER'}">p=${escHtml(r.dmarcPolicy)}</span></td>
              <td>${r.spfStrict ? 'Yes (-all)' : 'Soft (~all)'}</td>
              <td>${r.caaPresent ? 'Yes' : 'No'}</td>
              <td>${escHtml(r.grcPlatform)}</td>
            </tr>`
              )
              .join('\n')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:20px;">2. Trust Center GRC Market Share &amp; Email Stack Concentration</h2>
      <div class="grid">
        <div class="stat">
          <div class="k">Vanta (DNS CNAME Verified)</div>
          <div class="v">${pct(vantaCount)}%</div>
          <div class="sub">${vantaCount} companies · <a class="link" href="../vendors/vanta-customers.html">View Vanta list &rarr;</a></div>
        </div>
        <div class="stat">
          <div class="k">SafeBase &amp; Drata</div>
          <div class="v">${pct(safebaseDrataCount)}%</div>
          <div class="sub">${safebaseDrataCount} companies · <a class="link" href="../vendors/safebase-drata-customers.html">View list &rarr;</a></div>
        </div>
        <div class="stat">
          <div class="k">Custom / Self-Hosted Trust</div>
          <div class="v">${pct(customTrustCount)}%</div>
          <div class="sub">${customTrustCount} enterprise portals (Stripe, Okta, GitHub, etc.)</div>
        </div>
        <div class="stat">
          <div class="k">Google Workspace MX Dominance</div>
          <div class="v">${pct(googleMxCount)}%</div>
          <div class="sub">${googleMxCount}/${total} Google Workspace · ${proofpointCount} Proofpoint · ${emailCounts['Microsoft 365'] || 0} M365</div>
        </div>
      </div>
      <p style="color:var(--muted);font-size:14px;margin-top:14px;">
        <strong>Key Takeaway for RevOps &amp; Security Teams:</strong> ${noTrustCount} of ${total} (${pct(noTrustCount)}%) leading vendors still have no detectable public DNS trust subdomain, and ${dmarcWeak} of ${total} (${pct(dmarcWeak)}%) have not enforced strict <code>DMARC p=reject</code> (<a class="link" href="../vendors/dmarc-security-gaps.html">view full DMARC gap directory &rarr;</a>). Only ${spfStrictCount}/${total} (${pct(spfStrictCount)}%) enforce strict SPF hard-fail (<code>-all</code>).
      </p>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:20px;">3. Audit Any Prospect Live or Automate Weekly Vendor Monitoring</h2>
      <div class="grid">
        <div class="stat">
          <span class="pill GREEN">Free Local-First Tool</span>
          <h3 style="margin:10px 0 6px;font-size:16px;">VendorSec 1-Click Browser Extension</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 12px;">Inspect DMARC, SPF, CAA, Vanta/Drata Trust Center &amp; page tech stack on any company site in 2 seconds. 100% browser-local.</p>
          <a class="cta" href="../extension/index.html">Get Chrome / Edge Extension &rarr;</a>
        </div>
        <div class="stat">
          <span class="pill CYAN">Hosted AI Agent MCP</span>
          <h3 style="margin:10px 0 6px;font-size:16px;">Automate Bulk Audits in Claude / n8n</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 12px;">Run our zero-proxy Apify MCP servers inside Claude Desktop, Cursor, Clay, or Make.com for continuous vendor TPRM.</p>
          <a class="cta-sec" data-partner="apify" href="https://apify.com/durative_hairstreak" target="_blank" rel="noopener">Open Apify MCP Suite &rarr;</a>
        </div>
        <div class="stat">
          <span class="pill AMBER">Compliance Stack</span>
          <h3 style="margin:10px 0 6px;font-size:16px;">Launching a Public Trust Center?</h3>
          <p style="font-size:13px;color:var(--muted);margin:0 0 12px;">See how Vanta leads ${pct(vantaCount, withTrustCount)}% of detected SaaS Trust Centers and connect automated compliance alerts via Make.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a class="cta-sec" data-partner="vanta" href="https://www.vanta.com/" target="_blank" rel="noopener">Explore Vanta</a>
            <a class="cta-sec" data-partner="make" href="https://www.make.com/" target="_blank" rel="noopener">Explore Make.com</a>
          </div>
        </div>
      </div>
      <div class="disclosure">
        <strong>Methodology &amp; Transparency:</strong> All metrics come from public DNS records resolved via Cloudflare DoH on ${auditedDate}. Some outbound partner links may earn a referral commission at zero extra cost to you; rankings and scores are 100% deterministic and never influenced by sponsorships.
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:19px;">4. How to Cite This Dataset (Human &amp; AI Agents)</h2>
      <pre style="background:#09101f;border:1px solid var(--border);border-radius:10px;padding:14px;overflow-x:auto;font-size:12.5px;color:#cbd5e1;">RiskOps MCP Lab (${auditedDate.slice(0, 4)}). "2026 State of SaaS &amp; AI Vendor DNS Security Benchmark (${total} Vendors)."
Live Report: ${BASE_URL}/reports/state-of-saas-security-2026.html
Open CSV:    ${BASE_URL}/reports/saas-security-benchmark-2026.csv
Open JSON:   ${BASE_URL}/vendors/snapshot.json
Agent Card:  ${BASE_URL}/.well-known/agent-card.json</pre>
    </section>

    <footer>
      <span>RiskOps MCP Lab · Open Security Benchmark (CC BY 4.0)</span>
      <span><a class="link" href="../llms-full.txt">llms-full.txt</a> · <a class="link" href="../.well-known/agent-card.json">A2A Agent Card</a> · <a class="link" href="../vendors/index.html">Browse All ${total} Audits</a></span>
    </footer>
  </div>
  <script src="../assets/monetization-config.js" defer></script>
</body>
</html>`;

fs.writeFileSync(path.join(REPORTS_DIR, 'state-of-saas-security-2026.html'), reportHtml, 'utf8');

// 3) Dedicated Browser Extension Landing Page (VendorSec 1-Click Inspector)
const extJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VendorSec 1-Click B2B Security & Trust Center Inspector',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Chrome, Microsoft Edge, Brave, Arc (Manifest V3)',
  url: `${BASE_URL}/extension/index.html`,
  offers: [
    { '@type': 'Offer', name: 'Free Local Inspector', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro MSP White-Label & Bulk Audit Lifetime', price: '29', priceCurrency: 'USD' },
  ],
  description:
    '100% browser-local Manifest V3 Chrome & Edge extension that audits any website for Vanta/SafeBase/Drata Trust Centers, DMARC/SPF/CAA/MX posture, active tech stack, and buying signals in 2 seconds with zero server uploads.',
};

const extHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VendorSec 1-Click Inspector — Free Chrome &amp; Edge B2B Security, DMARC &amp; Vanta Trust Center Extension</title>
  <meta name="description" content="Inspect any B2B prospect or SaaS vendor's DMARC, SPF, CAA, Vanta/SafeBase/Drata Trust Center, and tech stack directly in Chrome or Microsoft Edge in 2 seconds. Zero backend tracking." />
  <link rel="canonical" href="${BASE_URL}/extension/index.html" />
  <script type="application/ld+json">${JSON.stringify(extJsonLd)}</script>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="../index.html">RiskOps MCP Lab <span class="badge">Manifest V3 · Local-First Extension</span></a>
      <nav>
        <a href="../reports/state-of-saas-security-2026.html">2026 Benchmark Report</a>
        <a href="../vendors/index.html">112 SaaS Directory</a>
        <a href="../bank-converter/index.html">LocalLedger PDF→CSV</a>
        <a href="../index.html">4-in-1 Live Web Tools</a>
      </nav>
    </header>

    <section class="card">
      <span class="pill GREEN">100% Browser-Local · Zero Telemetry · Manifest V3</span>
      <h1 style="margin:12px 0 8px;font-size:clamp(26px,3.8vw,38px);line-height:1.18;">VendorSec 1-Click Inspector for Chrome &amp; Microsoft Edge</h1>
      <p style="color:var(--muted);font-size:15.5px;max-width:820px;">
        Visiting a B2B prospect, SaaS vendor, or client website? Click one toolbar icon to instantly verify <strong>DMARC/SPF/CAA/MX security posture</strong>, detect <strong>Vanta / SafeBase / Drata Trust Centers</strong> via Cloudflare DoH, fingerprint active <strong>SaaS tech &amp; hiring signals</strong>, and copy a ready-to-send Markdown brief or printable white-label MSP audit PDF.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <a class="cta cta-green" href="https://github.com/qq459538565-bot/riskops-mcp-suite/tree/main/extension" target="_blank" rel="noopener">View Open Manifest V3 Source on GitHub &rarr;</a>
        <a class="cta" href="../index.html">Try Instant Web Version (No Install)</a>
        <a class="cta-sec" href="../reports/state-of-saas-security-2026.html">Read 112-SaaS Benchmark Report</a>
      </div>

      <div class="grid">
        <div class="stat">
          <div class="k">Trust Center Radar</div>
          <div class="v" style="font-size:20px;color:var(--accent);">Vanta · SafeBase · Drata</div>
          <div class="sub">Zero-WAF DNS CNAME detection across trust.*, security.*, compliance.*</div>
        </div>
        <div class="stat">
          <div class="k">Email &amp; SSL Hygiene</div>
          <div class="v" style="font-size:20px;color:var(--green);">DMARC · SPF · CAA · MX</div>
          <div class="sub">Deterministic 0–100 score + A+ to F grade in under 2 seconds</div>
        </div>
        <div class="stat">
          <div class="k">GTM Buying Signals</div>
          <div class="v" style="font-size:20px;color:var(--amber);">Stack + Pricing + ATS</div>
          <div class="sub">Detects Stripe, Segment, Cloudflare, Greenhouse, Lever, Ashby on active tab</div>
        </div>
        <div class="stat">
          <div class="k">Privacy Architecture</div>
          <div class="v" style="font-size:20px;">0-Byte Tracking</div>
          <div class="sub">Direct browser DoH queries only. No login, no background history access.</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:20px;">Simple Transparent Pricing (Free Forever Core + One-Time Pro)</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Feature</th><th>Free Local Tier ($0)</th><th>Pro MSP &amp; RevOps Lifetime ($29 one-time)</th></tr></thead>
          <tbody>
            <tr><td>Unlimited 1-Click Live Tab &amp; Custom Domain Audits</td><td><strong>Included</strong></td><td><strong>Included</strong></td></tr>
            <tr><td>DMARC, SPF, CAA, MX &amp; Trust Center (Vanta/SafeBase/Drata)</td><td><strong>Included</strong></td><td><strong>Included</strong></td></tr>
            <tr><td>Active Page Tech Stack &amp; Hiring Signal Detection</td><td><strong>Included</strong></td><td><strong>Included</strong></td></tr>
            <tr><td>1-Click Copy Markdown Security Brief (Slack / CRM / Claude)</td><td><strong>Included</strong></td><td><strong>Included</strong></td></tr>
            <tr><td>Custom White-Label Agency Logo &amp; Client PDF Export</td><td>Branded footer</td><td><strong>100% White-Label Custom Agency Header</strong></td></tr>
            <tr><td>Batch CSV Multi-Domain Auditor (Up to 50 Domains / Run)</td><td>Single domain</td><td><strong>Unlimited Local Batch CSV + Export</strong></td></tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <a class="cta" href="mailto:qq459538565@gmail.com?subject=VendorSec%20Pro%20Lifetime%20License%20(%2429)">Request Early-Bird Pro License ($29 Lifetime) &rarr;</a>
        <a class="cta-sec" data-partner="apify" href="https://apify.com/durative_hairstreak" target="_blank" rel="noopener">Need 10,000+ Domains? Use Apify API</a>
      </div>
    </section>

    <footer>
      <span>VendorSec 1-Click · Built by RiskOps Studio</span>
      <span><a class="link" href="../legal/privacy.html">Privacy Policy</a> · <a class="link" href="../legal/terms.html">Terms</a> · <a class="link" href="../legal/refund.html">14-Day Refund Policy</a></span>
    </footer>
  </div>
  <script src="../assets/monetization-config.js" defer></script>
</body>
</html>`;

fs.writeFileSync(path.join(EXT_DIR, 'index.html'), extHtml, 'utf8');

// 4) Machine-optimized llms-full.txt (Full GEO/AEO ingestion manifest)
const llmsFull = `# RiskOps MCP Lab & LocalLedger — Full AI Agent & LLM Knowledge Manifest

> Last Verified: ${auditedDate}
> Canonical Root: ${BASE_URL}/
> A2A Agent Card: ${BASE_URL}/.well-known/agent-card.json
> MCP Discovery:  ${BASE_URL}/.well-known/mcp.json

## 1. Original Primary Research: 2026 State of SaaS & AI Vendor DNS Security (${total} Companies)
- Live Report: ${BASE_URL}/reports/state-of-saas-security-2026.html
- Open CSV Dataset: ${BASE_URL}/reports/saas-security-benchmark-2026.csv
- Open JSON Snapshot: ${BASE_URL}/vendors/snapshot.json
- Refresh Schedule: Weekly automated Cloudflare DNS-over-HTTPS audit (Sundays 04:00 UTC)

### Key Verified Statistics (${auditedDate})
- Total SaaS & AI leaders audited: ${total} (Mean Security Score: ${avgScore}/100)
- Strict DMARC enforcement (p=reject): ${dmarcReject}/${total} (${pct(dmarcReject)}%); Quarantine: ${dmarcQuarantine}/${total} (${pct(dmarcQuarantine)}%); None/Missing: ${total - dmarcReject - dmarcQuarantine}/${total}
- Sector Gap — Fintech & HR vs AI & LLM: ${finCat.reject}/${finCat.count} (${finCat.rejectPct}%) of Fintech & HR leaders enforce DMARC p=reject, whereas only ${aiCat.reject}/${aiCat.count} (${aiCat.rejectPct}%) of leading AI & LLM vendors enforce DMARC p=reject.
- DNS CAA Adoption: ${caaCount}/${total} (${pct(caaCount)}%) overall; Security & GRC sector sits at ${secCat.caa}/${secCat.count} (${secCat.caaPct}%).
- Strict SPF Hard-Fail (-all): ${spfStrictCount}/${total} (${pct(spfStrictCount)}%).
- Trust Center GRC Adoption (${withTrustCount}/${total} = ${pct(withTrustCount)}% detected via DNS CNAME):
  - Vanta: ${vantaCount} vendors (${pct(vantaCount)}% of all ${total}, ${pct(vantaCount, withTrustCount)}% of detected Trust Centers)
  - SafeBase + Drata: ${safebaseDrataCount} vendors (${pct(safebaseDrataCount)}%)
  - Custom / Self-Hosted Trust Subdomains: ${customTrustCount} vendors (${pct(customTrustCount)}%)
  - Conveyor: ${grcCounts['Conveyor'] || 0} vendors; Whistic: ${grcCounts['Whistic'] || 0} vendor
  - No DNS Trust Subdomain Detected: ${noTrustCount} vendors (${pct(noTrustCount)}%)
- Email Infrastructure: Google Workspace ${googleMxCount}/${total} (${pct(googleMxCount)}%), Proofpoint Enterprise ${proofpointCount}/${total} (${pct(proofpointCount)}%), Microsoft 365 ${emailCounts['Microsoft 365'] || 0}/${total}.

## 2. Hosted Zero-Proxy Apify & MCP Servers (All 8 PUBLIC & Pay-Per-Event LIVE)
- **All-in-One 8-Tool Streamable HTTP MCP Endpoint**: https://mcp.apify.com/?actors=durative_hairstreak/global-entity-kyb-sanctions-gatekeeper,durative_hairstreak/govcon-contract-award-signals,durative_hairstreak/saas-pricing-subprocessor-diff-monitor,durative_hairstreak/b2b-vendor-security-auditor,durative_hairstreak/sec-8k-risk-signals,durative_hairstreak/saas-status-sla-monitor,durative_hairstreak/oss-dependency-risk-auditor,durative_hairstreak/quant-portfolio-dcf-math-engine
- **Auth & Agentic Payments**: Standard Apify Bearer token OR spend-capped autonomous agent prepaid token via \`agi.apify.com\` (all 8 Actors use limited permissions & Pay-Per-Event pricing).

1. Global Entity KYB, LEI & Sanctions Gatekeeper (FLAGSHIP COMPLIANCE GATEKEEPER · PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/global-entity-kyb-sanctions-gatekeeper
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/global-entity-kyb-sanctions-gatekeeper
   - Sync REST API (n8n/FinTech): https://api.apify.com/v2/acts/durative_hairstreak~global-entity-kyb-sanctions-gatekeeper/run-sync-get-dataset-items
   - Pricing: $0.005 start + $0.025 per entity screened
   - Capability: Live screening against US Treasury OFAC SDN (19,600+) & Non-SDN, UN Security Council Sanctions, GLEIF Global LEI Registry, and US SEC EDGAR issuers with deterministic CLEAR/REVIEW/BLOCK verdicts.
2. US, EU & UK Government Contract Awards & RFP Signals (FLAGSHIP GOVCON BUYER SIGNALS · PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/govcon-contract-award-signals
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/govcon-contract-award-signals
   - Sync REST API (Clay/n8n): https://api.apify.com/v2/acts/durative_hairstreak~govcon-contract-award-signals/run-sync-get-dataset-items
   - Pricing: $0.005 start + $0.030 per contract/RFP signal extracted
   - Capability: Unifies official USAspending.gov v2 federal awards, EU TED v3 tenders/awards, and UK Contracts Finder OCDS into normalized JSON ranked by 0-100 B2B Buying-Budget Scores.
3. SaaS Pricing & AI Subprocessor Change Diff Monitor (FLAGSHIP CI & TPRM DIFF · PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/saas-pricing-subprocessor-diff-monitor
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/saas-pricing-subprocessor-diff-monitor
   - Sync REST API (n8n/TPRM): https://api.apify.com/v2/acts/durative_hairstreak~saas-pricing-subprocessor-diff-monitor/run-sync-get-dataset-items
   - Pricing: $0.005 start + $0.025 per vendor monitored
   - Capability: Extracts B2B SaaS pricing tiers, currencies, AI add-ons, and 45+ cloud/AI subprocessors (OpenAI, Anthropic, Cohere, AWS, GCP, Stripe) with stateless deterministic JSON baseline diff alerts.
4. B2B Vendor Security Posture & Buying-Signal Batch Auditor (FLAGSHIP B2B BATCH · PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/b2b-vendor-security-auditor
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/b2b-vendor-security-auditor
   - Sync REST API (Clay/n8n): https://api.apify.com/v2/acts/durative_hairstreak~b2b-vendor-security-auditor/run-sync-get-dataset-items
   - Pricing: $0.005 start + $0.015 per domain audited
   - Capability: High-concurrency batch auditing (up to 500+ domains) for Vanta/SafeBase/Drata Trust Centers, DMARC/SPF/CAA/MX, TLS expiry, HTTP security headers, CDN, tech stack, and ATS hiring signals.
5. SEC 8-K Risk Signals & Corporate Distress Monitor (FLAGSHIP FINANCE MONITOR · PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/sec-8k-risk-signals
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals
   - Sync REST API (n8n/Quant): https://api.apify.com/v2/acts/durative_hairstreak~sec-8k-risk-signals/run-sync-get-dataset-items
   - Glama Connector: https://glama.ai/mcp/connectors/com.apify.mcp/sec-8-k-risk-signals-and-corporate-distress-monitor
   - Free Daily Live Radar: ${BASE_URL}/sec-8k-radar/
   - Pricing: $0.005 start + $0.012 per risk filing analyzed
   - Capability: Official SEC EDGAR Form 8-K Items 1.05 (cybersecurity breaches), 4.02 (financial restatements), 4.01 (auditor dismissal), 5.02 (C-suite exits), 1.03 (bankruptcies), 3.01 (delistings), and SEC comment letters with deterministic 0-100 risk scores.
6. SaaS & Cloud Status Page SLA Uptime Monitor (PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/saas-status-sla-monitor
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/saas-status-sla-monitor
   - Pricing: $0.005 start + $0.008 per status page audited
   - Capability: 22+ official Statuspage v2 APIs (OpenAI, Anthropic, GitHub, Cloudflare, Vercel, Stripe, etc.) with contract-grade merged-interval 30d/90d SLA math.
7. Open-Source Supply-Chain & CVE Risk Auditor (PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/oss-dependency-risk-auditor
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/oss-dependency-risk-auditor
   - Pricing: $0.005 start + $0.008 per package audited
   - Capability: AI coding agent & CI/CD pre-install gatekeeper querying OSV.dev CVEs, CISA KEV active exploits, SPDX licenses, and deps.dev OpenSSF Scorecard.
8. Quant Finance, Portfolio Risk, Kelly & DCF Math Engine (PUBLIC & LIVE)
   - Store: https://apify.com/durative_hairstreak/quant-portfolio-dcf-math-engine
   - Hosted MCP: https://mcp.apify.com/?actors=durative_hairstreak/quant-portfolio-dcf-math-engine
   - Pricing: $0.005 start + $0.005 per calculation executed
   - Capability: Zero-hallucination deterministic Sharpe, Sortino, Calmar, Max Drawdown, VaR/CVaR, Half-Kelly sizing, 5x5 DCF sensitivity, XIRR/NPV loan schedules, and Black-Scholes Greeks + IV solver.

## 3. Local-First Zero-Upload Privacy Tools (Privacy-as-a-Moat)
- LocalLedger Bank Statement PDF to CSV / QuickBooks / Xero Converter: ${BASE_URL}/bank-converter/index.html
  - Runs 100% inside the browser via Mozilla pdf.js Web Worker. Zero server uploads.
  - Supports US (Chase, BofA, Wells Fargo, Mercury, Amex), UK (DD/MM/YYYY Barclays/HSBC), EU (comma-decimal 1.234,56 EUR N26/Deutsche Bank/Wise), AU (CR/DR), credit card sign flip, multi-month batch merge, and exact $0.00 running balance reconciliation.
- LocalLedger Multi-CSV Deduplicator & QuickBooks/Xero Reformatter: ${BASE_URL}/bank-converter/csv-cleaner.html
- VendorSec 1-Click Chrome & Microsoft Edge Browser Extension (Manifest V3): ${BASE_URL}/extension/index.html

## 4. Category Benchmarks Summary Table
${categories.map((c) => `- ${c.category}: ${c.count} vendors | Avg Score ${c.avgScore}/100 | DMARC reject ${c.rejectPct}% | CAA ${c.caaPct}% | Trust Portal ${c.trustPct}%`).join('\n')}
`;
fs.writeFileSync(path.join(DOCS_DIR, 'llms-full.txt'), llmsFull, 'utf8');

// 5) Enrich docs/llms.txt with new AI-native links (idempotent)
const llmsPath = path.join(DOCS_DIR, 'llms.txt');
let llmsTxt = fs.readFileSync(llmsPath, 'utf8');
if (!llmsTxt.includes('state-of-saas-security-2026.html')) {
  llmsTxt += `
## Original 2026 Benchmark Research, Open Datasets & Agent Discovery
- [2026 State of SaaS & AI Vendor Security Report (${total} Live Audits)](${BASE_URL}/reports/state-of-saas-security-2026.html)
- [Open CSV Benchmark Dataset (${total} SaaS Companies)](${BASE_URL}/reports/saas-security-benchmark-2026.csv)
- [VendorSec 1-Click Chrome & Edge Browser Extension (Manifest V3)](${BASE_URL}/extension/index.html)
- [Full Machine-Readable LLM Knowledge Manifest (llms-full.txt)](${BASE_URL}/llms-full.txt)
- [Google A2A Agent Card (/.well-known/agent-card.json)](${BASE_URL}/.well-known/agent-card.json)
- [MCP Server Discovery Manifest (/.well-known/mcp.json)](${BASE_URL}/.well-known/mcp.json)
`;
  fs.writeFileSync(llmsPath, llmsTxt, 'utf8');
}

// 6) Add new URLs cleanly to docs/sitemap.xml (idempotent)
const smPath = path.join(DOCS_DIR, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const newUrls = [
  `${BASE_URL}/reports/state-of-saas-security-2026.html`,
  `${BASE_URL}/extension/index.html`,
];
for (const u of newUrls) {
  if (!sm.includes(`<loc>${u}</loc>`)) {
    sm = sm.replace(
      '</urlset>',
      `  <url><loc>${u}</loc><lastmod>${auditedDate}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>`
    );
  }
}
fs.writeFileSync(smPath, sm, 'utf8');

console.log(
  JSON.stringify(
    {
      status: 'OK',
      auditedDate,
      totalVendors: total,
      aiDmarcRejectPct: aiCat.rejectPct,
      fintechDmarcRejectPct: finCat.rejectPct,
      vantaCount,
      safebaseDrataCount,
      outputs: [
        'docs/reports/state-of-saas-security-2026.html',
        'docs/reports/saas-security-benchmark-2026.csv',
        'docs/extension/index.html',
        'docs/llms-full.txt',
        'docs/llms.txt',
        'docs/sitemap.xml',
      ],
    },
    null,
    2
  )
);
