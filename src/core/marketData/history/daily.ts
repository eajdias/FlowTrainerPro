// core/marketData/history/daily.ts
// Validação e normalização COTAHIST diário (Spec 2/4). Layout posicional oficial:
// 245 bytes/registro (`00` header, `01` cotações, `99` trailer). Preços (11)V99.

export interface DailyCandle {
  symbol: string;
  date: string; // YYYY-MM-DD
  o: number;
  h: number;
  l: number;
  c: number;
  trades: number;
  qty: number;
  volume: number;
}

export interface InvalidDailyLine {
  line: number;
  reasonCode: string;
  raw: string;
}

export interface DailyDiagnostics {
  physicalLines: number;
  blank: number;
  valid: number;
  invalid: number;
  outOfOrder: number;
  duplicates: number;
  firstDate: string | null;
  lastDate: string | null;
  trailerTotal: number | null;
  trailerMismatch: boolean;
  invalidLines: InvalidDailyLine[];
}

export interface DailyParseResult {
  candles: DailyCandle[];
  diagnostics: DailyDiagnostics;
}

function slice(line: string, from: number, to: number): string {
  return line.slice(from, to);
}

function parsePrice(raw: string): number | null {
  if (!/^\d{13}$/.test(raw)) return null;
  return Number(raw) / 100;
}

function parseInt9(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim()) && raw.trim() !== '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  if (
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() + 1 !== Number(m[2]) ||
    d.getUTCDate() !== Number(m[3])
  ) {
    return null;
  }
  return iso;
}

export function parseDailyCotahist(text: string): DailyParseResult {
  const lines = text.split(/\r?\n/);
  const candles: DailyCandle[] = [];
  const seen = new Set<string>();
  const diag: DailyDiagnostics = {
    physicalLines: lines.length,
    blank: 0,
    valid: 0,
    invalid: 0,
    outOfOrder: 0,
    duplicates: 0,
    firstDate: null,
    lastDate: null,
    trailerTotal: null,
    trailerMismatch: false,
    invalidLines: [],
  };

  const fail = (line: number, reasonCode: string, rawLine: string): void => {
    diag.invalid += 1;
    diag.invalidLines.push({ line, reasonCode, raw: rawLine.slice(0, 200) });
  };

  let maxDate = '';
  let structural = 0;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const lineNo = i + 1;
    if (rawLine.trim() === '') {
      diag.blank += 1;
      continue;
    }
    if (rawLine.length < 245) {
      fail(lineNo, 'HIST_SHORT_LINE', rawLine);
      continue;
    }
    const kind = rawLine.slice(0, 2);
    if (kind === '00' || kind === '99') {
      structural += 1;
      if (kind === '99') {
        const total = parseInt9(rawLine.slice(31, 42));
        diag.trailerTotal = total;
      }
      continue;
    }
    if (kind !== '01') {
      fail(lineNo, 'HIST_UNKNOWN_RECORD', rawLine);
      continue;
    }

    const date = parseDate(slice(rawLine, 2, 10));
    const symbol = slice(rawLine, 12, 24).trim();
    const o = parsePrice(slice(rawLine, 56, 69));
    const h = parsePrice(slice(rawLine, 69, 82));
    const l = parsePrice(slice(rawLine, 82, 95));
    const c = parsePrice(slice(rawLine, 108, 121));
    const trades = parseInt9(slice(rawLine, 147, 152));
    const qty = parseInt9(slice(rawLine, 152, 170));
    const volume = parseInt9(slice(rawLine, 170, 188));

    if (date === null) {
      fail(lineNo, 'HIST_BAD_DATE', rawLine);
      continue;
    }
    if (symbol === '') {
      fail(lineNo, 'HIST_BAD_SYMBOL', rawLine);
      continue;
    }
    if (o === null || h === null || l === null || c === null) {
      fail(lineNo, 'HIST_BAD_PRICE', rawLine);
      continue;
    }
    if (trades === null || qty === null || volume === null) {
      fail(lineNo, 'HIST_BAD_QTY', rawLine);
      continue;
    }

    const key = `${symbol}|${date}`;
    if (seen.has(key)) {
      diag.duplicates += 1;
      continue;
    }
    seen.add(key);
    if (date < maxDate) diag.outOfOrder += 1;
    else maxDate = date;

    candles.push(Object.freeze({ symbol, date, o, h, l, c, trades, qty, volume }));
    diag.valid += 1;
  }

  candles.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  diag.firstDate = candles[0]?.date ?? null;
  diag.lastDate = candles[candles.length - 1]?.date ?? null;
  if (diag.trailerTotal !== null) {
    diag.trailerMismatch = diag.trailerTotal !== diag.valid + diag.invalid + structural;
  }

  return { candles, diagnostics: diag };
}
