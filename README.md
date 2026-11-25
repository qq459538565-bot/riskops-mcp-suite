# RiskOps MCP Suite — Local & Hosted B2B Risk, SEC 8-K, Vendor Security, OSS CVE & Quant Finance MCP Server

[![Glama MCP Server](https://glama.ai/mcp/servers/qq459538565-bot/riskops-mcp-suite/badges/score.svg)](https://glama.ai/mcp/servers/qq459538565-bot/riskops-mcp-suite)
[![Apify Store](https://img.shields.io/badge/Apify%20Store-5%20Hosted%20MCP%20Actors-00a86b?style=flat-square)](https://apify.com/durative_hairstreak)
[![Live Free Tools Portal](https://img.shields.io/badge/Free%20Tools%20%26%20164%20pSEO%20Pages-Live%20HTTPS-0ea5e9?style=flat-square)](https://qq459538565-bot.github.io/riskops-mcp-suite/)
[![LocalLedger Studio](https://img.shields.io/badge/LocalLedger%20Studio-Offline%20Finance%20Tools-10b981?style=flat-square)](https://www.localledgerstudio.xyz/)
[![TickTieLocal](https://img.shields.io/badge/TickTieLocal-Offline%20Audit%20Matcher-6366f1?style=flat-square)](https://qq459538565-bot.github.io/riskops-mcp-suite/tick-tie/index.html)

> **Launch Free Interactive Browser Tools (100% Local, No Signup):**  
> - **RiskOps 4-in-1 Portal:** https://qq459538565-bot.github.io/riskops-mcp-suite/  
> - **LocalLedger Offline Bank PDF -> CSV:** https://qq459538565-bot.github.io/riskops-mcp-suite/bank-converter/index.html  
> - **TickTieLocal Offline Audit Matcher (DataSnipper Alternative):** https://qq459538565-bot.github.io/riskops-mcp-suite/tick-tie/index.html  
> - **2026 State of SaaS & AI Security Report (112 Companies + 24 AI Firms):** https://qq459538565-bot.github.io/riskops-mcp-suite/reports/state-of-saas-security-2026.html

Production-grade, zero-proxy **B2B Financial Risk, Cloud SLA, Vendor Security, OSS Supply-Chain & Quantitative Finance** MCP tools built on 100% public official APIs (`data.sec.gov`, `efts.sec.gov`, Cloudflare DoH, Atlassian Statuspage v2 JSON, Google OSV.dev, CISA KEV, and deterministic IEEE-754 financial math).

Run locally with **zero external npm dependencies and zero API keys**, or scale to batch workloads via **Apify Hosted MCP**.

---

## Option 1: Run Locally (Zero-Dependency Node.js Stdio MCP Server)

Requires Node.js >= 18. No API keys, no npm install required.

```bash
git clone https://github.com/qq459538565-bot/riskops-mcp-suite.git
cd riskops-mcp-suite/mcp-server
npm test   # runs 5/5 live MCP stdio E2E checks
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

### Included Local MCP Tools (`readOnlyHint: true`)

| Tool | What It Does | Data Source |
| :--- | :--- | :--- |
| `audit_vendor_security` | Audits DMARC, SPF, CAA, MX, and Trust Center CNAMEs (Vanta/Drata/SafeBase/HyperComply) -> 0–100 score & gaps | Live Cloudflare DoH |
| `calculate_quant_risk_dcf` | Deterministic 5-yr DCF intrinsic value, Half-Kelly sizing, and Sharpe/Max Drawdown stats (zero LLM math hallucination) | Pure IEEE-754 math |
| `search_sec_8k_risk_filings` | Searches US SEC EDGAR Form 8-K disclosures (Item 1.05 cyber breaches, 4.02 restatements, 4.01 auditor exits, 5.02 C-suite) | Official SEC EDGAR EFTS |
| `audit_oss_package_cve` | Checks npm, PyPI, Go, Maven, or crates.io package versions for known CVEs | Official Google OSV.dev |

---

## Option 2: Hosted Apify & Streamable-HTTP MCP Matrix (Batch & Scheduled Workloads)

All 5 hosted Actors are live on Apify Store with Pay-Per-Event pricing and Glama discovery ([Glama Connector Listing](https://glama.ai/mcp/connectors/com.apify.mcp/sec-8-k-risk-signals-and-corporate-distress-monitor)):

| Tool | Live Apify Store & MCP Endpoint | Best For |
| :--- | :--- | :--- |
| **1. SEC 8-K Risk Signals & Corporate Distress Monitor** | [Apify Store](https://apify.com/durative_hairstreak/sec-8k-risk-signals) · `durative_hairstreak/sec-8k-risk-signals` | Quant/AI Agents, Cyber GTM (`Item 1.05`), Forensic Accounting (`4.02`/`4.01`/`5.02`/`1.03`/`3.01` + SEC comment letters) |
| **2. SaaS & Cloud Status Page SLA Uptime Monitor** | [Apify Store](https://apify.com/durative_hairstreak/saas-status-sla-monitor) · `durative_hairstreak/saas-status-sla-monitor` | SRE / DevOps & AI apps monitoring 22+ vendors with merged-interval 30d/90d SLA % math |
| **3. B2B Vendor Security Posture & Trust Signal Auditor** | [Apify Store](https://apify.com/durative_hairstreak/b2b-vendor-security-auditor) · `durative_hairstreak/b2b-vendor-security-auditor` | Enterprise TPRM & Clay prospecting (100+ domains batch Vanta/SafeBase/Drata fingerprinting, DMARC/SPF/TLS/headers) |
| **4. Open-Source Supply-Chain & CVE Risk Auditor** | [Apify Store](https://apify.com/durative_hairstreak/oss-dependency-risk-auditor) · `durative_hairstreak/oss-dependency-risk-auditor` | AI Coding Agents (Claude Code, Cursor) & CI/CD pre-install gating (OSV.dev CVEs, CISA KEV active exploits, SPDX, OpenSSF) |
| **5. Quant Finance, Portfolio Risk, Kelly & DCF Math Engine** | [Apify Store](https://apify.com/durative_hairstreak/quant-portfolio-dcf-math-engine) · `durative_hairstreak/quant-portfolio-dcf-math-engine` | Institutional Sharpe/Sortino/Calmar/Max Drawdown, VaR/CVaR, Half-Kelly sizing, 5×5 DCF sensitivity, XIRR & Black-Scholes Greeks |

### Hosted Claude Desktop / Cursor MCP Setup

```json
{
  "mcpServers": {
    "apify-sec-risk-monitor": {
      "url": "https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
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
