# VendorSec 1-Click Inspector — Store Submission Package (Microsoft Edge `$0` + Chrome Web Store `$5`)

## 1. Ready-to-Upload Package
- **Manifest V3 ZIP:** `C:/Users/lenovo/.gemini/antigravity/scratch/vendorsec-chrome-extension/dist/vendorsec-1click-v1.0.0.zip`
- **Microsoft Edge Store Icon (300x300 PNG):** `icons/store-icon-300.png`
- **Chrome Web Store Icon (128x128 PNG):** `icons/icon128.png`

## 2. Store Listing Copy
- **Name:** `VendorSec 1-Click — B2B Security, DMARC & Vanta Trust Inspector`
- **Short Summary (<= 132 chars):** `100% browser-local B2B security & Trust Center inspector: check DMARC, SPF, CAA, Vanta/SafeBase/Drata & tech stack in 2s.`
- **Category:** `Developer Tools` (or `Productivity`)
- **Homepage URL:** `https://qq459538565-bot.github.io/riskops-mcp-suite/extension/index.html`
- **Support Email:** `qq459538565@gmail.com`
- **Privacy Policy URL:** `https://qq459538565-bot.github.io/riskops-mcp-suite/legal/privacy.html`

### Full Description
Audit any B2B vendor, SaaS prospect, or client website in 2 seconds with zero backend tracking.

**What VendorSec 1-Click Checks Locally:**
- **Trust Center & GRC Radar:** Detects Vanta, SafeBase (Drata), Drata, Conveyor, Secureframe, Sprinto, Whistic, and custom `trust.* / security.*` portals via public DNS-over-HTTPS CNAME lookup (zero WAF/403 blocks).
- **Email & SSL Hygiene:** Verifies `DMARC` (`p=reject` vs `quarantine`/`none`), `SPF` (`-all` vs `~all`), `DNS CAA`, and enterprise `MX` provider (Google Workspace, Microsoft 365, Proofpoint, Mimecast) with a deterministic 0–100 score & A+ to F grade.
- **Active Page GTM & Buying Signals:** Fingerprints 12 core SaaS technologies (Stripe, Paddle, Cloudflare, Vercel, Segment, HubSpot, PostHog, Intercom, Datadog, Sentry) plus ATS hiring links (Greenhouse, Lever, Ashby, Workday) directly from the active tab.
- **Instant Exports:** 1-click Copy Markdown Security Brief (paste into Slack, Notion, CRM, or Claude), printable White-Label MSP PDF reports, and local Batch CSV auditing.

**100% Privacy-First Architecture:**
Zero user accounts, zero analytics, zero browsing history collection. Queries run directly from your browser to public Cloudflare DoH (`cloudflare-dns.com`) with Google DNS (`dns.google`) failover.

## 3. Permission Justifications (Copy Directly into Store Reviewer Form)
- **`activeTab`**: Reads the current tab's domain URL strictly when the user clicks the extension icon, so the security audit runs automatically without manual typing.
- **`scripting`**: Executes a read-only DOM snippet strictly on the active tab after user click to detect public script tags (e.g., Stripe, Segment, Cloudflare) and `/pricing` or ATS hiring links. Never modifies web pages and never runs in the background.
- **`storage`**: Stores the user's optional white-label agency name and Pro license key locally via `chrome.storage.local`.
- **Host permissions (`https://cloudflare-dns.com/*`, `https://dns.google/*`)**: Required to query public DNS-over-HTTPS (`DMARC`, `SPF`, `CAA`, `MX`, `CNAME`) records directly from the extension popup without routing through any third-party backend server.
- **Single Purpose Description**: Provides on-demand browser-local DNS security, Trust Center detection, and web stack auditing for the active website or user-supplied domain list.
