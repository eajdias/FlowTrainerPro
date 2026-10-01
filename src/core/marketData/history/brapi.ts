// core/marketData/history/brapi.ts (Spec 5/4+1)
// Série diária gratuita de futuros (WIN/WDO sem token). Sem intraday, sem realtime.
// Aproximação documentada: brapi não traz abertura (`open: null`); usa-se
// `average ?? close` como abertura do DailyCandle.

import type { DailyCandle } from './daily';

export const BRAPI_BASE_URL = 'https://brapi.dev/api/v2/futures';
export const BRAPI_TIMEOUT_MS = 30000;

export class BrapiHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`brapi falhou com HTTP ${status}`);
    this.name = 'BrapiHttpError';
    this.status = status;
  }
}

export class BrapiShapeError extends Error {
  constructor(what: string) {
    super(`resposta brapi inválida: ${what}`);
    this.name = 'BrapiShapeError';
  }
}

type FetchFn = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

interface TermStructure {
  asset?: unknown;
  contracts?: Array<{ symbol?: unknown; expirationDate?: unknown }>;
}

interface FutureHistory {
  future?: {
    symbol?: unknown;
    history?: Array<Record<string, unknown>>;
  };
}

/** Front contract = vencimento mais próximo ainda não expirado (YYYY-MM-DD). */
export function parseFrontContract(payload: unknown, today = new Date().toISOString().slice(0, 10)): string {
  const t = payload as TermStructure;
  if (!t || !Array.isArray(t.contracts) || t.contracts.length === 0) {
    throw new BrapiShapeError('term-structure sem contratos');
  }
  let best: string | null = null;
  let bestExp = '';
  for (const c of t.contracts) {
    if (typeof c.symbol !== 'string' || typeof c.expirationDate !== 'string') continue;
    if (c.expirationDate < today) continue;
    if (best === null || c.expirationDate < bestExp) {
      best = c.symbol;
      bestExp = c.expirationDate;
    }
  }
  if (best === null) throw new BrapiShapeError('nenhum contrato vigente');
  return best;
}

async function getJson(fetchFn: FetchFn, url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BRAPI_TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res.ok) throw new BrapiHttpError(res.status);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFrontContract(
  asset: string,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  const payload = await getJson(fetchFn, `${BRAPI_BASE_URL}/term-structure?asset=${asset}`);
  return parseFrontContract(payload);
}

export async function fetchFutureHistory(
  symbol: string,
  fetchFn: FetchFn = fetch,
): Promise<unknown> {
  return getJson(fetchFn, `${BRAPI_BASE_URL}/historical?symbol=${symbol}`);
}

function toDate(epochSeconds: unknown): string | null {
  if (typeof epochSeconds !== 'number' || !Number.isFinite(epochSeconds)) return null;
  const d = new Date(epochSeconds * 1000);
  const iso = d.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function toPositiveNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Normaliza barras brapi → DailyCandle (frozen). Descarta barras sem high/low/close. */
export function normalizeBrapiFuture(payload: unknown): DailyCandle[] {
  const root = payload as FutureHistory;
  const future = root?.future;
  if (!future || typeof future.symbol !== 'string' || !Array.isArray(future.history)) {
    throw new BrapiShapeError('future.history ausente');
  }
  // Símbolo contínuo do ativo (WDOX26 → WDO): meses F,G,H,J,K,M,N,Q,U,V,X + 2 dígitos.
  const base = future.symbol.replace(/[FGHJKMNQUVXZ]\d{2}$/, '');
  if (base === '') throw new BrapiShapeError('símbolo vazio');
  const out: DailyCandle[] = [];

  for (const bar of future.history) {
    const date = toDate(bar.date);
    const h = toPositiveNumber(bar.high);
    const l = toPositiveNumber(bar.low);
    const c = toPositiveNumber(bar.close);
    if (date === null || h === null || l === null || c === null) continue;
    const avg = toPositiveNumber(bar.average);
    const o = avg ?? c;
    const volume = typeof bar.volume === 'number' && Number.isFinite(bar.volume) ? bar.volume : 0;
    const trades = typeof bar.trades === 'number' && Number.isFinite(bar.trades) ? Math.round(bar.trades) : 0;
    out.push(
      Object.freeze({
        symbol: base,
        date,
        o,
        h: Math.max(h, l),
        l: Math.min(h, l),
        c,
        trades,
        qty: volume,
        volume,
      }),
    );
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}
