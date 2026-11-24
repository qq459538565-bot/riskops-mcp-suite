# B2B Risk, Compliance, Cloud SLA, OSS Supply-Chain & Quant Finance — Official-API MCP Suite

[![Apify Store](https://img.shields.io/badge/Apify%20Store-durative__hairstreak-00a86b?style=flat-square)](https://apify.com/durative_hairstreak)
[![Live Free Tools Portal](https://img.shields.io/badge/Free%204--in--1%20Web%20Portal-Live%20HTTPS-0ea5e9?style=flat-square)](https://qq459538565-bot.github.io/riskops-mcp-suite/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Hosted%20via%20mcp.apify.com-2563eb?style=flat-square)](https://mcp.apify.com/?actors=durative_hairstreak/sec-8k-risk-signals)
[![Zero Proxy](https://img.shields.io/badge/Infra-100%25%20Official%20APIs%20%26%20Pure%20Math-10b981?style=flat-square)](#)

> **Launch the Free Interactive 4-in-1 Tools Portal (No Signup Required):**  
> 👉 **https://qq459538565-bot.github.io/riskops-mcp-suite/** *(Live B2B Trust Center/DMARC DNS Checker, Cloud/AI SLA Pulse, SEC 8-K MCP Builder & Half-Kelly Risk Calculator)*

Production-grade, zero-proxy **B2B Financial Risk, Cloud SLA, Vendor Security, OSS Supply-Chain & Quantitative Finance** tools built on 100% public official APIs (`data.sec.gov`, `efts.sec.gov`, Atlassian Statuspage v2 JSON, Cloudflare DoH, Google OSV.dev, CISA KEV, Google deps.dev, and deterministic IEEE-754 financial math) — natively accessible to **Claude Desktop, Cursor, n8n, Make, and Clay** via Apify Hosted MCP.

---

## Hosted Apify & MCP Tool Matrix

| Tool | Hosted Apify Store / MCP Endpoint | Best For |
| :--- | :--- | :--- |
| **1. SEC 8-K Risk Signals & Corporate Distress Monitor** | [Live on Apify Store](https://apify.com/durative_hairstreak/sec-8k-risk-signals) · `durative_hairstreak/sec-8k-risk-signals` | Quant/AI Agents, Cyber GTM (`Item 1.05`), Forensic Accounting (`4.02`/`4.01`/`5.02`/`1.03`/`3.01` + SEC comment letters) |
| **2. SaaS & Cloud Status Page SLA Uptime Monitor** | `durative_hairstreak/saas-status-sla-monitor` | SRE / DevOps teams & AI apps monitoring 22+ vendors with merged-interval 30d/90d SLA % math |
| **3. B2B Vendor Security Posture & Trust Signal Auditor** | `durative_hairstreak/b2b-vendor-security-auditor` | Enterprise TPRM & Clay prospecting (Vanta/SafeBase/Drata DNS CNAME fingerprinting, DMARC/SPF/MX, TLS, security headers) |
| **4. Open-Source Supply-Chain & CVE Risk Auditor** | `durative_hairstreak/oss-dependency-risk-auditor` | AI Coding Agents (Claude Code, Cursor, Devin) & CI/CD pre-install gating (OSV.dev CVEs, CISA KEV active exploits, SPDX licenses, OpenSSF Scorecard & exact fixed versions) |
| **5. Quant Finance, Portfolio Risk, Kelly & DCF Math Engine** | `durative_hairstreak/quant-portfolio-dcf-math-engine` | Deterministic institutional math eliminating LLM hallucinations: Sharpe/Sortino/Calmar/Max Drawdown, VaR/CVaR, Half-Kelly + Stop-Loss sizing, multi-stage DCF + 5×5 sensitivity, XIRR/IRR & Black-Scholes Greeks (0 external APIs, <1s) |

---

## Latest Auto-Updated Live SEC 8-K Alerts

See [`DAILY_SEC_RISK_DIGEST.md`](DAILY_SEC_RISK_DIGEST.md) (powered by GitHub Actions — automatically refreshes every weekday with top 5 US public company `RED` alerts).

---

## One-Click Claude Desktop / Cursor MCP Setup

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

## Ready-to-Import n8n Templates Included

- **Daily SEC 8-K Cyber Breach (`Item 1.05`) & Accounting Red-Flag Slack Alert**: [`templates/n8n-daily-risk-alert.json`](templates/n8n-daily-risk-alert.json)
- **30-Minute AI & Cloud Outage + 99.9% SLA Breach Alert**: [`templates/n8n-sla-outage-alert.json`](templates/n8n-sla-outage-alert.json)
- **Clay / CRM B2B Security & Trust Center Gap Prospecting**: [`templates/n8n-clay-security-enrichment.json`](templates/n8n-clay-security-enrichment.json)

## Official MCP Registry Metadata

[`server.json`](server.json) is pre-configured according to the Official MCP Registry specification (`2025-10-17` schema) for automated discovery by PulseMCP and MCP directories.
