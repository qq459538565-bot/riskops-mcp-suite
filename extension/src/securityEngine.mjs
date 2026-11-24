/**
 * VendorSec 1-Click — Pure Local-First Security & Trust Center Audit Engine
 * Zero backend servers, zero tracking, deterministic 0-100 scoring via Public DoH.
 */

const MULTI_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'ne.jp', 'or.jp',
  'com.cn', 'net.cn', 'org.cn',
  'com.sg', 'com.hk', 'com.br', 'co.in', 'co.nz', 'co.za',
]);

export function extractRootDomain(input) {
  if (!input) return '';
  let raw = String(input).trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').replace(/\.$/, '');
  if (!raw || raw === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(raw) || raw.startsWith('chrome') || raw.startsWith('edge') || raw.startsWith('about')) {
    return '';
  }
  const parts = raw.split('.').filter(Boolean);
  if (parts.length < 2) return '';
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return lastTwo;
}

export async function queryDoh(name, type, fetchImpl = fetch) {
  const endpoints = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
  ];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      const res = await fetchImpl(url, {
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      return (json.Answer || [])
        .map((a) => String(a.data || '').replace(/^"|"$/g, '').replace(/"\s*"/g, '').trim())
        .filter(Boolean);
    } catch {
      // failover to next DoH resolver
    }
  }
  return [];
}

export function classifyGrcPlatform(cnameTarget) {
  const t = String(cnameTarget || '').toLowerCase();
  if (!t) return 'None Detected via DNS';
  if (t.includes('vantatrust') || t.includes('vanta')) return 'Vanta';
  if (t.includes('safebase')) return 'SafeBase (Drata)';
  if (t.includes('drata')) return 'Drata';
  if (t.includes('conveyor')) return 'Conveyor';
  if (t.includes('secureframe')) return 'Secureframe';
  if (t.includes('sprinto')) return 'Sprinto';
  if (t.includes('whistic')) return 'Whistic';
  if (t.includes('hypercomply')) return 'HyperComply';
  if (t.includes('trustpage') || t.includes('oneleet')) return 'TrustPage / Oneleet';
  return 'Custom / Self-Hosted Trust Subdomain';
}

export function classifyEmailProvider(mxRecords) {
  const joined = (mxRecords || []).join(' ').toLowerCase();
  if (!joined) return 'No Public MX';
  if (joined.includes('google.com') || joined.includes('googlemail.com')) return 'Google Workspace';
  if (joined.includes('outlook.com') || joined.includes('protection.outlook')) return 'Microsoft 365';
  if (joined.includes('pphosted.com') || joined.includes('proofpoint')) return 'Proofpoint Enterprise';
  if (joined.includes('mimecast')) return 'Mimecast Enterprise';
  if (joined.includes('zoho')) return 'Zoho Mail';
  if (joined.includes('fastmail') || joined.includes('messagingengine')) return 'Fastmail';
  if (joined.includes('protonmail')) return 'Proton Mail';
  return 'Custom / Other MX';
}

export function scoreAudit({ dmarcPolicy, spfPresent, spfStrict, caaPresent, grcPlatform, mxCount }) {
  let score = 0;
  const flags = [];
  const recommendations = [];

  if (dmarcPolicy === 'reject') {
    score += 35;
  } else if (dmarcPolicy === 'quarantine') {
    score += 27;
    flags.push('DMARC at quarantine (not strict reject)');
    recommendations.push('Upgrade DMARC policy from p=quarantine to p=reject after verifying DKIM alignment.');
  } else if (dmarcPolicy === 'none') {
    score += 10;
    flags.push('DMARC monitoring-only (p=none)');
    recommendations.push('Enforce DMARC p=quarantine or p=reject to block executive domain spoofing.');
  } else {
    flags.push('Missing DMARC DNS record');
    recommendations.push('Publish a _dmarc TXT record immediately to protect against phishing.');
  }

  if (spfPresent) {
    score += spfStrict ? 20 : 15;
    if (!spfStrict) {
      flags.push('SPF uses softfail (~all) or neutral');
      recommendations.push('Tighten SPF termination to -all once all legitimate senders are enumerated.');
    }
  } else {
    flags.push('Missing SPF TXT record');
    recommendations.push('Publish a valid v=spf1 TXT record authorizing your email infrastructure.');
  }

  if (caaPresent) {
    score += 15;
  } else {
    flags.push('No DNS CAA certificate restriction');
    recommendations.push('Add DNS CAA records restricting which Certificate Authorities may issue TLS certificates.');
  }

  if (grcPlatform && grcPlatform !== 'None Detected via DNS') {
    score += 20;
  } else {
    flags.push('No public Trust Center subdomain detected');
    recommendations.push('Publish a trust.<domain> portal (e.g. Vanta, SafeBase/Drata) to accelerate enterprise security reviews.');
  }

  if (mxCount > 0) {
    score += 10;
  } else {
    flags.push('No public MX records');
  }

  let grade = 'F';
  if (score >= 92) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 75) grade = 'B+';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';

  const light = score >= 80 ? 'GREEN' : score >= 60 ? 'AMBER' : 'RED';
  return { score, grade, light, flags, recommendations };
}

export async function auditDomain(rawInput, fetchImpl = fetch) {
  const domain = extractRootDomain(rawInput);
  if (!domain) {
    throw new Error('Please enter a valid public domain (e.g., openai.com or stripe.com).');
  }

  const [dmarcAns, txtAns, caaAns, mxAns, trustCname, secCname, compCname, trustA] = await Promise.all([
    queryDoh(`_dmarc.${domain}`, 'TXT', fetchImpl),
    queryDoh(domain, 'TXT', fetchImpl),
    queryDoh(domain, 'CAA', fetchImpl),
    queryDoh(domain, 'MX', fetchImpl),
    queryDoh(`trust.${domain}`, 'CNAME', fetchImpl),
    queryDoh(`security.${domain}`, 'CNAME', fetchImpl),
    queryDoh(`compliance.${domain}`, 'CNAME', fetchImpl),
    queryDoh(`trust.${domain}`, 'A', fetchImpl),
  ]);

  const dmarcRecord = dmarcAns.find((t) => /v=dmarc1/i.test(t)) || '';
  const policyMatch = dmarcRecord.match(/\bp\s*=\s*(reject|quarantine|none)\b/i);
  const dmarcPolicy = policyMatch ? policyMatch[1].toLowerCase() : 'missing';

  const spfRecord = txtAns.find((t) => /v=spf1/i.test(t)) || '';
  const spfPresent = Boolean(spfRecord);
  const spfStrict = /-all\b/i.test(spfRecord);

  const caaPresent = caaAns.length > 0;
  const emailProvider = classifyEmailProvider(mxAns);

  let trustSubdomain = '';
  let trustCnameTarget = '';
  if (trustCname.length) {
    trustSubdomain = `trust.${domain}`;
    trustCnameTarget = trustCname[0];
  } else if (secCname.length) {
    trustSubdomain = `security.${domain}`;
    trustCnameTarget = secCname[0];
  } else if (compCname.length) {
    trustSubdomain = `compliance.${domain}`;
    trustCnameTarget = compCname[0];
  } else if (trustA.length) {
    trustSubdomain = `trust.${domain}`;
    trustCnameTarget = `A:${trustA[0]}`;
  }

  const grcPlatform = trustCnameTarget
    ? classifyGrcPlatform(trustCnameTarget)
    : 'None Detected via DNS';

  const scored = scoreAudit({
    dmarcPolicy,
    spfPresent,
    spfStrict,
    caaPresent,
    grcPlatform,
    mxCount: mxAns.length,
  });

  return {
    domain,
    auditedAt: new Date().toISOString().slice(0, 10),
    ...scored,
    dmarcPolicy,
    dmarcRecord,
    spfPresent,
    spfStrict,
    spfRecord,
    caaPresent,
    caaCount: caaAns.length,
    mxCount: mxAns.length,
    emailProvider,
    trustSubdomain,
    trustCnameTarget,
    grcPlatform,
  };
}

export function detectTechSignalsFromHtml(html = '', links = []) {
  const src = String(html).toLowerCase();
  const hrefs = (links || []).map((l) => String(l).toLowerCase());
  const stack = [];

  const checks = [
    ['Stripe', /js\.stripe\.com|checkout\.stripe\.com/],
    ['Paddle', /cdn\.paddle\.com/],
    ['Cloudflare', /challenges\.cloudflare\.com|cloudflareinsights\.com|__cf_bm/],
    ['Vercel / Next.js', /_next\/static|vercel\.live/],
    ['Intercom', /widget\.intercom\.io|intercomcdn\.com/],
    ['HubSpot', /js\.hs-scripts\.com|hubspot\.com/],
    ['Segment', /cdn\.segment\.com/],
    ['PostHog', /posthog\.com|us\.i\.posthog\.com/],
    ['Google Tag Manager', /googletagmanager\.com/],
    ['Datadog RUM', /datadoghq-browser-agent/],
    ['Sentry', /browser\.sentry-cdn\.com|sentry\.io/],
    ['Webflow / Framer', /framerusercontent\.com|website-files\.com/],
  ];

  for (const [label, rx] of checks) {
    if (rx.test(src)) stack.push(label);
  }

  let ats = 'None detected';
  if (/boards\.greenhouse\.io|greenhouse\.io/.test(src) || hrefs.some((h) => h.includes('greenhouse.io'))) ats = 'Greenhouse';
  else if (/jobs\.lever\.co|lever\.co/.test(src) || hrefs.some((h) => h.includes('lever.co'))) ats = 'Lever';
  else if (/jobs\.ashbyhq\.com|ashbyhq\.com/.test(src) || hrefs.some((h) => h.includes('ashbyhq.com'))) ats = 'Ashby';
  else if (/myworkdayjobs\.com/.test(src) || hrefs.some((h) => h.includes('workday'))) ats = 'Workday';

  const hasPricingLink = hrefs.some((h) => /\/pricing\b|pricing/.test(h));
  const hasCareersLink = hrefs.some((h) => /\/careers\b|\/jobs\b|careers/.test(h));
  const hasSecurityLink = hrefs.some((h) => /\/security\b|trust\./.test(h));

  return { stack, ats, hasPricingLink, hasCareersLink, hasSecurityLink };
}

export function buildMarkdownBrief(audit, pageSignals = null) {
  const lines = [
    `### VendorSec Security & Trust Brief: \`${audit.domain}\``,
    `- **Overall Score:** **${audit.score}/100 (Grade ${audit.grade} · ${audit.light})** *(Audited ${audit.auditedAt})*`,
    `- **Trust Center / GRC:** ${audit.grcPlatform}${audit.trustSubdomain ? ` (\`${audit.trustSubdomain}\`)` : ''}`,
    `- **Email Security:** DMARC \`p=${audit.dmarcPolicy}\` | SPF ${audit.spfPresent ? (audit.spfStrict ? 'Strict (-all)' : 'Present (~all)') : 'Missing'} | MX: ${audit.emailProvider}`,
    `- **SSL DNS CAA:** ${audit.caaPresent ? `Protected (${audit.caaCount} records)` : 'Not configured'}`,
  ];
  if (pageSignals) {
    lines.push(`- **Active Page Signals:** Stack: ${pageSignals.stack.length ? pageSignals.stack.join(', ') : 'Minimal/Custom'} | ATS: ${pageSignals.ats} | Pricing Page: ${pageSignals.hasPricingLink ? 'Yes' : 'No'}`);
  }
  if (audit.flags.length) {
    lines.push(`- **Key Gaps:** ${audit.flags.join('; ')}`);
  }
  lines.push(`- *Generated locally via VendorSec 1-Click (RiskOps MCP Lab)*`);
  return lines.join('\n');
}

export function buildCsvExport(results) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['Domain', 'Score', 'Grade', 'Status', 'GRC_Platform', 'Trust_Subdomain', 'DMARC', 'SPF_Strict', 'CAA', 'Email_Provider', 'Flags', 'Audited_At'];
  const rows = [
    header.join(','),
    ...results.map((r) =>
      [
        r.domain,
        r.score,
        r.grade,
        r.light,
        r.grcPlatform,
        r.trustSubdomain || '',
        r.dmarcPolicy,
        r.spfStrict,
        r.caaPresent,
        r.emailProvider,
        (r.flags || []).join(' | '),
        r.auditedAt,
      ]
        .map(esc)
        .join(',')
    ),
  ];
  return rows.join('\n') + '\n';
}

export function buildPrintableReportHtml(audit, pageSignals, agencyName = '') {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const brand = agencyName ? esc(agencyName) : 'VendorSec 1-Click · RiskOps MCP Lab';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Security Posture Audit — ${esc(audit.domain)}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:32px;line-height:1.55;}
.head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px;}
.score{font-size:32px;font-weight:800;padding:8px 16px;border-radius:10px;background:#f1f5f9;}
table{width:100%;border-collapse:collapse;margin:16px 0;}
th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13.5px;}
th{background:#f8fafc;}
.muted{color:#475569;font-size:12.5px;}
@media print{.no-print{display:none;}}
</style>
</head>
<body>
  <div class="head">
    <div>
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#475569;">Prepared by ${brand}</div>
      <h1 style="margin:4px 0 0;font-size:24px;">Vendor Security &amp; Trust Audit: ${esc(audit.domain)}</h1>
      <div class="muted">Live Public DNS-over-HTTPS Verification · Audited ${esc(audit.auditedAt)}</div>
    </div>
    <div class="score">${esc(audit.score)}/100 (${esc(audit.grade)})</div>
  </div>
  <table>
    <tr><th>Control</th><th>Status</th><th>Evidence</th></tr>
    <tr><td><strong>Trust Center / GRC</strong></td><td>${esc(audit.grcPlatform)}</td><td>${esc(audit.trustSubdomain || 'Not detected')} ${esc(audit.trustCnameTarget || '')}</td></tr>
    <tr><td><strong>DMARC Policy</strong></td><td>${esc(audit.dmarcPolicy)}</td><td><code>${esc(audit.dmarcRecord || 'Missing')}</code></td></tr>
    <tr><td><strong>SPF Policy</strong></td><td>${audit.spfPresent ? (audit.spfStrict ? 'Strict (-all)' : 'Softfail / Neutral') : 'Missing'}</td><td><code>${esc(audit.spfRecord || 'Missing')}</code></td></tr>
    <tr><td><strong>DNS CAA</strong></td><td>${audit.caaPresent ? 'Configured' : 'Missing'}</td><td>${audit.caaCount} record(s)</td></tr>
    <tr><td><strong>Email Provider (MX)</strong></td><td>${esc(audit.emailProvider)}</td><td>${audit.mxCount} MX host(s)</td></tr>
    ${pageSignals ? `<tr><td><strong>Detected Web Stack</strong></td><td>${esc(pageSignals.ats)}</td><td>${esc(pageSignals.stack.join(', ') || 'None detected')}</td></tr>` : ''}
  </table>
  <h3>Priority Remediation Recommendations</h3>
  <ul>${(audit.recommendations.length ? audit.recommendations : ['Strong baseline posture detected across DMARC, SPF, CAA, and Trust Center.']).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <p class="no-print"><button onclick="window.print()" style="padding:10px 18px;font-weight:700;cursor:pointer;">Print / Save as PDF</button></p>
</body>
</html>`;
}
