import {
  auditDomain,
  buildCsvExport,
  buildMarkdownBrief,
  buildPrintableReportHtml,
  detectTechSignalsFromHtml,
  extractRootDomain,
} from './src/securityEngine.mjs';

let lastAudit = null;
let lastSignals = null;
let bulkResults = [];
let proState = { isPro: false, agencyName: '', licenseKey: '' };

const $ = (id) => document.getElementById(id);

function loadStorage() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['vendorsec_pro'], (res) => {
        if (res?.vendorsec_pro) proState = { ...proState, ...res.vendorsec_pro };
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function saveStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ vendorsec_pro: proState });
  }
}

function syncProUi() {
  const badge = $('tierBadge');
  badge.textContent = proState.isPro ? 'PRO' : 'FREE';
  badge.classList.toggle('pro', proState.isPro);
  $('agencyInput').value = proState.agencyName || '';
  $('licenseInput').value = proState.licenseKey || '';
}

async function inspectActiveTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) return { domain: '', signals: null };
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return { domain: '', signals: null };
    const domain = extractRootDomain(tab.url);
    let signals = null;
    if (domain && tab.id && chrome.scripting?.executeScript && /^https?:\/\//i.test(tab.url)) {
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            html: document.documentElement?.outerHTML?.slice(0, 120000) || '',
            links: Array.from(document.querySelectorAll('a[href]')).slice(0, 200).map((a) => a.href),
          }),
        });
        if (result) signals = detectTechSignalsFromHtml(result.html, result.links);
      } catch {
        // Restricted chrome:// or extension page
      }
    }
    return { domain, signals };
  } catch {
    return { domain: '', signals: null };
  }
}

function renderAudit(audit, signals) {
  lastAudit = audit;
  lastSignals = signals;
  $('resultBox').classList.remove('hidden');
  $('resDomain').textContent = audit.domain;
  $('resMeta').textContent = `Audited ${audit.auditedAt} · Zero-Upload Public DoH`;
  const scoreEl = $('resScoreBadge');
  scoreEl.textContent = `${audit.score} · ${audit.grade}`;
  scoreEl.className = `score-badge ${audit.light}`;

  $('resGrc').textContent = audit.trustSubdomain
    ? `${audit.grcPlatform} (${audit.trustSubdomain})`
    : audit.grcPlatform;
  $('resDmarc').textContent = audit.dmarcPolicy === 'missing' ? 'Missing' : `p=${audit.dmarcPolicy}`;
  $('resEmail').textContent = `${audit.emailProvider} · SPF ${audit.spfPresent ? (audit.spfStrict ? '-all' : '~all') : 'none'}`;
  $('resCaa').textContent = audit.caaPresent ? `Protected (${audit.caaCount})` : 'Missing';

  if (signals) {
    $('signalsBox').classList.remove('hidden');
    const stackStr = signals.stack.length ? signals.stack.join(', ') : 'Custom / minimal';
    $('resSignals').textContent = `Stack: ${stackStr} | ATS: ${signals.ats} | Pricing: ${signals.hasPricingLink ? 'Yes' : 'No'} | Careers: ${signals.hasCareersLink ? 'Yes' : 'No'}`;
  } else {
    $('signalsBox').classList.add('hidden');
  }

  const ul = $('resFlags');
  ul.innerHTML = '';
  const items = audit.flags.length ? audit.flags : ['No major DNS hygiene gaps detected — strong enterprise baseline.'];
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  }
}

async function runSingleScan(domainVal, signals = null) {
  const clean = extractRootDomain(domainVal);
  if (!clean) {
    $('statusMsg').textContent = 'Enter a valid public domain (e.g., openai.com, stripe.com).';
    return;
  }
  $('scanBtn').disabled = true;
  $('statusMsg').textContent = `Querying live Cloudflare DoH for ${clean}...`;
  try {
    const audit = await auditDomain(clean);
    renderAudit(audit, signals);
    $('statusMsg').textContent = `Live audit completed for ${clean}.`;
  } catch (err) {
    $('statusMsg').textContent = err.message || 'Audit failed. Check connection.';
  } finally {
    $('scanBtn').disabled = false;
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-tab');
    ['single', 'bulk', 'pro'].forEach((id) => {
      $(`pane-${id}`).classList.toggle('hidden', id !== target);
    });
  });
});

$('scanBtn').addEventListener('click', () => runSingleScan($('domainInput').value, null));
$('domainInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSingleScan($('domainInput').value, null);
});

$('copyBriefBtn').addEventListener('click', async () => {
  if (!lastAudit) return;
  const md = buildMarkdownBrief(lastAudit, lastSignals);
  await navigator.clipboard.writeText(md);
  $('statusMsg').textContent = 'Markdown security brief copied to clipboard!';
});

$('printReportBtn').addEventListener('click', () => {
  if (!lastAudit) return;
  const agency = proState.isPro ? proState.agencyName : '';
  const html = buildPrintableReportHtml(lastAudit, lastSignals, agency);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
});

$('bulkRunBtn').addEventListener('click', async () => {
  const rawList = $('bulkInput')
    .value.split(/[\r\n,;]+/)
    .map((x) => extractRootDomain(x))
    .filter(Boolean);
  const unique = [...new Set(rawList)];
  if (!unique.length) {
    $('bulkStatus').textContent = 'Paste at least 1 valid domain.';
    return;
  }
  const limit = proState.isPro ? 50 : 3;
  const slice = unique.slice(0, limit);
  $('bulkRunBtn').disabled = true;
  $('bulkExportBtn').classList.add('hidden');
  bulkResults = [];
  for (let i = 0; i < slice.length; i++) {
    $('bulkStatus').textContent = `Auditing ${i + 1}/${slice.length}: ${slice[i]}...`;
    try {
      bulkResults.push(await auditDomain(slice[i]));
    } catch {
      // skip invalid
    }
  }
  const rows = bulkResults
    .map(
      (r) =>
        `<tr><td>${r.domain}</td><td><strong>${r.score}</strong> (${r.grade})</td><td>${r.grcPlatform.split(' ')[0]}</td><td>${r.dmarcPolicy}</td></tr>`
    )
    .join('');
  $('bulkTableWrap').innerHTML = `<table class="bulk-table"><thead><tr><th>Domain</th><th>Score</th><th>GRC</th><th>DMARC</th></tr></thead><tbody>${rows}</tbody></table>`;
  $('bulkExportBtn').classList.remove('hidden');
  $('bulkStatus').textContent =
    unique.length > limit && !proState.isPro
      ? `Completed ${slice.length} Free preview domains (activate Pro to batch up to 50).`
      : `Completed ${bulkResults.length} live domain audits.`;
  $('bulkRunBtn').disabled = false;
});

$('bulkExportBtn').addEventListener('click', () => {
  if (!bulkResults.length) return;
  const csv = buildCsvExport(bulkResults);
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vendorsec-batch-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
});

$('saveProBtn').addEventListener('click', () => {
  const key = $('licenseInput').value.trim();
  const agency = $('agencyInput').value.trim();
  proState.agencyName = agency;
  if (/^VSEC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(key)) {
    proState.isPro = true;
    proState.licenseKey = key.toUpperCase();
    $('proMsg').textContent = 'Pro License activated! 50-domain batch CSV & White-Label PDF unlocked.';
  } else if (!key) {
    proState.isPro = false;
    proState.licenseKey = '';
    $('proMsg').textContent = 'Settings saved (Free tier active).';
  } else {
    $('proMsg').textContent = 'Invalid key format. Expected VSEC-XXXX-XXXX-XXXX.';
  }
  saveStorage();
  syncProUi();
});

(async function boot() {
  await loadStorage();
  syncProUi();
  const { domain, signals } = await inspectActiveTab();
  if (domain) {
    $('domainInput').value = domain;
    await runSingleScan(domain, signals);
  } else {
    $('domainInput').value = 'openai.com';
    $('statusMsg').textContent = 'Not on a public website — try scanning openai.com or any B2B domain.';
  }
})();
