import fs from 'node:fs';

const BASE = 'https://qq459538565-bot.github.io/riskops-mcp-suite';
const TODAY = '2026-11-24';

const hubs = [
  'docs/templates/index.html',
  'docs/vendors/index.html',
  'docs/vendors/compare.html',
  'docs/vendors/vanta-customers.html',
  'docs/vendors/safebase-drata-customers.html',
  'docs/vendors/dmarc-security-gaps.html',
  'docs/bank-converter/csv-cleaner.html',
  'docs/alternatives/docuclipper-alternative.html',
  'docs/alternatives/docparser-alternative.html',
  'docs/alternatives/securityscorecard-upguard-alternative.html',
  'docs/alternatives/uptimerobot-statuspage-alternative.html',
];

let wired = 0;
for (const p of hubs) {
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  if (!html.includes('monetization-config.js')) {
    html = html.replace(/<\/body>/i, '  <script src="../assets/monetization-config.js" defer></script>\n</body>');
    fs.writeFileSync(p, html, 'utf8');
    wired++;
  }
}

const quantUrl = `${BASE}/quant-widget/index.html`;
let sm = fs.readFileSync('docs/sitemap.xml', 'utf8');
if (!sm.includes(`<loc>${quantUrl}</loc>`)) {
  sm = sm.replace(
    '</urlset>',
    `  <url><loc>${quantUrl}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>`
  );
  fs.writeFileSync('docs/sitemap.xml', sm, 'utf8');
}
const locs = sm.match(/<loc>[^<]+<\/loc>/g) || [];
const badAmp = sm.match(/&(?!amp;|lt;|gt;|quot;|apos;)/g) || [];
if (badAmp.length > 0) {
  console.error('Bad ampersands detected in sitemap.xml:', badAmp.length);
  process.exit(1);
}

let llms = fs.readFileSync('docs/llms.txt', 'utf8');
if (!llms.includes('/quant-widget/index.html')) {
  llms += `- [QuantCalc-JS 4-in-1 Interactive DCF, Sharpe/VaR, Kelly & IRR Calculator](${quantUrl})\n`;
  fs.writeFileSync('docs/llms.txt', llms, 'utf8');
}

console.log(JSON.stringify({ wiredHubs: wired, sitemapUrls: locs.length, badAmp: badAmp.length }, null, 2));
