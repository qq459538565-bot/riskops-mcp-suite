#!/usr/bin/env node
/**
 * RiskOps Local MCP Server (Zero-Dependency Stdio JSON-RPC 2.0)
 * Official public APIs only: Cloudflare DoH, SEC EDGAR EFTS, Google OSV.dev, deterministic IEEE-754 quant math.
 * For batch enterprise workloads (100+ domains / continuous 8-K monitoring), see https://apify.com/durative_hairstreak
 */
import readline from 'node:readline';

const SERVER_INFO = {
  name: 'riskops-mcp-suite',
  version: '1.0.0'
};

const PROTOCOL_VERSION = '2024-11-05';
const USER_AGENT = 'RiskOpsStudioMCP/1.0 (https://qq459538565-bot.github.io/riskops-mcp-suite/; qq459538565@gmail.com)';

const TOOLS = [
  {
    name: 'audit_vendor_security',
    description: 'Audit a B2B SaaS domain security posture via live Cloudflare DNS-over-HTTPS (DMARC, SPF, CAA, MX, and Trust Center CNAME fingerprinting for Vanta/Drata/SafeBase/HyperComply). Read-only, no API key required.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Apex domain to audit, e.g. "stripe.com" or "anthropic.com"'
        }
      },
      required: ['domain']
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  {
    name: 'calculate_quant_risk_dcf',
    description: 'Deterministic institutional finance engine: computes 5-year DCF intrinsic value per share, Half-Kelly optimal position sizing, and Sharpe/Max Drawdown from periodic returns. Eliminates LLM arithmetic errors.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['dcf', 'kelly', 'portfolio_stats'],
          description: 'Calculation mode: dcf, kelly, or portfolio_stats'
        },
        fcfBase: { type: 'number', description: 'DCF: Base annual free cash flow (in millions)' },
        growthRate: { type: 'number', description: 'DCF: Annual FCF growth rate decimal (e.g. 0.12 for 12%)' },
        wacc: { type: 'number', description: 'DCF: Discount rate decimal (e.g. 0.095 for 9.5%)' },
        terminalGrowth: { type: 'number', description: 'DCF: Perpetual growth rate decimal (e.g. 0.025 for 2.5%)' },
        netDebt: { type: 'number', description: 'DCF: Net debt in millions (negative for net cash)', default: 0 },
        sharesOut: { type: 'number', description: 'DCF: Diluted shares outstanding in millions', default: 100 },
        winProb: { type: 'number', description: 'Kelly: Win probability between 0 and 1 (e.g. 0.55)' },
        winLossRatio: { type: 'number', description: 'Kelly: Average win / average loss payoff ratio (e.g. 1.8)' },
        returns: {
          type: 'array',
          items: { type: 'number' },
          description: 'portfolio_stats: Array of periodic decimal returns (e.g. [0.02, -0.01, 0.035])'
        },
        periodsPerYear: { type: 'number', description: 'portfolio_stats: 252 daily, 52 weekly, 12 monthly', default: 12 }
      },
      required: ['mode']
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'search_sec_8k_risk_filings',
    description: 'Query official US SEC EDGAR EFTS for recent Form 8-K corporate risk disclosures (Item 1.05 cyber breaches, 4.02 restatements, 4.01 auditor exits, 5.02 C-suite departures, 1.03 bankruptcy). Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name, ticker, or risk keyword (e.g. "cybersecurity", "restatement", "Nvidia")'
        },
        daysBack: {
          type: 'number',
          description: 'Lookback window in days (1 to 90, default 14)',
          default: 14
        },
        limit: {
          type: 'number',
          description: 'Max filings returned (1 to 10, default 5)',
          default: 5
        }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  {
    name: 'audit_oss_package_cve',
    description: 'Query Google OSV.dev official vulnerability database for known CVEs affecting an open-source package and version (npm, PyPI, Go, Maven, crates.io). Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        ecosystem: {
          type: 'string',
          enum: ['npm', 'PyPI', 'Go', 'Maven', 'crates.io'],
          description: 'Package ecosystem'
        },
        packageName: {
          type: 'string',
          description: 'Exact package name (e.g. "lodash", "requests")'
        },
        version: {
          type: 'string',
          description: 'Optional package version (e.g. "4.17.20")'
        }
      },
      required: ['ecosystem', 'packageName']
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  }
];

function cleanDomain(raw) {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
  if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned)) {
    throw new Error(`Invalid domain format: "${raw}"`);
  }
  return cleaned;
}

async function dohQuery(name, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/dns-json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`DoH HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.Answer) ? data.Answer.map((a) => String(a.data || '').replace(/^"|"$/g, '')) : [];
}

async function runAuditVendorSecurity({ domain }) {
  const apex = cleanDomain(domain);
  const [dmarcRecs, txtRecs, caaRecs, mxRecs, trustCname, secCname] = await Promise.all([
    dohQuery(`_dmarc.${apex}`, 'TXT').catch(() => []),
    dohQuery(apex, 'TXT').catch(() => []),
    dohQuery(apex, 'CAA').catch(() => []),
    dohQuery(apex, 'MX').catch(() => []),
    dohQuery(`trust.${apex}`, 'CNAME').catch(() => []),
    dohQuery(`security.${apex}`, 'CNAME').catch(() => [])
  ]);

  const dmarc = dmarcRecs.find((r) => /v=DMARC1/i.test(r)) || null;
  const dmarcPolicyMatch = dmarc ? dmarc.match(/\bp=(none|quarantine|reject)\b/i) : null;
  const dmarcPolicy = dmarcPolicyMatch ? dmarcPolicyMatch[1].toLowerCase() : 'missing';

  const spf = txtRecs.find((r) => /v=spf1/i.test(r)) || null;
  const spfHardFail = spf ? /-all\b/i.test(spf) : false;
  const spfSoftFail = spf ? /~all\b/i.test(spf) : false;

  const allCnames = [...trustCname, ...secCname].join(' ').toLowerCase();
  let trustPlatform = null;
  if (/vanta/.test(allCnames)) trustPlatform = 'Vanta';
  else if (/drata/.test(allCnames)) trustPlatform = 'Drata';
  else if (/safebase/.test(allCnames)) trustPlatform = 'SafeBase';
  else if (/hypercomply/.test(allCnames)) trustPlatform = 'HyperComply';
  else if (/conveyor/.test(allCnames)) trustPlatform = 'Conveyor';
  else if (trustCname.length || secCname.length) trustPlatform = 'Custom/Other Trust Subdomain';

  let score = 0;
  if (dmarcPolicy === 'reject') score += 40;
  else if (dmarcPolicy === 'quarantine') score += 25;
  else if (dmarcPolicy === 'none') score += 10;

  if (spfHardFail) score += 25;
  else if (spfSoftFail) score += 18;
  else if (spf) score += 10;

  if (caaRecs.length > 0) score += 15;
  if (trustPlatform) score += 20;

  const gaps = [];
  if (dmarcPolicy !== 'reject') gaps.push(`DMARC policy is "${dmarcPolicy}" (recommend p=reject to prevent domain spoofing)`);
  if (!spf) gaps.push('Missing SPF TXT record');
  if (caaRecs.length === 0) gaps.push('No DNS CAA certificate authority restriction found');
  if (!trustPlatform) gaps.push('No public trust.<domain> or security.<domain> Trust Center CNAME detected');

  return {
    domain: apex,
    postureScore: score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D',
    dmarcPolicy,
    dmarcRecord: dmarc,
    spfPresent: Boolean(spf),
    spfMode: spfHardFail ? 'hardfail (-all)' : spfSoftFail ? 'softfail (~all)' : spf ? 'other' : 'missing',
    caaCount: caaRecs.length,
    mxCount: mxRecs.length,
    trustCenterPlatform: trustPlatform,
    gaps,
    batchAuditTip: 'Need bulk 100+ vendor audits with TLS/headers/SOC2 checks? Use https://apify.com/durative_hairstreak/b2b-vendor-security-auditor'
  };
}

function runQuantRiskDcf(args) {
  const { mode } = args;
  if (mode === 'dcf') {
    const fcfBase = Number(args.fcfBase);
    const g = Number(args.growthRate);
    const wacc = Number(args.wacc);
    const tg = Number(args.terminalGrowth ?? 0.025);
    const netDebt = Number(args.netDebt ?? 0);
    const sharesOut = Number(args.sharesOut ?? 100);
    if (!Number.isFinite(fcfBase) || !Number.isFinite(g) || !Number.isFinite(wacc)) {
      throw new Error('dcf mode requires numeric fcfBase, growthRate, and wacc');
    }
    if (wacc <= tg) throw new Error('wacc must be strictly greater than terminalGrowth');
    if (sharesOut <= 0) throw new Error('sharesOut must be > 0');

    let pvFcf = 0;
    const yearly = [];
    let fcf = fcfBase;
    for (let y = 1; y <= 5; y++) {
      fcf = fcf * (1 + g);
      const pv = fcf / Math.pow(1 + wacc, y);
      pvFcf += pv;
      yearly.push({ year: y, projectedFcf: Number(fcf.toFixed(2)), presentValue: Number(pv.toFixed(2)) });
    }
    const terminalValue = (fcf * (1 + tg)) / (wacc - tg);
    const pvTerminal = terminalValue / Math.pow(1 + wacc, 5);
    const enterpriseValue = pvFcf + pvTerminal;
    const equityValue = enterpriseValue - netDebt;
    const intrinsicPerShare = equityValue / sharesOut;

    return {
      mode: 'dcf',
      pv5YrCashFlows: Number(pvFcf.toFixed(2)),
      terminalValue: Number(terminalValue.toFixed(2)),
      pvTerminalValue: Number(pvTerminal.toFixed(2)),
      enterpriseValue: Number(enterpriseValue.toFixed(2)),
      equityValue: Number(equityValue.toFixed(2)),
      intrinsicValuePerShare: Number(intrinsicPerShare.toFixed(2)),
      yearly
    };
  }

  if (mode === 'kelly') {
    const p = Number(args.winProb);
    const b = Number(args.winLossRatio);
    if (!Number.isFinite(p) || p <= 0 || p >= 1 || !Number.isFinite(b) || b <= 0) {
      throw new Error('kelly mode requires winProb in (0,1) and winLossRatio > 0');
    }
    const fullKelly = p - (1 - p) / b;
    const clampedFull = Math.max(0, fullKelly);
    return {
      mode: 'kelly',
      expectedValuePerUnitRisk: Number((p * b - (1 - p)).toFixed(4)),
      fullKellyFraction: Number(clampedFull.toFixed(4)),
      halfKellyFraction: Number((clampedFull / 2).toFixed(4)),
      quarterKellyFraction: Number((clampedFull / 4).toFixed(4)),
      positiveEdge: fullKelly > 0
    };
  }

  if (mode === 'portfolio_stats') {
    const rets = Array.isArray(args.returns) ? args.returns.map(Number).filter(Number.isFinite) : [];
    const ppy = Number(args.periodsPerYear ?? 12);
    if (rets.length < 2) throw new Error('portfolio_stats requires at least 2 numeric returns');
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (rets.length - 1);
    const std = Math.sqrt(variance);
    const annReturn = Math.pow(rets.reduce((eq, r) => eq * (1 + r), 1), ppy / rets.length) - 1;
    const annVol = std * Math.sqrt(ppy);
    const sharpe = std > 0 ? (mean / std) * Math.sqrt(ppy) : 0;

    let equity = 1;
    let peak = 1;
    let maxDd = 0;
    for (const r of rets) {
      equity *= 1 + r;
      if (equity > peak) peak = equity;
      const dd = (peak - equity) / peak;
      if (dd > maxDd) maxDd = dd;
    }

    return {
      mode: 'portfolio_stats',
      observations: rets.length,
      cumulativeReturn: Number((equity - 1).toFixed(4)),
      annualizedReturn: Number(annReturn.toFixed(4)),
      annualizedVolatility: Number(annVol.toFixed(4)),
      sharpeRatioZeroRf: Number(sharpe.toFixed(3)),
      maxDrawdown: Number(maxDd.toFixed(4))
    };
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

async function runSearchSec8k({ query, daysBack = 14, limit = 5 }) {
  const safeDays = Math.min(90, Math.max(1, Number(daysBack) || 14));
  const safeLimit = Math.min(10, Math.max(1, Number(limit) || 5));
  const end = new Date();
  const start = new Date(end.getTime() - safeDays * 86400 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(String(query || ''))}&forms=8-K&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error(`SEC EDGAR EFTS HTTP ${res.status}`);
  const data = await res.json();
  const hits = Array.isArray(data?.hits?.hits) ? data.hits.hits.slice(0, safeLimit) : [];
  const filings = hits.map((h) => {
    const src = h._source || {};
    return {
      company: Array.isArray(src.display_names) ? src.display_names[0] : src.entity_name || 'Unknown',
      form: src.form || '8-K',
      filedDate: src.file_date || '',
      items: Array.isArray(src.items) ? src.items : [],
      accessionNo: src.adsh || '',
      edgarUrl: src.adsh && Array.isArray(src.ciks) && src.ciks[0]
        ? `https://www.sec.gov/Archives/edgar/data/${Number(src.ciks[0])}/${String(src.adsh).replace(/-/g, '')}/`
        : 'https://www.sec.gov/edgar/searchedgar/companysearch'
    };
  });

  return {
    query,
    dateRange: `${fmt(start)}..${fmt(end)}`,
    totalMatches: data?.hits?.total?.value ?? filings.length,
    returned: filings.length,
    filings,
    hostedTip: 'For automated Item 1.05/4.02/5.02 severity scoring & Slack webhooks, see https://apify.com/durative_hairstreak/sec-8k-risk-signals'
  };
}

async function runAuditOssCve({ ecosystem, packageName, version }) {
  const payload = { package: { ecosystem, name: String(packageName).trim() } };
  if (version) payload.version = String(version).trim();
  const res = await fetch('https://api.osv.dev/v1/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`OSV.dev HTTP ${res.status}`);
  const data = await res.json();
  const vulns = Array.isArray(data.vulns) ? data.vulns : [];
  return {
    ecosystem,
    packageName,
    version: version || 'all',
    vulnerabilityCount: vulns.length,
    riskLevel: vulns.length === 0 ? 'CLEAN' : vulns.length >= 5 ? 'HIGH' : 'MODERATE',
    topVulnerabilities: vulns.slice(0, 8).map((v) => ({
      id: v.id,
      aliases: v.aliases || [],
      summary: v.summary || '',
      modified: v.modified || ''
    }))
  };
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

async function handleRequest(req) {
  const { id, method, params } = req;
  if (method === 'notifications/initialized' || method === 'initialized') return;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO
        }
      });
      return;
    }

    if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
      return;
    }

    if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};
      let output;
      if (toolName === 'audit_vendor_security') output = await runAuditVendorSecurity(args);
      else if (toolName === 'calculate_quant_risk_dcf') output = runQuantRiskDcf(args);
      else if (toolName === 'search_sec_8k_risk_filings') output = await runSearchSec8k(args);
      else if (toolName === 'audit_oss_package_cve') output = await runAuditOssCve(args);
      else throw new Error(`Unknown tool: ${toolName}`);

      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          isError: false
        }
      });
      return;
    }

    if (id !== undefined) {
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      });
    }
  } catch (err) {
    if (id !== undefined) {
      if (method === 'tools/call') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true
          }
        });
      } else {
        send({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: err.message }
        });
      }
    }
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed);
    handleRequest(req);
  } catch (err) {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `Parse error: ${err.message}` } });
  }
});
