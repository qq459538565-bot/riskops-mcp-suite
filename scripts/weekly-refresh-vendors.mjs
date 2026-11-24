import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://qq459538565-bot.github.io/riskops-mcp-suite';
const DOCS_DIR = path.resolve('docs');
const SNAPSHOT_PATH = path.resolve('docs/vendors/snapshot.json');

const SAAS_TARGETS = [
  // AI & LLM Infrastructure
  { name: 'OpenAI', domain: 'openai.com', category: 'AI & LLM' },
  { name: 'Anthropic', domain: 'anthropic.com', category: 'AI & LLM' },
  { name: 'Perplexity AI', domain: 'perplexity.ai', category: 'AI & LLM' },
  { name: 'Mistral AI', domain: 'mistral.ai', category: 'AI & LLM' },
  { name: 'Cursor', domain: 'cursor.com', category: 'AI & LLM' },
  { name: 'Hugging Face', domain: 'huggingface.co', category: 'AI & LLM' },
  { name: 'Cohere', domain: 'cohere.com', category: 'AI & LLM' },
  { name: 'Groq', domain: 'groq.com', category: 'AI & LLM' },
  { name: 'Together AI', domain: 'together.ai', category: 'AI & LLM' },
  { name: 'Replicate', domain: 'replicate.com', category: 'AI & LLM' },
  { name: 'ElevenLabs', domain: 'elevenlabs.io', category: 'AI & LLM' },
  { name: 'Pinecone', domain: 'pinecone.io', category: 'AI & LLM' },
  { name: 'Weaviate', domain: 'weaviate.io', category: 'AI & LLM' },
  { name: 'LangChain', domain: 'langchain.com', category: 'AI & LLM' },
  { name: 'Scale AI', domain: 'scale.com', category: 'AI & LLM' },
  { name: 'Weights & Biases', domain: 'wandb.ai', category: 'AI & LLM' },
  { name: 'Modal', domain: 'modal.com', category: 'AI & LLM' },
  { name: 'Firecrawl', domain: 'firecrawl.dev', category: 'AI & LLM' },
  { name: 'Tavily', domain: 'tavily.com', category: 'AI & LLM' },
  { name: 'Exa', domain: 'exa.ai', category: 'AI & LLM' },
  { name: 'Browserbase', domain: 'browserbase.com', category: 'AI & LLM' },
  { name: 'Midjourney', domain: 'midjourney.com', category: 'AI & LLM' },
  { name: 'Vapi', domain: 'vapi.ai', category: 'AI & LLM' },
  { name: 'Replit', domain: 'replit.com', category: 'AI & LLM' },

  // Cloud, DevOps & Databases
  { name: 'GitHub', domain: 'github.com', category: 'Cloud & DevOps' },
  { name: 'GitLab', domain: 'gitlab.com', category: 'Cloud & DevOps' },
  { name: 'Cloudflare', domain: 'cloudflare.com', category: 'Cloud & DevOps' },
  { name: 'Vercel', domain: 'vercel.com', category: 'Cloud & DevOps' },
  { name: 'Netlify', domain: 'netlify.com', category: 'Cloud & DevOps' },
  { name: 'Supabase', domain: 'supabase.com', category: 'Cloud & DevOps' },
  { name: 'Datadog', domain: 'datadoghq.com', category: 'Cloud & DevOps' },
  { name: 'Sentry', domain: 'sentry.io', category: 'Cloud & DevOps' },
  { name: 'Grafana Labs', domain: 'grafana.com', category: 'Cloud & DevOps' },
  { name: 'PagerDuty', domain: 'pagerduty.com', category: 'Cloud & DevOps' },
  { name: 'Elastic', domain: 'elastic.co', category: 'Cloud & DevOps' },
  { name: 'MongoDB', domain: 'mongodb.com', category: 'Cloud & DevOps' },
  { name: 'Redis', domain: 'redis.io', category: 'Cloud & DevOps' },
  { name: 'Snowflake', domain: 'snowflake.com', category: 'Cloud & DevOps' },
  { name: 'Databricks', domain: 'databricks.com', category: 'Cloud & DevOps' },
  { name: 'Confluent', domain: 'confluent.io', category: 'Cloud & DevOps' },
  { name: 'ClickHouse', domain: 'clickhouse.com', category: 'Cloud & DevOps' },
  { name: 'Neon', domain: 'neon.tech', category: 'Cloud & DevOps' },
  { name: 'PlanetScale', domain: 'planetscale.com', category: 'Cloud & DevOps' },
  { name: 'Upstash', domain: 'upstash.com', category: 'Cloud & DevOps' },
  { name: 'Fly.io', domain: 'fly.io', category: 'Cloud & DevOps' },
  { name: 'Render', domain: 'render.com', category: 'Cloud & DevOps' },
  { name: 'Railway', domain: 'railway.com', category: 'Cloud & DevOps' },
  { name: 'Postman', domain: 'postman.com', category: 'Cloud & DevOps' },
  { name: 'LaunchDarkly', domain: 'launchdarkly.com', category: 'Cloud & DevOps' },
  { name: 'Resend', domain: 'resend.com', category: 'Cloud & DevOps' },

  // Security, Auth & Compliance (GRC)
  { name: 'Vanta', domain: 'vanta.com', category: 'Security & GRC' },
  { name: 'Drata', domain: 'drata.com', category: 'Security & GRC' },
  { name: 'Secureframe', domain: 'secureframe.com', category: 'Security & GRC' },
  { name: 'Sprinto', domain: 'sprinto.com', category: 'Security & GRC' },
  { name: 'Wiz', domain: 'wiz.io', category: 'Security & GRC' },
  { name: 'Snyk', domain: 'snyk.io', category: 'Security & GRC' },
  { name: 'CrowdStrike', domain: 'crowdstrike.com', category: 'Security & GRC' },
  { name: 'Okta', domain: 'okta.com', category: 'Security & GRC' },
  { name: 'Auth0', domain: 'auth0.com', category: 'Security & GRC' },
  { name: 'Clerk', domain: 'clerk.com', category: 'Security & GRC' },
  { name: 'WorkOS', domain: 'workos.com', category: 'Security & GRC' },
  { name: '1Password', domain: '1password.com', category: 'Security & GRC' },
  { name: 'Tailscale', domain: 'tailscale.com', category: 'Security & GRC' },
  { name: 'Stytch', domain: 'stytch.com', category: 'Security & GRC' },

  // Fintech, Payments & HR
  { name: 'Stripe', domain: 'stripe.com', category: 'Fintech & HR' },
  { name: 'Brex', domain: 'brex.com', category: 'Fintech & HR' },
  { name: 'Ramp', domain: 'ramp.com', category: 'Fintech & HR' },
  { name: 'Mercury', domain: 'mercury.com', category: 'Fintech & HR' },
  { name: 'Plaid', domain: 'plaid.com', category: 'Fintech & HR' },
  { name: 'Wise', domain: 'wise.com', category: 'Fintech & HR' },
  { name: 'Deel', domain: 'deel.com', category: 'Fintech & HR' },
  { name: 'Rippling', domain: 'rippling.com', category: 'Fintech & HR' },
  { name: 'Gusto', domain: 'gusto.com', category: 'Fintech & HR' },
  { name: 'Carta', domain: 'carta.com', category: 'Fintech & HR' },
  { name: 'Paddle', domain: 'paddle.com', category: 'Fintech & HR' },
  { name: 'Shopify', domain: 'shopify.com', category: 'Fintech & HR' },

  // Automation, GTM & Data
  { name: 'n8n', domain: 'n8n.io', category: 'Automation & GTM' },
  { name: 'Make', domain: 'make.com', category: 'Automation & GTM' },
  { name: 'Zapier', domain: 'zapier.com', category: 'Automation & GTM' },
  { name: 'Clay', domain: 'clay.com', category: 'Automation & GTM' },
  { name: 'Apify', domain: 'apify.com', category: 'Automation & GTM' },
  { name: 'Apollo.io', domain: 'apollo.io', category: 'Automation & GTM' },
  { name: 'HubSpot', domain: 'hubspot.com', category: 'Automation & GTM' },
  { name: 'Salesforce', domain: 'salesforce.com', category: 'Automation & GTM' },
  { name: 'Gong', domain: 'gong.io', category: 'Automation & GTM' },
  { name: 'Intercom', domain: 'intercom.com', category: 'Automation & GTM' },
  { name: 'Zendesk', domain: 'zendesk.com', category: 'Automation & GTM' },
  { name: 'PostHog', domain: 'posthog.com', category: 'Automation & GTM' },
  { name: 'Mixpanel', domain: 'mixpanel.com', category: 'Automation & GTM' },
  { name: 'Amplitude', domain: 'amplitude.com', category: 'Automation & GTM' },
  { name: 'Fivetran', domain: 'fivetran.com', category: 'Automation & GTM' },
  { name: 'Airbyte', domain: 'airbyte.com', category: 'Automation & GTM' },
  { name: 'Twilio', domain: 'twilio.com', category: 'Automation & GTM' },
  { name: 'Instantly', domain: 'instantly.ai', category: 'Automation & GTM' },

  // Productivity & Collaboration SaaS
  { name: 'Notion', domain: 'notion.so', category: 'Productivity SaaS' },
  { name: 'Linear', domain: 'linear.app', category: 'Productivity SaaS' },
  { name: 'Figma', domain: 'figma.com', category: 'Productivity SaaS' },
  { name: 'Slack', domain: 'slack.com', category: 'Productivity SaaS' },
  { name: 'Zoom', domain: 'zoom.us', category: 'Productivity SaaS' },
  { name: 'Atlassian', domain: 'atlassian.com', category: 'Productivity SaaS' },
  { name: 'Airtable', domain: 'airtable.com', category: 'Productivity SaaS' },
  { name: 'Miro', domain: 'miro.com', category: 'Productivity SaaS' },
  { name: 'Canva', domain: 'canva.com', category: 'Productivity SaaS' },
  { name: 'Loom', domain: 'loom.com', category: 'Productivity SaaS' },
  { name: 'Calendly', domain: 'calendly.com', category: 'Productivity SaaS' },
  { name: 'ClickUp', domain: 'clickup.com', category: 'Productivity SaaS' },
  { name: 'Asana', domain: 'asana.com', category: 'Productivity SaaS' },
  { name: 'Monday.com', domain: 'monday.com', category: 'Productivity SaaS' },
  { name: 'Dropbox', domain: 'dropbox.com', category: 'Productivity SaaS' },
  { name: 'DocuSign', domain: 'docusign.com', category: 'Productivity SaaS' },
  { name: 'Coda', domain: 'coda.io', category: 'Productivity SaaS' },
  { name: 'Raycast', domain: 'raycast.com', category: 'Productivity SaaS' },
];

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugifyDomain(domain) {
  return domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function doh(name, type) {
  const urls = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const answers = (json.Answer || [])
        .map((a) => String(a.data || '').replace(/^"|"$/g, '').replace(/"\s*"/g, '').trim())
        .filter(Boolean);
      return answers;
    } catch {
      // try fallback
    }
  }
  return [];
}

function detectGrc(cname) {
  if (!cname) return 'None Detected via DNS';
  if (/vantatrust|vanta\.com/i.test(cname)) return 'Vanta';
  if (/safebase/i.test(cname)) return 'SafeBase (Drata)';
  if (/drata/i.test(cname)) return 'Drata';
  if (/secureframe/i.test(cname)) return 'Secureframe';
  if (/sprinto/i.test(cname)) return 'Sprinto';
  if (/conveyor|aptible/i.test(cname)) return 'Conveyor';
  if (/whistic/i.test(cname)) return 'Whistic';
  if (/hypercomply/i.test(cname)) return 'HyperComply';
  if (/onetrust/i.test(cname)) return 'OneTrust';
  if (/trustarc/i.test(cname)) return 'TrustArc';
  return 'Custom / Self-Hosted Trust Subdomain';
}

function detectEmailStack(mxList) {
  const joined = mxList.join(' ').toLowerCase();
  if (!joined) return 'No Public MX';
  if (/google|aspmx/i.test(joined)) return 'Google Workspace';
  if (/outlook|protection\.outlook|microsoft/i.test(joined)) return 'Microsoft 365';
  if (/pphosted|proofpoint/i.test(joined)) return 'Proofpoint Enterprise';
  if (/mimecast/i.test(joined)) return 'Mimecast Enterprise';
  if (/barracuda/i.test(joined)) return 'Barracuda Email Security';
  if (/fastmail/i.test(joined)) return 'Fastmail';
  if (/protonmail/i.test(joined)) return 'Proton Mail';
  return 'Custom / Other MX';
}

async function auditDomain(target) {
  const d = target.domain;
  const [mx, txt, dmarc, caa, trustCname, secCname, compCname] = await Promise.all([
    doh(d, 'MX'),
    doh(d, 'TXT'),
    doh(`_dmarc.${d}`, 'TXT'),
    doh(d, 'CAA'),
    doh(`trust.${d}`, 'CNAME'),
    doh(`security.${d}`, 'CNAME'),
    doh(`compliance.${d}`, 'CNAME'),
  ]);

  const spfRecord = txt.find((t) => /^v=spf1\b/i.test(t)) || '';
  const spfStrict = /\s-all\b/i.test(spfRecord);
  const dmarcRecord = dmarc.find((t) => /^v=dmarc1\b/i.test(t)) || '';
  const dmarcPolicy = (dmarcRecord.match(/\bp=(reject|quarantine|none)\b/i)?.[1] || 'missing').toLowerCase();

  let trustSubdomain = null;
  let trustCnameTarget = null;
  if (trustCname[0]) {
    trustSubdomain = `trust.${d}`;
    trustCnameTarget = trustCname[0];
  } else if (secCname[0]) {
    trustSubdomain = `security.${d}`;
    trustCnameTarget = secCname[0];
  } else if (compCname[0]) {
    trustSubdomain = `compliance.${d}`;
    trustCnameTarget = compCname[0];
  }

  const grcPlatform = detectGrc(trustCnameTarget);
  const emailProvider = detectEmailStack(mx);

  let score = 20;
  const flags = [];
  const recommendations = [];

  if (dmarcPolicy === 'reject') {
    score += 30;
  } else if (dmarcPolicy === 'quarantine') {
    score += 22;
    flags.push('DMARC_QUARANTINE_NOT_REJECT');
    recommendations.push('Upgrade DMARC policy from p=quarantine to p=reject to fully block unauthorized domain spoofing.');
  } else if (dmarcPolicy === 'none') {
    score += 8;
    flags.push('DMARC_MONITOR_ONLY');
    recommendations.push('Enforce DMARC policy (move from p=none to p=quarantine/reject) 鈥?monitor-only leaves phishing spoofing open.');
  } else {
    flags.push('MISSING_DMARC');
    recommendations.push('Publish a _dmarc TXT record immediately to protect brand and customer email deliverability.');
  }

  if (spfRecord) {
    score += spfStrict ? 20 : 15;
    if (!spfStrict) {
      flags.push('SPF_SOFTFAIL');
      recommendations.push('Consider tightening SPF qualifier from ~all (softfail) to -all (hardfail) once all legitimate senders are enumerated.');
    }
  } else {
    flags.push('MISSING_SPF');
    recommendations.push('Publish an SPF TXT record enumerating authorized mail servers.');
  }

  if (caa.length > 0) {
    score += 10;
  } else {
    flags.push('MISSING_CAA');
    recommendations.push('Add DNS CAA records to restrict which Certificate Authorities can issue TLS certificates for this domain.');
  }

  if (trustCnameTarget) {
    score += 20;
  } else {
    flags.push('NO_TRUST_SUBDOMAIN_CNAME');
    recommendations.push('Host a dedicated public Trust Center subdomain (e.g., trust.' + d + ') to speed up enterprise security reviews.');
  }

  const grade = score >= 92 ? 'A+' : score >= 82 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
  const light = score >= 80 ? 'GREEN' : score >= 55 ? 'AMBER' : 'RED';

  return {
    ...target,
    slug: slugifyDomain(d),
    score,
    grade,
    light,
    grcPlatform,
    trustSubdomain,
    trustCnameTarget,
    dmarcPolicy,
    dmarcRecord: dmarcRecord.slice(0, 220),
    spfPresent: Boolean(spfRecord),
    spfStrict,
    spfRecord: spfRecord.slice(0, 220),
    caaPresent: caa.length > 0,
    caaCount: caa.length,
    emailProvider,
    mxCount: mx.length,
    flags,
    recommendations,
    auditedAt: new Date().toISOString().slice(0, 10),
  };
}

async function runPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

const SHARED_CSS = `
:root{--bg:#070b14;--panel:#0e1628;--panel2:#131f38;--border:#1f2e4d;--text:#e6edf7;--muted:#93a4c3;--accent:#38bdf8;--green:#10b981;--amber:#f59e0b;--red:#ef4444;}
*{box-sizing:border-box;}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;background:radial-gradient(circle at top right,#112240 0%,var(--bg) 52%);color:var(--text);line-height:1.6;}
.wrap{max-width:1080px;margin:0 auto;padding:24px 20px 64px;}
header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:24px;}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;color:#fff;text-decoration:none;}
.nav-links{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;}
.nav-links a{color:var(--muted);text-decoration:none;font-weight:600;}
.nav-links a:hover{color:#fff;}
.cta{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:10px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff!important;text-decoration:none;font-size:13px;font-weight:600;border:none;cursor:pointer;}
.cta-sec{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:10px;background:var(--panel2);color:#fff!important;text-decoration:none;font-size:13px;font-weight:600;border:1px solid var(--border);cursor:pointer;}
.card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:18px;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:14px;}
.metric{background:#09101f;border:1px solid var(--border);border-radius:12px;padding:14px;}
.metric .label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:4px;}
.metric .val{font-size:17px;font-weight:700;word-break:break-word;}
.pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;}
.pill.GREEN{background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.35);}
.pill.AMBER{background:rgba(245,158,11,.16);color:#fbbf24;border:1px solid rgba(245,158,11,.35);}
.pill.RED{background:rgba(239,68,68,.16);color:#f87171;border:1px solid rgba(239,68,68,.35);}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:10px;}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--border);vertical-align:top;}
th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
a.link{color:var(--accent);text-decoration:none;}
a.link:hover{text-decoration:underline;}
code{background:#09101f;border:1px solid var(--border);padding:2px 6px;border-radius:6px;font-size:12px;color:#93c5fd;word-break:break-all;}
.peer-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.peer-chip{background:#09101f;border:1px solid var(--border);color:var(--text);padding:6px 11px;border-radius:8px;font-size:12.5px;text-decoration:none;}
.peer-chip:hover{border-color:var(--accent);}
.whitelabel-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px;padding:12px;border-radius:10px;background:#09101f;border:1px dashed var(--accent);}
.whitelabel-bar input{flex:1;min-width:200px;background:var(--panel);border:1px solid var(--border);color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;}
.print-banner{display:none;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;}
footer{margin-top:32px;border-top:1px solid var(--border);padding-top:16px;color:var(--muted);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
@media print{
  body{background:#fff!important;color:#0f172a!important;}
  .no-print,header,.nav-links,.whitelabel-bar,.peer-card{display:none!important;}
  .print-banner{display:block!important;}
  .card,.metric{background:#fff!important;border:1px solid #cbd5e1!important;color:#0f172a!important;}
  .metric .label,th,footer{color:#475569!important;}
  code{background:#f1f5f9!important;color:#0f172a!important;border-color:#cbd5e1!important;}
  .pill{border:1px solid #334155!important;color:#0f172a!important;background:#f8fafc!important;}
}
`;

function renderHeader(prefix = '..') {
  return `<header>
    <a class="brand" href="${prefix}/index.html">RiskOps MCP Lab</a>
    <nav class="nav-links">
      <a href="${prefix}/index.html">4-in-1 Live Tools</a>
      <a href="${prefix}/vendors/index.html">100+ SaaS Security Directory</a>
      <a href="${prefix}/alternatives/securityscorecard-upguard-alternative.html">SecurityScorecard Alt</a>
      <a href="${prefix}/alternatives/uptimerobot-statuspage-alternative.html">UptimeRobot Alt</a>
      <a class="cta" href="https://apify.com/durative_hairstreak" target="_blank" rel="noopener">Apify MCP Suite &rarr;</a>
    </nav>
  </header>`;
}

function renderVendorPage(v, peers) {
  const title = `${v.name} (${v.domain}) Security Audit: Trust Center, Vanta/SafeBase & DMARC Score (${v.auditedAt.slice(0, 4)})`;
  const desc = `Live DNS-over-HTTPS security audit of ${v.name} (${v.domain}): Grade ${v.grade} (${v.score}/100), Trust Center GRC (${v.grcPlatform}), DMARC (${v.dmarcPolicy.toUpperCase()}), SPF, CAA & ${v.emailProvider} MX stack.`;
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Does ${v.name} (${v.domain}) have a public Trust Center (Vanta, SafeBase, or Drata)?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: v.trustCnameTarget
            ? `Yes. Public DNS CNAME verification detected ${v.trustSubdomain} pointing to ${v.trustCnameTarget}, identified as ${v.grcPlatform}.`
            : `No dedicated trust.*, security.*, or compliance.* DNS CNAME portal was detected for ${v.domain} on ${v.auditedAt}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is ${v.name}'s DMARC email spoofing policy and email provider?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${v.domain} enforces DMARC policy "${v.dmarcPolicy}" with SPF ${v.spfPresent ? (v.spfStrict ? 'hardfail (-all)' : 'present') : 'missing'} and routes email through ${v.emailProvider}.`,
        },
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}" />
  <link rel="canonical" href="${BASE_URL}/vendor/${v.slug}.html" />
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${renderHeader('..')}

    <div class="print-banner">
      <div id="printAgencyName" style="font-size:20px;font-weight:800;">External Vendor Security Posture Audit Report</div>
      <div style="font-size:12px;color:#475569;">Prepared for TPRM / QBR Review 路 Audited ${v.auditedAt} via Public DNS-over-HTTPS</div>
    </div>

    <div class="no-print" style="font-size:12.5px;color:var(--muted);margin-bottom:10px;">
      <a class="link" href="../vendors/index.html">&larr; Back to 100+ SaaS Security Benchmark Directory</a> 路 Category: <strong>${escHtml(v.category)}</strong>
    </div>

    <section class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
        <div>
          <h1 style="margin:0 0 6px;font-size:clamp(22px,3.2vw,32px);">${escHtml(v.name)} (<code>${escHtml(v.domain)}</code>) Security Posture Audit</h1>
          <p style="margin:0;color:var(--muted);font-size:14px;">Deterministic public DNS-over-HTTPS audit of Trust Center GRC platform, DMARC/SPF anti-spoofing, CAA certificate controls &amp; MX email infrastructure. Last audited: <strong>${v.auditedAt}</strong>.</p>
        </div>
        <span class="pill ${v.light}" style="font-size:15px;padding:6px 14px;">${v.light} 路 Grade ${v.grade} (${v.score}/100)</span>
      </div>

      <div class="grid">
        <div class="metric"><div class="label">Trust Center / GRC Platform</div><div class="val">${escHtml(v.grcPlatform)}</div><div style="font-size:11.5px;color:var(--muted);margin-top:4px;">${v.trustSubdomain ? escHtml(v.trustSubdomain) + ' &rarr; ' + escHtml(v.trustCnameTarget) : 'No trust.*/security.* CNAME detected'}</div></div>
        <div class="metric"><div class="label">DMARC Anti-Spoofing</div><div class="val">${escHtml(v.dmarcPolicy.toUpperCase())}</div><div style="font-size:11.5px;color:var(--muted);margin-top:4px;">SPF: ${v.spfPresent ? (v.spfStrict ? 'Hardfail (-all)' : 'Present (~all)') : 'Missing'}</div></div>
        <div class="metric"><div class="label">Enterprise Email Stack</div><div class="val">${escHtml(v.emailProvider)}</div><div style="font-size:11.5px;color:var(--muted);margin-top:4px;">${v.mxCount} public MX record(s)</div></div>
        <div class="metric"><div class="label">Certificate Authority Lock (CAA)</div><div class="val">${v.caaPresent ? 'Enforced (' + v.caaCount + ')' : 'Not Set'}</div><div style="font-size:11.5px;color:var(--muted);margin-top:4px;">DNS CAA Policy Check</div></div>
      </div>

      <div class="whitelabel-bar no-print">
        <strong style="font-size:13px;">MSP / TPRM White-Label PDF Export:</strong>
        <input id="agencyInput" type="text" placeholder="Enter your Agency / MSP Name (optional)" oninput="document.getElementById('printAgencyName').textContent = (this.value.trim() ? this.value.trim() + ' 鈥?' : '') + '${escHtml(v.name)} Security Posture Audit Report'" />
        <button class="cta" onclick="window.print()">Print / Save White-Label PDF</button>
        <a class="cta-sec" href="../index.html">Live Re-Audit Any Domain &rarr;</a>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:18px;">Raw Verified DNS &amp; Trust Signals</h2>
      <table>
        <thead><tr><th>Security Control</th><th>Observed Public Record</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>Trust Portal CNAME</strong></td><td><code>${escHtml(v.trustCnameTarget || 'Not detected on trust./security./compliance.')}</code></td><td><span class="pill ${v.trustCnameTarget ? 'GREEN' : 'AMBER'}">${v.trustCnameTarget ? 'DETECTED' : 'NONE'}</span></td></tr>
          <tr><td><strong>DMARC Record</strong></td><td><code>${escHtml(v.dmarcRecord || 'No _dmarc TXT record found')}</code></td><td><span class="pill ${v.dmarcPolicy === 'reject' ? 'GREEN' : v.dmarcPolicy === 'quarantine' ? 'AMBER' : 'RED'}">${escHtml(v.dmarcPolicy.toUpperCase())}</span></td></tr>
          <tr><td><strong>SPF Record</strong></td><td><code>${escHtml(v.spfRecord || 'No v=spf1 TXT record found')}</code></td><td><span class="pill ${v.spfStrict ? 'GREEN' : v.spfPresent ? 'AMBER' : 'RED'}">${v.spfStrict ? 'HARDFAIL' : v.spfPresent ? 'PRESENT' : 'MISSING'}</span></td></tr>
          <tr><td><strong>CAA DNS Policy</strong></td><td><code>${v.caaPresent ? v.caaCount + ' CAA record(s) restricting TLS issuance' : 'No CAA records found'}</code></td><td><span class="pill ${v.caaPresent ? 'GREEN' : 'AMBER'}">${v.caaPresent ? 'ENFORCED' : 'MISSING'}</span></td></tr>
        </tbody>
      </table>

      <h3 style="margin-top:18px;font-size:15px;">Actionable Remediation &amp; Sales/TPRM Notes</h3>
      <ul style="margin:8px 0 0;padding-left:18px;color:var(--muted);font-size:14px;">
        ${v.recommendations.length ? v.recommendations.map((r) => `<li>${escHtml(r)}</li>`).join('') : '<li>All baseline public DNS anti-spoofing, CAA, and Trust Center controls are hardened. Run full Apify API scan to verify live TLS expiry, HTTP HSTS/CSP headers, and /.well-known/security.txt.</li>'}
      </ul>
    </section>

    <section class="card no-print" style="background:linear-gradient(135deg,rgba(14,165,233,.12),rgba(37,99,235,.12));border-color:rgba(56,189,248,.35);">
      <h2 style="margin-top:0;font-size:18px;">Audit 500+ Vendors in Bulk (With TLS Expiry, HSTS/CSP &amp; SOC 2 Page Signals)</h2>
      <p style="color:var(--muted);font-size:14px;margin:4px 0 14px;">Stop paying $200+/mo enterprise minimums to SecurityScorecard or UpGuard for simple TPRM &amp; Clay prospecting checks. Run our zero-WAF Apify Actor &amp; hosted MCP server in seconds.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a class="cta" href="https://apify.com/durative_hairstreak" target="_blank" rel="noopener">Run Bulk Security Auditor on Apify &rarr;</a>
        <a class="cta-sec" href="../alternatives/securityscorecard-upguard-alternative.html">Compare vs SecurityScorecard &amp; UpGuard</a>
      </div>
    </section>

    <section class="card peer-card no-print">
      <h3 style="margin-top:0;font-size:15px;">Compare Other ${escHtml(v.category)} Vendors</h3>
      <div class="peer-list">
        ${peers.map((p) => `<a class="peer-chip" href="./${p.slug}.html">${escHtml(p.name)} 路 <strong>${p.grade}</strong> (${p.score})</a>`).join('')}
      </div>
    </section>

    <footer>
      <span>RiskOps MCP Lab 路 Public DNS-over-HTTPS Benchmark (${v.auditedAt})</span>
      <span>Informational public DNS posture check only 鈥?not an official SOC 2 attestation or security guarantee.</span>
    </footer>
  </div>
</body>
</html>`;
}

function renderDirectoryPage(records) {
  const total = records.length;
  const withTrust = records.filter((r) => r.trustCnameTarget).length;
  const dmarcReject = records.filter((r) => r.dmarcPolicy === 'reject').length;
  const vantaCount = records.filter((r) => r.grcPlatform === 'Vanta').length;
  const safeBaseCount = records.filter((r) => r.grcPlatform.includes('SafeBase') || r.grcPlatform === 'Drata').length;
  const avgScore = Math.round(records.reduce((a, b) => a + b.score, 0) / total);

  const rows = records
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(
      (r) => `<tr data-cat="${escHtml(r.category)}" data-grc="${escHtml(r.grcPlatform)}" data-grade="${r.grade}" data-q="${escHtml((r.name + ' ' + r.domain + ' ' + r.grcPlatform + ' ' + r.category).toLowerCase())}">
        <td><a class="link" href="../vendor/${r.slug}.html"><strong>${escHtml(r.name)}</strong></a><div style="font-size:11.5px;color:var(--muted);">${escHtml(r.domain)}</div></td>
        <td>${escHtml(r.category)}</td>
        <td><span class="pill ${r.light}">${r.grade} 路 ${r.score}</span></td>
        <td>${escHtml(r.grcPlatform)}</td>
        <td><code>${escHtml(r.dmarcPolicy.toUpperCase())}</code></td>
        <td>${escHtml(r.emailProvider)}</td>
        <td><a class="link" href="../vendor/${r.slug}.html">Full Report &amp; PDF &rarr;</a></td>
      </tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Top ${total} SaaS &amp; AI Vendor Security Posture, Trust Center (Vanta/SafeBase/Drata) &amp; DMARC Benchmark (2026)</title>
  <meta name="description" content="Live verified 2026 security posture benchmark of ${total} top SaaS, AI, Cloud &amp; Fintech vendors: Vanta/SafeBase/Drata Trust Center adoption, DMARC reject rates, CAA &amp; exportable white-label PDF reports." />
  <link rel="canonical" href="${BASE_URL}/vendors/index.html" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${renderHeader('..')}
    <section class="card">
      <h1 style="margin:0 0 8px;font-size:clamp(24px,3.6vw,34px);">2026 Top ${total} SaaS &amp; AI Vendor Security Benchmark</h1>
      <p style="margin:0;color:var(--muted);font-size:14.5px;">Live Cloudflare DNS-over-HTTPS audit of <strong>${total} leading B2B SaaS, AI, Cloud &amp; Fintech companies</strong>. Click any vendor for raw DNS evidence and an instant <strong>White-Label MSP/TPRM PDF Audit Report</strong>.</p>
      <div class="grid">
        <div class="metric"><div class="label">Vendors Audited Live</div><div class="val">${total}</div></div>
        <div class="metric"><div class="label">Avg Security Score</div><div class="val">${avgScore}/100</div></div>
        <div class="metric"><div class="label">DMARC p=reject Rate</div><div class="val">${Math.round((dmarcReject / total) * 100)}% (${dmarcReject}/${total})</div></div>
        <div class="metric"><div class="label">Public Trust Subdomain</div><div class="val">${withTrust}/${total} (Vanta: ${vantaCount} 路 SafeBase/Drata: ${safeBaseCount})</div></div>
      </div>
    </section>

    <section class="card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <input id="qInput" type="text" placeholder="Search company, domain, Vanta, SafeBase, Drata..." oninput="filterRows()" style="flex:1;min-width:220px;background:#09101f;border:1px solid var(--border);color:#fff;padding:10px 12px;border-radius:10px;font-size:14px;" />
        <select id="catFilter" onchange="filterRows()" style="background:#09101f;border:1px solid var(--border);color:#fff;padding:10px 12px;border-radius:10px;font-size:13px;">
          <option value="">All Categories</option>
          <option value="AI &amp; LLM">AI &amp; LLM</option>
          <option value="Cloud &amp; DevOps">Cloud &amp; DevOps</option>
          <option value="Security &amp; GRC">Security &amp; GRC</option>
          <option value="Fintech &amp; HR">Fintech &amp; HR</option>
          <option value="Automation &amp; GTM">Automation &amp; GTM</option>
          <option value="Productivity SaaS">Productivity SaaS</option>
        </select>
        <select id="grcFilter" onchange="filterRows()" style="background:#09101f;border:1px solid var(--border);color:#fff;padding:10px 12px;border-radius:10px;font-size:13px;">
          <option value="">All Trust Platforms</option>
          <option value="Vanta">Vanta</option>
          <option value="SafeBase (Drata)">SafeBase (Drata)</option>
          <option value="Drata">Drata</option>
          <option value="None Detected via DNS">No Trust Subdomain</option>
        </select>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Vendor</th><th>Category</th><th>Grade</th><th>Trust Center (DNS)</th><th>DMARC</th><th>Email Stack</th><th>Report</th></tr></thead>
          <tbody id="vendorTbody">${rows}</tbody>
        </table>
      </div>
    </section>

    <footer>
      <span>RiskOps MCP Lab 路 Auto-Generated Live pSEO Security Benchmark</span>
      <span><a class="link" href="../llms.txt">llms.txt</a> 路 <a class="link" href="../sitemap.xml">sitemap.xml</a></span>
    </footer>
  </div>
  <script>
    function filterRows() {
      const q = document.getElementById('qInput').value.trim().toLowerCase();
      const cat = document.getElementById('catFilter').value;
      const grc = document.getElementById('grcFilter').value;
      document.querySelectorAll('#vendorTbody tr').forEach(tr => {
        const okQ = !q || tr.dataset.q.includes(q);
        const okCat = !cat || tr.dataset.cat === cat;
        const okGrc = !grc || tr.dataset.grc === grc;
        tr.style.display = (okQ && okCat && okGrc) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

function renderSecurityAltPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lightweight SecurityScorecard, UpGuard &amp; EasyDMARC Alternative for MSPs, TPRM &amp; Clay (2026)</title>
  <meta name="description" content="Tired of $200+/mo enterprise contracts and per-domain fees from SecurityScorecard, UpGuard, or EasyDMARC? Audit 100+ domains via zero-WAF DNS-over-HTTPS, export white-label PDFs, or automate via Apify MCP." />
  <link rel="canonical" href="${BASE_URL}/alternatives/securityscorecard-upguard-alternative.html" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${renderHeader('..')}
    <section class="card">
      <span class="pill GREEN">2026 MSP &amp; TPRM Alternative Guide</span>
      <h1 style="margin:10px 0 8px;font-size:clamp(24px,3.6vw,34px);">Looking for a Lightweight, Pay-As-You-Go Alternative to SecurityScorecard, UpGuard &amp; EasyDMARC?</h1>
      <p style="color:var(--muted);font-size:15px;">Enterprise attack-surface platforms lock small MSPs, RevOps teams, and security consultants behind forced sales demos and $5,000鈥?20,000/yr retainers. RiskOps MCP Lab gives you instant zero-WAF Trust Center, DMARC/SPF/CAA, TLS &amp; HTTP security header audits with pay-per-domain API pricing and instant white-label PDF reports.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <a class="cta" href="../index.html">Try Free Live Auditor Now &rarr;</a>
        <a class="cta-sec" href="../vendors/index.html">Browse 100+ Audited SaaS Vendors</a>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:19px;">Side-by-Side Comparison: Enterprise Retainers vs. RiskOps MCP Lab</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Capability</th><th>SecurityScorecard / UpGuard</th><th>EasyDMARC / MxToolbox</th><th>RiskOps MCP Lab (Apify + Web)</th></tr></thead>
          <tbody>
            <tr><td><strong>Entry Pricing</strong></td><td>Annual enterprise contract / sales demo</td><td>Rigid per-domain monthly tiers</td><td><strong>Free live web checker + Pay-Per-Event API ($0.015/domain, no monthly lock-in)</strong></td></tr>
            <tr><td><strong>Vanta / SafeBase / Drata Detection</strong></td><td>Limited or enterprise add-on</td><td>Not supported</td><td><strong>Zero-WAF Cloudflare DoH CNAME detection built in</strong></td></tr>
            <tr><td><strong>White-Label MSP PDF Reports</strong></td><td>Enterprise tier only</td><td>Higher MSP tiers only</td><td><strong>Instant browser Print-to-PDF custom agency header</strong></td></tr>
            <tr><td><strong>Claude / Cursor / n8n / Clay Native</strong></td><td>Heavy REST enterprise API</td><td>Manual UI / webhook limited</td><td><strong>1-click Hosted MCP Server + ready n8n/Clay JSON template</strong></td></tr>
            <tr><td><strong>Setup Time</strong></td><td>Days / weeks</td><td>30鈥?0 minutes</td><td><strong>Under 30 seconds 鈥?zero signup for live browser audit</strong></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <footer><span>RiskOps MCP Lab 路 Objective Product Comparison</span><span><a class="link" href="../index.html">Back to Tools Portal</a></span></footer>
  </div>
</body>
</html>`;
}

function renderUptimeAltPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UptimeRobot &amp; Statuspage Alternative for AI &amp; Cloud Dependency SLA Monitoring (2026)</title>
  <meta name="description" content="Frustrated by UptimeRobot legacy price hikes or manual vendor status checking? Monitor 22+ official Cloud &amp; AI Statuspage APIs with merged-interval 30d/90d SLA % math via Pay-As-You-Go Apify MCP &amp; n8n." />
  <link rel="canonical" href="${BASE_URL}/alternatives/uptimerobot-statuspage-alternative.html" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${renderHeader('..')}
    <section class="card">
      <span class="pill AMBER">2026 SRE &amp; Agency Alternative Guide</span>
      <h1 style="margin:10px 0 8px;font-size:clamp(24px,3.6vw,34px);">Escaping UptimeRobot Price Hikes? Automate Third-Party AI &amp; Cloud Vendor SLA Monitoring Without Fixed Monthly Seat Fees</h1>
      <p style="color:var(--muted);font-size:15px;">Modern apps break when upstream vendors (OpenAI, Anthropic, Stripe, GitHub, Cloudflare, Supabase, Vercel) suffer degraded APIs 鈥?not just when your own HTTP endpoint drops. Track 22+ official Statuspage v2 JSON APIs in 1.6 seconds with exact merged-interval 30d/90d SLA math and quiet Slack/n8n breach alerts.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
        <a class="cta" href="../index.html">Open Live AI &amp; Cloud SLA Pulse &rarr;</a>
        <a class="cta-sec" href="https://apify.com/durative_hairstreak" target="_blank" rel="noopener">Connect via Apify MCP / n8n</a>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0;font-size:19px;">Why SRE &amp; AI Engineering Teams Switch</h2>
      <ul style="color:var(--muted);font-size:14.5px;line-height:1.8;">
        <li><strong>Zero forced legacy plan upgrades:</strong> Pay strictly per fleet audit (<code>$0.008</code>/vendor) or run inside free monthly Apify credits.</li>
        <li><strong>Contract-grade SLA math:</strong> Merges overlapping <code>major</code> &amp; <code>critical</code> outage intervals so noisy minor notices never distort your 99.9% SLA report.</li>
        <li><strong>Zero-code Slack / PagerDuty alert template:</strong> Import our included <code>n8n-sla-outage-alert.json</code> in 10 seconds.</li>
      </ul>
    </section>
    <footer><span>RiskOps MCP Lab 路 SRE &amp; AI Infrastructure Reliability</span><span><a class="link" href="../index.html">Back to Tools Portal</a></span></footer>
  </div>
</body>
</html>`;
}

console.log(`Starting live Cloudflare DoH audit across ${SAAS_TARGETS.length} real B2B SaaS / AI domains...`);
const started = Date.now();
const records = await runPool(SAAS_TARGETS, 12, auditDomain);
console.log(`Completed ${records.length} live audits in ${((Date.now() - started) / 1000).toFixed(2)}s.`);

fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), count: records.length, records }, null, 2), 'utf8');

const vendorDir = path.join(DOCS_DIR, 'vendor');
const vendorsIndexDir = path.join(DOCS_DIR, 'vendors');
const altDir = path.join(DOCS_DIR, 'alternatives');
fs.mkdirSync(vendorDir, { recursive: true });
fs.mkdirSync(vendorsIndexDir, { recursive: true });
fs.mkdirSync(altDir, { recursive: true });

// Write 100+ individual pSEO vendor pages
for (const rec of records) {
  const peers = records.filter((x) => x.category === rec.category && x.slug !== rec.slug).slice(0, 10);
  fs.writeFileSync(path.join(vendorDir, `${rec.slug}.html`), renderVendorPage(rec, peers), 'utf8');
}

// Write directory & alternative pages
fs.writeFileSync(path.join(vendorsIndexDir, 'index.html'), renderDirectoryPage(records), 'utf8');
fs.writeFileSync(path.join(altDir, 'securityscorecard-upguard-alternative.html'), renderSecurityAltPage(), 'utf8');
fs.writeFileSync(path.join(altDir, 'uptimerobot-statuspage-alternative.html'), renderUptimeAltPage(), 'utf8');

// Write 2026 llms.txt standard for ChatGPT/Claude/Perplexity citations
const llmsTxt = `# RiskOps MCP Lab 鈥?Official-API B2B Risk, Security, Cloud SLA & Quant Finance Suite

> Live public DNS-over-HTTPS security posture benchmark of ${records.length} leading SaaS & AI vendors, plus 5 hosted zero-proxy Apify & MCP tools for Claude Desktop, Cursor, n8n, and Clay.

## Interactive Free Tools & Directories
- [4-in-1 Live Tools Portal (Vendor Security, SEC 8-K, Cloud SLA & Kelly Calculator)](${BASE_URL}/index.html)
- [Top ${records.length} SaaS & AI Vendor Security Posture & Trust Center Directory](${BASE_URL}/vendors/index.html)
- [SecurityScorecard, UpGuard & EasyDMARC Lightweight Alternative Guide](${BASE_URL}/alternatives/securityscorecard-upguard-alternative.html)
- [UptimeRobot & Statuspage Alternative for AI/Cloud Dependency SLAs](${BASE_URL}/alternatives/uptimerobot-statuspage-alternative.html)

## Hosted Apify & MCP Servers (Zero-Proxy Official APIs)
- SEC 8-K Risk Signals & Corporate Distress Monitor: https://apify.com/durative_hairstreak/sec-8k-risk-signals (MCP: https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals)
- SaaS & Cloud Status Page SLA Uptime Monitor: https://apify.com/durative_hairstreak (22+ official Statuspage v2 APIs)
- B2B Vendor Security Posture & Trust Signal Auditor: https://apify.com/durative_hairstreak (Zero-WAF DoH Vanta/SafeBase/Drata detection, DMARC/SPF/MX, TLS)
- Open-Source Supply-Chain & CVE Risk Auditor: https://apify.com/durative_hairstreak (OSV.dev + CISA KEV + deps.dev OpenSSF)
- Quant Finance, Portfolio Risk, Kelly & DCF Math Engine: https://apify.com/durative_hairstreak (Deterministic Sharpe, Sortino, VaR/CVaR, Half-Kelly, 5x5 DCF, XIRR & Black-Scholes Greeks)

## Featured Live Vendor Security Audits (Sample of ${records.length} Pages)
${records.slice(0, 30).map((r) => `- [${r.name} (${r.domain}) 鈥?Grade ${r.grade} (${r.score}/100), Trust: ${r.grcPlatform}, DMARC: ${r.dmarcPolicy}](${BASE_URL}/vendor/${r.slug}.html)`).join('\n')}
`;
// Keep enriched llms.txt (includes LocalLedger + 112 SaaS) intact

// Write robots.txt & complete sitemap.xml
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${BASE_URL}/`,
  `${BASE_URL}/vendors/index.html`,
  `${BASE_URL}/alternatives/securityscorecard-upguard-alternative.html`,
  `${BASE_URL}/alternatives/uptimerobot-statuspage-alternative.html`,
  ...records.map((r) => `${BASE_URL}/vendor/${r.slug}.html`),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>
`;
// Preserve full 155-URL sitemap by only refreshing lastmod dates cleanly
const smPath = path.join(DOCS_DIR, 'sitemap.xml');
if (fs.existsSync(smPath)) { const cur = fs.readFileSync(smPath, 'utf8').replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, '<lastmod>' + today + '</lastmod>'); fs.writeFileSync(smPath, cur, 'utf8'); } else { fs.writeFileSync(smPath, sitemapXml, 'utf8'); }
fs.writeFileSync(path.join(DOCS_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`, 'utf8');

const summary = {
  totalAudited: records.length,
  totalUrlsInSitemap: urls.length,
  withTrustPortal: records.filter((r) => r.trustCnameTarget).length,
  dmarcReject: records.filter((r) => r.dmarcPolicy === 'reject').length,
  vantaDetected: records.filter((r) => r.grcPlatform === 'Vanta').length,
  safeBaseOrDrataDetected: records.filter((r) => r.grcPlatform.includes('SafeBase') || r.grcPlatform === 'Drata').length,
  missingDmarcOrNone: records.filter((r) => r.dmarcPolicy === 'missing' || r.dmarcPolicy === 'none').length,
};
console.log(JSON.stringify(summary, null, 2));

