/**
 * TickTieLocal — 100% Client-Side Audit "Tick-and-Tie" Engine
 * Matches extracted PDF invoice fields against an AP/AR CSV/Excel ledger locally
 * with zero cloud uploads. Built for boutique CPAs, auditors & controllers.
 */

export function parseCsvLedger(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  function splitRow(line) {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  }

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const findCol = (pats) => headers.findIndex((h) => pats.some((p) => h.includes(p)));

  const idxInv = findCol(['invoiceno', 'invoicenumber', 'invno', 'inv', 'ref', 'docno']);
  const idxDate = findCol(['date', 'invoicedate', 'posting']);
  const idxVendor = findCol(['vendor', 'supplier', 'payee', 'merchant', 'name', 'description']);
  const idxAmt = findCol(['total', 'amount', 'gross', 'debit', 'balance', 'value']);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    if (cols.every((c) => !c)) continue;
    const rawAmt = idxAmt >= 0 ? cols[idxAmt] : cols[cols.length - 1];
    const amount = parseAmount(rawAmt);
    rows.push({
      rowNumber: i + 1,
      invoiceNo: normalizeInvNo(idxInv >= 0 ? cols[idxInv] : ''),
      rawInvoiceNo: idxInv >= 0 ? cols[idxInv] : '',
      date: normalizeIsoDate(idxDate >= 0 ? cols[idxDate] : ''),
      vendor: (idxVendor >= 0 ? cols[idxVendor] : '').trim(),
      amount,
    });
  }
  return rows;
}

export function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  let s = trimmed.replace(/[$€£¥,\s]/g, '');
  if (/^-?\d+,\d{2}$/.test(trimmed.replace(/[$€£¥\s]/g, ''))) {
    s = trimmed.replace(/[$€£¥\s]/g, '').replace(',', '.');
  } else if (/^\(?-?[\d.]+,\d{2}\)?$/.test(trimmed.replace(/[$€£¥\s]/g, ''))) {
    s = trimmed.replace(/[$€£¥\s]/g, '').replace(/\./g, '').replace(',', '.');
  }
  const neg = s.startsWith('(') && s.endsWith(')');
  s = s.replace(/[()]/g, '');
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.round((neg ? -Math.abs(n) : n) * 100) / 100;
}

export function normalizeInvNo(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function normalizeIsoDate(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const p1 = Number(m[1]);
    const p2 = Number(m[2]);
    const [mo, d] = p1 > 12 ? [p2, p1] : [p1, p2];
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return s;
}

export function extractInvoiceFromText(filename, text) {
  const full = String(text || '');
  const lines = full.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const invMatch =
    full.match(/(?:invoice\s*(?:#|no\.?|number)?|inv\.?\s*#|rechnung(?:snummer)?\s*[:#]?)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i) ||
    filename.match(/(INV[-_ ]?[A-Z0-9\-]{2,20})/i);
  const rawInvoiceNo = invMatch ? invMatch[1].trim() : '';

  const dateMatch =
    full.match(/(?:invoice\s+date|date|datum)\s*:?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i) ||
    full.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\.\d{1,2}\.\d{4})\b/);
  const date = dateMatch ? normalizeIsoDate(dateMatch[1]) : '';

  const totalRx =
    /(?:grand\s+total|total\s+due|amount\s+due|balance\s+due|invoice\s+total|gesamtbetrag|brutto|total)\s*(?:\([A-Z]{3}\))?\s*:?\s*([$€£]?\s*\d{1,3}(?:[,.]\d{3})*[.,]\d{2}|[$€£]?\s*\d+[.,]\d{2})/gi;
  let amount = null;
  let m;
  let lastFound = null;
  while ((m = totalRx.exec(full)) !== null) {
    const parsed = parseAmount(m[1]);
    if (parsed !== null && parsed > 0) lastFound = parsed;
  }
  if (lastFound !== null) amount = lastFound;

  if (amount === null) {
    const allNums = [...full.matchAll(/[$€£]\s*(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})/g)]
      .map((x) => parseAmount(x[1]))
      .filter((n) => n !== null && n > 0);
    if (allNums.length) amount = Math.max(...allNums);
  }

  const vendor =
    lines.find((l) => l.length >= 3 && l.length <= 64 && !/^(invoice|tax invoice|receipt|bill to|date|page\s+\d)/i.test(l)) ||
    filename.replace(/\.pdf$/i, '');

  return {
    filename,
    rawInvoiceNo,
    invoiceNo: normalizeInvNo(rawInvoiceNo),
    date,
    vendor,
    amount,
  };
}

function tokenSimilarity(a, b) {
  const tok = (s) =>
    new Set(
      String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !['inc', 'llc', 'ltd', 'gmbh', 'corp', 'co'].includes(w))
    );
  const sA = tok(a);
  const sB = tok(b);
  if (!sA.size || !sB.size) return 0;
  let inter = 0;
  for (const w of sA) if (sB.has(w)) inter++;
  return inter / Math.max(sA.size, sB.size);
}

export function runTickAndTie(ledgerRows, pdfDocs, { tolerance = 0.01 } = {}) {
  const usedPdfIdx = new Set();
  const seenLedgerKeys = new Map();
  const results = [];

  for (const row of ledgerRows) {
    const dupKey = `${row.invoiceNo || row.vendor.toLowerCase()}|${row.amount}`;
    const isDuplicateLedger = Boolean(row.invoiceNo || row.amount !== null) && seenLedgerKeys.has(dupKey);
    if (!seenLedgerKeys.has(dupKey)) seenLedgerKeys.set(dupKey, row.rowNumber);

    let bestIdx = -1;
    let bestScore = -1;

    for (let i = 0; i < pdfDocs.length; i++) {
      if (usedPdfIdx.has(i)) continue;
      const doc = pdfDocs[i];
      let score = 0;
      const invMatch = row.invoiceNo && doc.invoiceNo && row.invoiceNo === doc.invoiceNo;
      const amtDiff =
        row.amount !== null && doc.amount !== null ? Math.abs(Math.abs(row.amount) - Math.abs(doc.amount)) : null;
      const amtExact = amtDiff !== null && amtDiff <= tolerance;
      const vSim = tokenSimilarity(row.vendor, doc.vendor);
      const dateMatch = row.date && doc.date && row.date === doc.date;

      if (invMatch) score += 60;
      if (amtExact) score += 30;
      else if (amtDiff !== null && amtDiff <= Math.max(5, Math.abs(row.amount || 0) * 0.15)) score += 10;
      score += Math.round(vSim * 20);
      if (dateMatch) score += 10;

      if (score >= 45 && score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (isDuplicateLedger) {
      results.push({
        status: 'DUPLICATE_LEDGER',
        rowNumber: row.rowNumber,
        ledgerInvoiceNo: row.rawInvoiceNo,
        ledgerVendor: row.vendor,
        ledgerDate: row.date,
        ledgerAmount: row.amount,
        pdfFile: '—',
        pdfAmount: null,
        variance: null,
        note: `Duplicate of ledger row #${seenLedgerKeys.get(dupKey)}`,
      });
      continue;
    }

    if (bestIdx >= 0) {
      usedPdfIdx.add(bestIdx);
      const doc = pdfDocs[bestIdx];
      const variance =
        row.amount !== null && doc.amount !== null
          ? Math.round((Math.abs(row.amount) - Math.abs(doc.amount)) * 100) / 100
          : null;
      const exact = variance !== null && Math.abs(variance) <= tolerance;
      results.push({
        status: exact ? 'EXACT_MATCH' : 'AMOUNT_VARIANCE',
        rowNumber: row.rowNumber,
        ledgerInvoiceNo: row.rawInvoiceNo,
        ledgerVendor: row.vendor,
        ledgerDate: row.date,
        ledgerAmount: row.amount,
        pdfFile: doc.filename,
        pdfInvoiceNo: doc.rawInvoiceNo,
        pdfAmount: doc.amount,
        variance,
        note: exact
          ? `Verified against ${doc.filename} ($0.00 variance)`
          : `Variance of ${variance > 0 ? '+' : ''}${variance?.toFixed(2)} vs ${doc.filename} (PDF=${doc.amount})`,
      });
    } else {
      results.push({
        status: 'MISSING_PDF',
        rowNumber: row.rowNumber,
        ledgerInvoiceNo: row.rawInvoiceNo,
        ledgerVendor: row.vendor,
        ledgerDate: row.date,
        ledgerAmount: row.amount,
        pdfFile: '—',
        pdfAmount: null,
        variance: null,
        note: 'No supporting PDF invoice found in uploaded batch',
      });
    }
  }

  const unrecordedPdfs = pdfDocs
    .map((doc, idx) => ({ doc, idx }))
    .filter(({ idx }) => !usedPdfIdx.has(idx))
    .map(({ doc }) => ({
      status: 'UNRECORDED_PDF',
      rowNumber: null,
      ledgerInvoiceNo: '—',
      ledgerVendor: doc.vendor,
      ledgerDate: doc.date,
      ledgerAmount: null,
      pdfFile: doc.filename,
      pdfInvoiceNo: doc.rawInvoiceNo,
      pdfAmount: doc.amount,
      variance: null,
      note: `PDF invoice ${doc.rawInvoiceNo || doc.filename} (${doc.amount ?? '?'}) missing from AP/AR ledger`,
    }));

  const all = [...results, ...unrecordedPdfs];
  const counts = {
    totalLedgerRows: ledgerRows.length,
    totalPdfs: pdfDocs.length,
    exactMatches: all.filter((x) => x.status === 'EXACT_MATCH').length,
    amountVariances: all.filter((x) => x.status === 'AMOUNT_VARIANCE').length,
    missingPdfs: all.filter((x) => x.status === 'MISSING_PDF').length,
    duplicateLedgerRows: all.filter((x) => x.status === 'DUPLICATE_LEDGER').length,
    unrecordedPdfs: unrecordedPdfs.length,
  };
  return { counts, items: all };
}

export function exportWorkpaperCsv(items) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['Audit_Status', 'Ledger_Row', 'Invoice_No', 'Vendor', 'Date', 'Ledger_Amount', 'PDF_Evidence_File', 'PDF_Amount', 'Variance', 'Audit_Note'];
  const rows = [
    header.join(','),
    ...items.map((x) =>
      [x.status, x.rowNumber ?? '', x.ledgerInvoiceNo, x.ledgerVendor, x.ledgerDate, x.ledgerAmount ?? '', x.pdfFile, x.pdfAmount ?? '', x.variance ?? '', x.note]
        .map(esc)
        .join(',')
    ),
  ];
  return rows.join('\n') + '\n';
}
