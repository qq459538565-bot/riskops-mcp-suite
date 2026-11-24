/**
 * RiskOps Studio & LocalLedger — Centralized 2026-2030 Monetization Switchboard
 * -----------------------------------------------------------------------------
 * Update ONE file to activate recurring B2B SaaS affiliate commissions (Apify Affiliate
 * 20%->30% lifetime, PartnerStack Xero/FreshBooks/QuickBooks/1Password/Zapier/Deel/Rippling,
 * Make 20%), Chrome/Edge store links, and Creem/Dodo checkout URLs across all 163+ pages.
 */
window.RISKOPS_MONETIZATION = {
  updatedAt: '2026-11-24',

  // 1) Apify Affiliate Program (20% first 3 months -> 30% lifetime recurring, up to $5,000/ref)
  apifyAffiliateQuery: '',

  // 2) High-Ticket B2B SaaS Partner Slots (replace official URLs with your approved tracking links)
  partners: {
    apify: { name: 'Apify Cloud & MCP Platform', url: 'https://apify.com/durative_hairstreak', badge: 'Official MCP Host' },
    vanta: { name: 'Vanta Automated SOC 2 & Trust Center', url: 'https://www.vanta.com/', badge: '#1 Benchmarked GRC' },
    drata: { name: 'Drata / SafeBase Compliance', url: 'https://drata.com/', badge: 'Enterprise GRC' },
    onepassword: { name: '1Password Business', url: 'https://1password.com/business/', badge: 'Identity Security' },
    make: { name: 'Make.com Visual Automation', url: 'https://www.make.com/', badge: 'No-Code Automation' },
    zapier: { name: 'Zapier Workflow Automation', url: 'https://zapier.com/', badge: 'App Automation' },
    quickbooks: { name: 'QuickBooks Online', url: 'https://quickbooks.intuit.com/', badge: 'US Accounting Leader' },
    xero: { name: 'Xero Cloud Accounting', url: 'https://www.xero.com/', badge: 'Global Multi-Currency' },
    freshbooks: { name: 'FreshBooks Small Business Accounting', url: 'https://www.freshbooks.com/', badge: 'Freelancer Favorite' },
    wise: { name: 'Wise Business Multi-Currency', url: 'https://wise.com/business/', badge: 'Global Banking' },
    rippling: { name: 'Rippling HR, IT & Finance', url: 'https://www.rippling.com/', badge: 'Unified Workforce' },
    deel: { name: 'Deel Global Payroll & Compliance', url: 'https://www.deel.com/', badge: 'Global Hiring' },
    apollo: { name: 'Apollo.io B2B Sales Intelligence', url: 'https://www.apollo.io/', badge: 'B2B GTM Data' },
    webflow: { name: 'Webflow Visual Web Platform', url: 'https://webflow.com/', badge: 'Web Builder' },
  },

  // 3) Local-First Browser Extensions (Firefox AMO Submitted + Edge/Chrome Ready)
  extensions: {
    vendorSecUrl: 'https://addons.mozilla.org/en-US/firefox/addon/vendorsec-1-click/',
    localLedgerExtUrl: 'https://addons.mozilla.org/en-US/firefox/addon/localledger-offline/',
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
