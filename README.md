# RiskOps MCP Suite — Local & Hosted B2B Risk, SEC 8-K, Vendor Security, OSS CVE & Quant Finance MCP Server

[![Glama MCP Server](https://glama.ai/mcp/servers/qq459538565-bot/riskops-mcp-suite/badges/score.svg)](https://glama.ai/mcp/servers/qq459538565-bot/riskops-mcp-suite)
[![Live Edge MCP & REST API](https://img.shields.io/badge/Live%20Remote%20MCP%20%26%20API-api.localledgerstudio.xyz-f59e0b?style=flat-square)](https://api.localledgerstudio.xyz/health)
[![Apify Store](https://img.shields.io/badge/Apify%20Store-6%20Hosted%20MCP%20Actors-00a86b?style=flat-square)](https://apify.com/durative_hairstreak)
[![Live Free Tools Portal](https://img.shields.io/badge/Free%20Tools%20%26%201%2C149%20Pages-Live%20HTTPS-0ea5e9?style=flat-square)](https://qq459538565-bot.github.io/riskops-mcp-suite/)
[![LocalLedger Studio](https://img.shields.io/badge/LocalLedger%20Studio-Offline%20Finance%20Tools-10b981?style=flat-square)](https://www.localledgerstudio.xyz/)
[![TickTieLocal](https://img.shields.io/badge/TickTieLocal-Offline%20Audit%20Matcher-6366f1?style=flat-square)](https://qq459538565-bot.github.io/riskops-mcp-suite/tick-tie/index.html)

> **Launch Free Interactive Browser Tools, Live Edge API & Empirical Benchmarks (100% Public Data, No Signup):**  
> - **Instant Zero-Install Remote MCP Endpoint (Streamable HTTP, 5 Tools):** `https://api.localledgerstudio.xyz/mcp` · [OpenAPI 3.0.3 Spec](https://api.localledgerstudio.xyz/openapi-rapidapi.json) · [Health Check](https://api.localledgerstudio.xyz/health)  
> - **2026 YC 1,200-Startup Security & DMARC Benchmark (39.3% DMARC Gap + Free 100-Row CSV):** https://qq459538565-bot.github.io/riskops-mcp-suite/reports/yc-2026-security-benchmark.html  
> - **Searchable Top 1,000 Y Combinator Security & Trust Center Directory:** https://qq459538565-bot.github.io/riskops-mcp-suite/vendors/yc-1000.html  
> - **RiskOps 4-in-1 Live Portal (Vendor Security, SEC 8-K, Cloud SLA, Quant):** https://qq459538565-bot.github.io/riskops-mcp-suite/  
> - **LocalLedger Offline Bank PDF -> CSV:** https://qq459538565-bot.github.io/riskops-mcp-suite/bank-converter/index.html  
> - **TickTieLocal Offline Audit Matcher (DataSnipper Alternative):** https://qq459538565-bot.github.io/riskops-mcp-suite/tick-tie/index.html  
> - **2026 State of SaaS & AI Security Report (112 Companies + 24 AI Firms):** https://qq459538565-bot.github.io/riskops-mcp-suite/reports/state-of-saas-security-2026.html

Production-grade, zero-proxy **B2B Financial Risk, Cloud SLA, Vendor Security, OSS Supply-Chain & Quantitative Finance** MCP tools built on 100% public official APIs (`data.sec.gov`, `efts.sec.gov`, Cloudflare DoH, Atlassian Statuspage v2 JSON, Google OSV.dev, CISA KEV, and deterministic IEEE-754 financial math).

Connect instantly over **Streamable HTTP Remote MCP** (`https://api.localledgerstudio.xyz/mcp` — zero install, free rate-limited sandbox), run locally with **zero npm dependencies**, or scale to 500+ batch workloads via **Apify Hosted MCP** or a **Direct Commercial API Key**.

---

## Option 0: Instant Zero-Install Remote MCP & Edge REST API (Free Sandbox · 0ms Cold Start)

Test all 5 core engines immediately in Claude Desktop, Cursor, Windsurf, Cline, or n8n without cloning anything or creating an account (free public sandbox: `15 req/min`, up to `3` items/call; for high-volume batch runs, use a [Direct Pro API Key (`$19/mo`)](https://www.localledgerstudio.xyz/#api) or Apify Pay-Per-Event below):

```json
{
  "mcpServers": {
    "riskops-edge-remote": {
      "url": "https://api.localledgerstudio.xyz/mcp"
    }
  }
}
```

### 1-Line REST API Smoke Test (OpenAPI 3.0.3: `https://api.localledgerstudio.xyz/openapi-rapidapi.json`)

```bash
curl -X POST "https://api.localledgerstudio.xyz/v1/security/audit" \
  -H "Content-Type: application/json" \
  -d '{"domains":["openai.com"],"checkCompliancePages":false,"checkSecurityTxt":false}'
```

Available live REST routes on `https://api.localledgerstudio.xyz`: `GET /health`, `GET /openapi-rapidapi.json`, `POST /mcp`, `POST /v1/security/audit`, `POST /v1/sla/check`, `POST /v1/oss/audit`, `POST /v1/quant/compute`, `POST /v1/sec/8k-risk`.

---

## Option 1: Run Locally (Zero-Dependency Node.js Stdio MCP Server)

Requires Node.js >= 18. No API keys, no npm install required.

```bash
git clone https://github.com/qq459538565-bot/riskops-mcp-suite.git
cd riskops-mcp-suite/mcp-server
npm test   # runs 6/6 live MCP stdio E2E checks
```

### Claude Desktop / Cursor / Windsurf Config

```json
{
  "mcpServers": {
    "riskops-local": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/riskops-mcp-suite/mcp-server/index.mjs"]
    }
  }
}
```

### Included Local MCP Tools (`readOnlyHint: true`, Free Single Lookups)

| Tool | What It Does | Data Source |
| :--- | :--- | :--- |
| `audit_vendor_security` | Audits DMARC, SPF, CAA, MX, and Trust Center CNAMEs (Vanta/Drata/SafeBase/HyperComply) -> 0–100 score & gaps | Live Cloudflare DoH |
| `search_sec_8k_risk_filings` | Searches US SEC EDGAR Form 8-K disclosures (Item 1.05 cyber breaches, 4.02 restatements, 4.01 auditor exits, 5.02 C-suite) | Official SEC EDGAR EFTS |
| `check_cloud_sla_status` | Live operational status & active incidents for OpenAI, Anthropic, GitHub, Cloudflare, Vercel, Supabase, Datadog, or custom Statuspage v2 URLs | Official Statuspage v2 JSON |
| `audit_oss_package_cve` | Checks npm, PyPI, Go, Maven, or crates.io package versions for known CVEs | Official Google OSV.dev |
| `calculate_quant_risk_dcf` | Deterministic 5-yr DCF intrinsic value, Half-Kelly sizing, and Sharpe/Max Drawdown stats | Pure IEEE-754 math |

---

## Option 2: Hosted Apify & Streamable-HTTP MCP Matrix (Pay-Per-Event Batch & Autonomous Agent Workloads)

All **6 hosted Actors** are **PUBLIC & Pay-Per-Event LIVE** on Apify Store with **limited permissions** — compatible with both standard Apify Bearer tokens and autonomous agent spend-capped prepaid tokens via `agi.apify.com`:

| Tool | Live Apify Store & MCP Slug | Pay-Per-Event Pricing | Best For |
| :--- | :--- | :--- | :--- |
| **1. Global Entity KYB, LEI & Sanctions Gatekeeper** *(Flagship Compliance)* | [Apify Store](https://apify.com/durative_hairstreak/global-entity-kyb-sanctions-gatekeeper) · `durative_hairstreak/global-entity-kyb-sanctions-gatekeeper` | `$0.005` start + `$0.025`/entity | Pre-payment & KYB gatekeeper screening live against US OFAC SDN/Non-SDN, UN Sanctions, GLEIF LEI & SEC EDGAR (`CLEAR`/`REVIEW`/`BLOCK`) |
| **2. B2B Vendor Security Posture & Trust Signal Auditor** *(Flagship Batch)* | [Apify Store](https://apify.com/durative_hairstreak/b2b-vendor-security-auditor) · `durative_hairstreak/b2b-vendor-security-auditor` | `$0.005` start + `$0.015`/domain | Clay / RevOps / TPRM bulk enrichment (500+ domains: Vanta/SafeBase/Drata fingerprinting, DMARC/SPF/TLS/headers) |
| **3. SEC 8-K Risk Signals & Corporate Distress Monitor** *(Flagship Monitor)* | [Apify Store](https://apify.com/durative_hairstreak/sec-8k-risk-signals) · `durative_hairstreak/sec-8k-risk-signals` | `$0.005` start + `$0.012`/filing | Quant/AI Agents, Cyber GTM (`Item 1.05`), Forensic Accounting (`4.02`/`4.01`/`5.02`/`1.03`/`3.01` + comment letters) |
| **4. SaaS & Cloud Status Page SLA Uptime Monitor** | [Apify Store](https://apify.com/durative_hairstreak/saas-status-sla-monitor) · `durative_hairstreak/saas-status-sla-monitor` | `$0.005` start + `$0.008`/vendor | SRE / DevOps monitoring 22+ vendors with merged-interval 30d/90d contractual SLA % math |
| **5. Open-Source Supply-Chain & CVE Risk Auditor** | [Apify Store](https://apify.com/durative_hairstreak/oss-dependency-risk-auditor) · `durative_hairstreak/oss-dependency-risk-auditor` | `$0.005` start + `$0.008`/package | AI Coding Agents & CI/CD pre-install gating (OSV.dev CVEs, CISA KEV active exploits, SPDX, OpenSSF) |
| **6. Quant Finance, Portfolio Risk, Kelly & DCF Math Engine** | [Apify Store](https://apify.com/durative_hairstreak/quant-portfolio-dcf-math-engine) · `durative_hairstreak/quant-portfolio-dcf-math-engine` | `$0.005` start + `$0.005`/calc | Sandbox-free agents & workflows needing Sharpe/Sortino/VaR, Half-Kelly, 5×5 DCF, XIRR & Black-Scholes Greeks |

### Connect All 6 Hosted Tools in One Streamable-HTTP MCP Entry (Claude / Cursor / Windsurf)

```json
{
  "mcpServers": {
    "riskops-6-in-1": {
      "url": "https://mcp.apify.com/?actors=durative_hairstreak/global-entity-kyb-sanctions-gatekeeper,durative_hairstreak/b2b-vendor-security-auditor,durative_hairstreak/sec-8k-risk-signals,durative_hairstreak/saas-status-sla-monitor,durative_hairstreak/oss-dependency-risk-auditor,durative_hairstreak/quant-portfolio-dcf-math-engine",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

### Clay HTTP API / n8n 1-Call Bulk B2B Security Enrichment (`$0.015`/domain)

```bash
curl -X POST "https://api.apify.com/v2/acts/durative_hairstreak~b2b-vendor-security-auditor/run-sync-get-dataset-items?token=YOUR_APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domains":["openai.com","anthropic.com","linear.app"],"checkCompliancePages":true,"checkSecurityTxt":true,"maxPostureScore":100}'
```

---

## Commercial Offline SDKs & Desktop Utilities

- **LocalLedger Studio Offline Desktop Tools:** [www.localledgerstudio.xyz](https://www.localledgerstudio.xyz/) (TradeGuard, EInvoiceLocal, CRAGuard, PropGuard, YC Security Datasets)
- **LocalLedger-JS Bank Statement Parser SDK ($39 on Codester):** [View Commercial SDK](https://www.codester.com/items/76737/localledger-js-bank-statement-parser-sdk)
- **QuantCalc-JS Financial Analysis Widget ($29 on Codester):** [View Commercial Widget](https://www.codester.com/items/76738/quantcalc-js-financial-analysis-widget)

## Auto-Updated Live SEC 8-K Alerts & Ready-to-Import n8n Templates

- [`DAILY_SEC_RISK_DIGEST.md`](DAILY_SEC_RISK_DIGEST.md) — auto-refreshed every weekday via GitHub Actions
- [`templates/n8n-daily-risk-alert.json`](templates/n8n-daily-risk-alert.json) — Daily SEC 8-K Cyber & Accounting Red-Flag Slack Alert
- [`templates/n8n-sla-outage-alert.json`](templates/n8n-sla-outage-alert.json) — 30-Minute AI & Cloud Outage + 99.9% SLA Breach Alert
- [`templates/n8n-clay-security-enrichment.json`](templates/n8n-clay-security-enrichment.json) — Clay / CRM B2B Security & Trust Center Gap Prospecting

## Official MCP Registry Metadata

[`server.json`](server.json) and [`glama.json`](glama.json) follow the Official MCP Registry (`2025-10-17`) and Glama server schemas.
