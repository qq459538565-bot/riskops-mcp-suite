import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'index.mjs');

const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
const rl = readline.createInterface({ input: child.stdout });

const pending = new Map();
rl.on('line', (line) => {
  const msg = JSON.parse(line);
  if (pending.has(msg.id)) {
    const resolve = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  }
});

let nextId = 1;
function rpc(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout on ${method}`)), 15000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });
}

try {
  // 1. Initialize
  const initRes = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } });
  assert.equal(initRes.result.serverInfo.name, 'riskops-mcp-suite');
  console.log('PASS 1/5: initialize ->', initRes.result.serverInfo);

  // 2. tools/list
  const listRes = await rpc('tools/list');
  assert.equal(listRes.result.tools.length, 4);
  console.log('PASS 2/5: tools/list ->', listRes.result.tools.map((t) => t.name).join(', '));

  // 3. Deterministic DCF & Kelly
  const dcfRes = await rpc('tools/call', {
    name: 'calculate_quant_risk_dcf',
    arguments: { mode: 'dcf', fcfBase: 100, growthRate: 0.1, wacc: 0.09, terminalGrowth: 0.025, netDebt: -50, sharesOut: 100 }
  });
  const dcfData = JSON.parse(dcfRes.result.content[0].text);
  assert.ok(dcfData.intrinsicValuePerShare > 20, `unexpected DCF: ${dcfData.intrinsicValuePerShare}`);
  console.log('PASS 3/5: calculate_quant_risk_dcf -> intrinsicPerShare =', dcfData.intrinsicValuePerShare);

  // 4. Live Cloudflare DoH Vendor Security Audit
  const dnsRes = await rpc('tools/call', {
    name: 'audit_vendor_security',
    arguments: { domain: 'stripe.com' }
  });
  const dnsData = JSON.parse(dnsRes.result.content[0].text);
  assert.equal(dnsData.domain, 'stripe.com');
  assert.equal(dnsData.dmarcPolicy, 'reject');
  console.log('PASS 4/5: audit_vendor_security(stripe.com) -> score =', dnsData.postureScore, 'dmarc =', dnsData.dmarcPolicy);

  // 5. Live OSV.dev CVE check
  const cveRes = await rpc('tools/call', {
    name: 'audit_oss_package_cve',
    arguments: { ecosystem: 'npm', packageName: 'lodash', version: '4.17.20' }
  });
  const cveData = JSON.parse(cveRes.result.content[0].text);
  assert.ok(cveData.vulnerabilityCount >= 1, 'Expected known CVEs for lodash@4.17.20');
  console.log('PASS 5/5: audit_oss_package_cve(lodash@4.17.20) -> vulns =', cveData.vulnerabilityCount);

  console.log('ALL 5/5 MCP STDIO E2E TESTS PASSED!');
} finally {
  child.kill();
}
