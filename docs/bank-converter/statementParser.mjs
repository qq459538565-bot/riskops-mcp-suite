/**
 * LocalLedger Deterministic Bank Statement Parser
 * Runs 100% client-side in browser or Node.js — zero file uploads.
 * Reconstructs rows from PDF text coordinates (x, y, str) or plain lines,
 * extracts dates, multi-line descriptions, debits/credits/balances,
 * verifies opening + credits - debits === closing balance,
 * and exports Standard CSV, QuickBooks (3-col / 4-col), and Xero CSV.
 */

const MONTH_MAP = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

const AMOUNT_REGEX = /(?:^|[\s:])(\(?[+-]?(?:[$€£¥]|USD|EUR|GBP|CAD|AUD)?\s?\d{1,3}(?:,\d{3})*\.\d{2}\)?(?:\s?(?:CR|DR))?)(?=$|[\s,;])/gi;

const DATE_START_PATTERNS = [
  // YYYY-MM-DD
  /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
  // MM/DD/YYYY or DD/MM/YYYY or MM/DD/YY
  /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
  // Jan 15, 2026 or Jan 15
  /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{2,4}))?\b/i,
  // 15 Jan 2026 or 15 Jan
  /^(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(\d{2,4}))?\b/i,
];

const IGNORE_LINE_REGEX = /^(page\s+\d+\s+of\s+\d+|date\s+description|posting\s+date|transaction\s+date|account\s+number|statement\s+period|continued\s+on\s+next|member\s+fdic|equal\s+housing|total\s+(deposits|withdrawals|credits|debits)|beginning\s+balance|opening\s+balance|ending\s+balance|closing\s+balance|summary\s+of)/i;

export function parseMoneyToken(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  let negative = false;
  let explicitCredit = false;
  let explicitDebit = false;

  if (/\bCR$/i.test(s)) {
    explicitCredit = true;
    s = s.replace(/\s?CR$/i, '').trim();
  } else if (/\bDR$/i.test(s)) {
    explicitDebit = true;
    negative = true;
    s = s.replace(/\s?DR$/i, '').trim();
  }

  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1).trim();
  } else if (s.startsWith('+')) {
    explicitCredit = true;
    s = s.slice(1).trim();
  }

  s = s.replace(/^(USD|EUR|GBP|CAD|AUD)/i, '').replace(/[$€£¥,\s]/g, '');
  const val = Number.parseFloat(s);
  if (!Number.isFinite(val)) return null;
  return {
    value: negative ? -Math.abs(val) : Math.abs(val),
    raw,
    isNegative: negative,
    explicitCredit,
    explicitDebit,
  };
}

export function normalizeDate(line, options = {}) {
  const { defaultYear = new Date().getFullYear(), dateOrder = 'MDY' } = options;
  const trimmed = line.trim();

  // Pattern 0: YYYY-MM-DD
  let m = trimmed.match(DATE_START_PATTERNS[0]);
  if (m) {
    const [, y, mo, d] = m;
    return { iso: `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`, rest: trimmed.slice(m[0].length).trim() };
  }

  // Pattern 1: MM/DD/YYYY or DD/MM/YYYY or MM/DD
  m = trimmed.match(DATE_START_PATTERNS[1]);
  if (m) {
    const p1 = Number(m[1]);
    const p2 = Number(m[2]);
    let y = m[3] ? Number(m[3]) : defaultYear;
    if (y < 100) y += 2000;
    let month = p1;
    let day = p2;
    if (dateOrder === 'DMY' || (p1 > 12 && p2 <= 12)) {
      day = p1;
      month = p2;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        iso: `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        rest: trimmed.slice(m[0].length).trim(),
      };
    }
  }

  // Pattern 2: Jan 15, 2026
  m = trimmed.match(DATE_START_PATTERNS[2]);
  if (m) {
    const mo = MONTH_MAP[m[1].toLowerCase()];
    const day = Number(m[2]);
    let y = m[3] ? Number(m[3]) : defaultYear;
    if (y < 100) y += 2000;
    if (mo && day >= 1 && day <= 31) {
      return { iso: `${y}-${mo}-${String(day).padStart(2, '0')}`, rest: trimmed.slice(m[0].length).trim() };
    }
  }

  // Pattern 3: 15 Jan 2026
  m = trimmed.match(DATE_START_PATTERNS[3]);
  if (m) {
    const day = Number(m[1]);
    const mo = MONTH_MAP[m[2].toLowerCase()];
    let y = m[3] ? Number(m[3]) : defaultYear;
    if (y < 100) y += 2000;
    if (mo && day >= 1 && day <= 31) {
      return { iso: `${y}-${mo}-${String(day).padStart(2, '0')}`, rest: trimmed.slice(m[0].length).trim() };
    }
  }

  return null;
}

/**
 * Group pdf.js text items ({ str, transform: [a,b,c,d,x,y] }) into ordered visual lines.
 */
export function groupPdfItemsToLines(items, yTolerance = 3.0) {
  const rows = [];
  for (const item of items) {
    const text = (item.str || '').trim();
    if (!text) continue;
    const x = item.transform ? item.transform[4] : item.x ?? 0;
    const y = item.transform ? item.transform[5] : item.y ?? 0;
    let row = rows.find((r) => Math.abs(r.y - y) <= yTolerance);
    if (!row) {
      row = { y, cells: [] };
      rows.push(row);
    }
    row.cells.push({ x, text });
  }
  // PDF coordinate Y descends from top of page to bottom
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.cells.sort((a, b) => a.x - b.x);
    return r.cells.map((c) => c.text).join('  ').replace(/\s{2,}/g, '  ').trim();
  });
}

function inferCategory(desc, amount) {
  const d = desc.toLowerCase();
  if (amount > 0 && /payroll|direct dep|stripe payout|ach credit|wire in|interest|refund/i.test(d)) return 'Income / Deposit';
  if (/aws|amazon web|google cloud|azure|cloudflare|vercel|github|openai|anthropic|slack|notion|figma|datadog|stripe fee/i.test(d)) return 'Software & Cloud';
  if (/uber|lyft|delta|united|american air|hilton|marriott|airbnb|hotel|airline/i.test(d)) return 'Travel';
  if (/starbucks|doordash|ubereats|chipotle|restaurant|cafe|coffee/i.test(d)) return 'Meals';
  if (/irs|tax|state of|franchise tax/i.test(d)) return 'Taxes';
  if (/rent|lease|wework|regus/i.test(d)) return 'Rent & Office';
  if (/fee|service charge|wire fee|overdraft/i.test(d)) return 'Bank Fees';
  if (/transfer|zelle|venmo|wise|ach/i.test(d)) return 'Transfer';
  return amount >= 0 ? 'Credit / Inflow' : 'Operating Expense';
}

function detectBalancesFromHeaderLines(lines) {
  let openingBalance = null;
  let closingBalance = null;
  let detectedYear = null;

  for (const line of lines) {
    const yrMatch = line.match(/\b(202[0-9]|201[5-9])\b/);
    if (yrMatch && !detectedYear) detectedYear = Number(yrMatch[1]);

    if (openingBalance === null && /(beginning|opening|previous|starting)\s+balance/i.test(line)) {
      const toks = [...line.matchAll(AMOUNT_REGEX)].map((m) => parseMoneyToken(m[1])).filter(Boolean);
      if (toks.length > 0) openingBalance = toks[toks.length - 1].value;
    }
    if (/(ending|closing|new|current)\s+balance/i.test(line)) {
      const toks = [...line.matchAll(AMOUNT_REGEX)].map((m) => parseMoneyToken(m[1])).filter(Boolean);
      if (toks.length > 0) closingBalance = toks[toks.length - 1].value;
    }
  }
  return { openingBalance, closingBalance, detectedYear };
}

function detectSectionSignHint(line) {
  if (/^\s*(deposits|credits|additions|electronic\s+deposits|money\s+in)/i.test(line)) return 1;
  if (/^\s*(withdrawals|debits|subtractions|checks\s+paid|atm\s*&?\s*debit|electronic\s+withdrawals|fees|money\s+out|card\s+purchases)/i.test(line)) return -1;
  return 0;
}

export function parseBankStatementLines(rawLines, options = {}) {
  const lines = rawLines.map((l) => String(l || '').trim()).filter(Boolean);
  const totalChars = lines.reduce((a, l) => a + l.length, 0);
  if (totalChars < 30) {
    return {
      isScannedLikely: true,
      transactions: [],
      reconciliation: { status: 'SCANNED_PDF_DETECTED', message: 'Very low text density detected (<30 chars). This appears to be a scanned image PDF; upload a native digital PDF downloaded from your bank portal.' },
      summary: { count: 0, totalCredits: 0, totalDebits: 0, netChange: 0 },
    };
  }

  const { openingBalance: autoOpen, closingBalance: autoClose, detectedYear } = detectBalancesFromHeaderLines(lines);
  const openingBalance = options.openingBalance ?? autoOpen;
  const closingBalance = options.closingBalance ?? autoClose;
  const defaultYear = options.defaultYear ?? detectedYear ?? new Date().getFullYear();
  const dateOrder = options.dateOrder ?? 'MDY';

  const transactions = [];
  let sectionHint = 0; // +1 deposits section, -1 withdrawals section
  let prevRunningBalance = openingBalance;

  for (const line of lines) {
    const hint = detectSectionSignHint(line);
    if (hint !== 0) {
      sectionHint = hint;
      continue;
    }
    if (IGNORE_LINE_REGEX.test(line)) continue;

    const parsedDate = normalizeDate(line, { defaultYear, dateOrder });
    if (parsedDate) {
      const moneyMatches = [...parsedDate.rest.matchAll(AMOUNT_REGEX)];
      const tokens = moneyMatches.map((m) => ({
        index: m.index ?? 0,
        parsed: parseMoneyToken(m[1]),
      })).filter((t) => t.parsed !== null);

      if (tokens.length > 0) {
        // Description is text before first amount token
        const firstAmtIdx = tokens[0].index;
        let desc = parsedDate.rest.slice(0, firstAmtIdx).replace(/\s+/g, ' ').trim();
        if (!desc) {
          // Sometimes description follows amounts or sits between date & amounts
          desc = parsedDate.rest.replace(AMOUNT_REGEX, ' ').replace(/\s+/g, ' ').trim() || 'Bank Transaction';
        }

        let amount = 0;
        let balance = null;

        if (tokens.length >= 2) {
          // Common layout: [Amount, RunningBalance]
          const amtTok = tokens[tokens.length - 2].parsed;
          const balTok = tokens[tokens.length - 1].parsed;
          balance = balTok.value;
          amount = amtTok.value;

          // Use running balance delta to guarantee 100% accurate sign when unsigned!
          if (prevRunningBalance !== null && !amtTok.isNegative && !amtTok.explicitCredit && !amtTok.explicitDebit) {
            const diff = Math.round((balance - prevRunningBalance) * 100) / 100;
            if (Math.abs(Math.abs(diff) - Math.abs(amount)) <= 0.02) {
              amount = diff < 0 ? -Math.abs(amount) : Math.abs(amount);
            } else if (sectionHint !== 0) {
              amount = sectionHint * Math.abs(amount);
            }
          } else if (sectionHint === -1 && amount > 0 && !amtTok.explicitCredit) {
            amount = -Math.abs(amount);
          }
          prevRunningBalance = balance;
        } else {
          // Single amount token on line
          const amtTok = tokens[0].parsed;
          amount = amtTok.value;
          if (!amtTok.isNegative && !amtTok.explicitCredit && !amtTok.explicitDebit) {
            if (sectionHint !== 0) {
              amount = sectionHint * Math.abs(amount);
            } else if (/debit|purchase|pos|withdrawal|fee|payment to|check #|atm/i.test(desc)) {
              amount = -Math.abs(amount);
            }
          }
          if (prevRunningBalance !== null) {
            prevRunningBalance = Math.round((prevRunningBalance + amount) * 100) / 100;
          }
        }

        const roundedAmt = Math.round(amount * 100) / 100;
        transactions.push({
          date: parsedDate.iso,
          description: desc,
          debit: roundedAmt < 0 ? Math.abs(roundedAmt) : 0,
          credit: roundedAmt > 0 ? roundedAmt : 0,
          amount: roundedAmt,
          balance: balance !== null ? Math.round(balance * 100) / 100 : null,
          category: inferCategory(desc, roundedAmt),
        });
        continue;
      }
    }

    // Continuation line for multi-line description (no leading date, no money amounts, not footer/header)
    if (transactions.length > 0 && ![...line.matchAll(AMOUNT_REGEX)].length && line.length <= 120 && !/^[-_=*]{3,}$/.test(line)) {
      const last = transactions[transactions.length - 1];
      if (last.description.length < 200) {
        last.description = `${last.description} ${line}`.replace(/\s+/g, ' ').trim();
        last.category = inferCategory(last.description, last.amount);
      }
    }
  }

  const totalCredits = Math.round(transactions.reduce((a, t) => a + t.credit, 0) * 100) / 100;
  const totalDebits = Math.round(transactions.reduce((a, t) => a + t.debit, 0) * 100) / 100;
  const netChange = Math.round((totalCredits - totalDebits) * 100) / 100;

  // Deterministic Balance Reconciliation Check
  let reconciliation = {
    status: 'NO_SUMMARY_BALANCES',
    openingBalance,
    closingBalance,
    computedClosing: openingBalance !== null ? Math.round((openingBalance + netChange) * 100) / 100 : null,
    variance: null,
    message: 'Transactions parsed. Enter Opening & Closing Balance manually if your statement omits summary headers to verify $0.00 variance.',
  };

  if (openingBalance !== null && closingBalance !== null) {
    const computedClosing = Math.round((openingBalance + netChange) * 100) / 100;
    const variance = Math.round((computedClosing - closingBalance) * 100) / 100;
    const reconciled = Math.abs(variance) <= 0.01;
    reconciliation = {
      status: reconciled ? 'RECONCILED_EXACT' : 'VARIANCE_DETECTED',
      openingBalance,
      closingBalance,
      computedClosing,
      variance,
      message: reconciled
        ? `RECONCILED EXACT ($0.00 variance): Opening ${openingBalance.toFixed(2)} + Credits ${totalCredits.toFixed(2)} - Debits ${totalDebits.toFixed(2)} = Closing ${closingBalance.toFixed(2)}.`
        : `VARIANCE OF ${variance.toFixed(2)} DETECTED: Computed ${computedClosing.toFixed(2)} vs Statement Closing ${closingBalance.toFixed(2)}. Review flagged rows before importing to QuickBooks/Xero.`,
    };
  }

  return {
    isScannedLikely: false,
    transactions,
    reconciliation,
    summary: {
      count: transactions.length,
      totalCredits,
      totalDebits,
      netChange,
    },
  };
}

function csvCell(val) {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportTransactionsCsv(transactions, format = 'standard') {
  if (format === 'quickbooks_3col') {
    const header = 'Date,Description,Amount';
    const rows = transactions.map((t) =>
      [t.date, t.description, t.amount.toFixed(2)].map(csvCell).join(',')
    );
    return [header, ...rows].join('\n');
  }
  if (format === 'quickbooks_4col') {
    const header = 'Date,Description,Credit,Debit';
    const rows = transactions.map((t) =>
      [t.date, t.description, t.credit ? t.credit.toFixed(2) : '', t.debit ? t.debit.toFixed(2) : ''].map(csvCell).join(',')
    );
    return [header, ...rows].join('\n');
  }
  if (format === 'xero') {
    const header = '*Date,*Amount,Payee,Description,Reference';
    const rows = transactions.map((t) =>
      [t.date, t.amount.toFixed(2), t.description.slice(0, 40), t.description, t.category].map(csvCell).join(',')
    );
    return [header, ...rows].join('\n');
  }
  const header = 'Date,Description,Debit,Credit,Amount,Balance,Category';
  const rows = transactions.map((t) =>
    [
      t.date,
      t.description,
      t.debit ? t.debit.toFixed(2) : '',
      t.credit ? t.credit.toFixed(2) : '',
      t.amount.toFixed(2),
      t.balance !== null ? t.balance.toFixed(2) : '',
      t.category,
    ].map(csvCell).join(',')
  );
  return [header, ...rows].join('\n');
}
