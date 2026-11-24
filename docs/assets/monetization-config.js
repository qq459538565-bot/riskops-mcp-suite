/**
 * RiskOps Studio & LocalLedger — Centralized 2026-2030 Monetization Switchboard
 * -----------------------------------------------------------------------------
 * Update ONE file to activate recurring B2B SaaS affiliate commissions (PartnerStack,
 * Apify Affiliate 20%->30% lifetime, Make 20%), Chrome/Edge extension store links,
 * and Creem/Dodo checkout URLs across all 160+ pages simultaneously.
 */
window.RISKOPS_MONETIZATION = {
  updatedAt: '2026-11-24',

  // 1) Apify Affiliate Program (20% first 3 months -> 30% lifetime recurring)
  // Paste your personal referral query param once approved (e.g. '?fpr=yourid')
  apifyAffiliateQuery: '',

  // 2) Recurring B2B SaaS Partners (PartnerStack / Direct -> Payoneer USD)
  // Official clean URLs active today; replace with your PartnerStack/Make tracking URLs to earn 15%-30% recurring
  partners: {
    apify: {
      name: 'Apify Cloud & MCP Platform',
      pitch: 'Run our 5 hosted zero-proxy RiskOps MCP servers with $5/mo free credits.',
      url: 'https://apify.com/durative_hairstreak',
      badge: 'Official MCP Host',
    },
    vanta: {
      name: 'Vanta Automated SOC 2 & Trust Center',
      pitch: 'Used by 25.9% of the 112 leading SaaS vendors in our live benchmark.',
      url: 'https://www.vanta.com/',
      badge: '#1 Benchmarked GRC',
    },
    make: {
      name: 'Make.com Visual Automation',
      pitch: 'Connect our DMARC, SLA & SEC 8-K APIs into Slack, HubSpot, or Jira in 3 minutes.',
      url: 'https://www.make.com/',
      badge: 'No-Code Automation',
    },
    quickbooks: {
      name: 'QuickBooks Online Accounting',
      pitch: 'Import LocalLedger reconciled CSV/QBO exports cleanly into your books.',
      url: 'https://quickbooks.intuit.com/',
      badge: 'Accounting Target',
    },
    wise: {
      name: 'Wise Business Multi-Currency',
      pitch: 'Receive international client payments & export clean multi-currency statements.',
      url: 'https://wise.com/business/',
      badge: 'Global Banking',
    },
  },

  // 3) Browser Extensions (Local-First Distribution)
  extensions: {
    edgeStoreUrl: 'https://qq459538565-bot.github.io/riskops-mcp-suite/extension/index.html',
    chromeStoreUrl: 'https://qq459538565-bot.github.io/riskops-mcp-suite/extension/index.html',
  },

  // 4) Direct Digital Checkout (Creem.io / Dodo Payments)
  checkout: {
    localLedgerProUrl: 'mailto:qq459538565@gmail.com?subject=LocalLedger%20Pro%20License%20(%2419)',
    vendorSecProUrl: 'mailto:qq459538565@gmail.com?subject=VendorSec%20Pro%20License%20(%2429)',
  },
};

(function hydrateRiskOpsLinks() {
  const cfg = window.RISKOPS_MONETIZATION;
  if (!cfg) return;

  // Auto-append Apify Affiliate parameter to all apify.com links when configured
  if (cfg.apifyAffiliateQuery) {
    document.querySelectorAll('a[href*="apify.com"]').forEach((a) => {
      try {
        const u = new URL(a.href);
        if (!u.search && cfg.apifyAffiliateQuery.startsWith('?')) {
          a.href = a.href + cfg.apifyAffiliateQuery;
        }
      } catch {}
    });
  }

  // Hydrate data-partner="..." elements dynamically
  document.querySelectorAll('[data-partner]').forEach((el) => {
    const key = el.getAttribute('data-partner');
    const partner = cfg.partners[key];
    if (partner && el.tagName === 'A') {
      el.href = partner.url;
      el.setAttribute('rel', 'noopener sponsored');
      el.setAttribute('target', '_blank');
    }
  });
})();
