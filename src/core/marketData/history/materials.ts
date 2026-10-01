// core/marketData/history/materials.ts
// Materiais de estudo: JSON estático + cache WDO do navegador (localStorage).
// Sem regra de domínio — só leitura/mesclagem.
import type { DailyCandle } from './daily';

/** Cache do navegador → DailyCandle (dado diário; campos de trade zerados). */
export function wdoCacheToCandles(cache: WdoCache, symbol: string): DailyCandle[] {
  return cache.candles.map((c) =>
    Object.freeze({
      symbol,
      date: c.date,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      trades: 0,
      qty: 0,
      volume: c.volume,
    }),
  );
}

export interface StudySession {
  date: string;
  range: number;
  volume: number;
  gapPct: number;
  regime: string;
}

export interface StudyMaterial {
  symbol: string;
  generatedAt: string;
  sessions: StudySession[];
  /** true quando veio do cache local (brapi), não do JSON versionado. */
  live?: boolean;
}

export interface WdoCache {
  savedAt: string;
  candles: Array<{
    date: string;
    o: number;
    h: number;
    l: number;
    c: number;
    trades: number;
    qty: number;
    volume: number;
  }>;
}

const CACHE_KEY = 'ftp-wdo-cache';

export function loadStudyMaterials(): StudyMaterial[] {
  const modules = import.meta.glob<{ default: StudyMaterial }>(
    '../../../../data/materials/*.json',
    { eager: true },
  );
  return Object.values(modules).map((m) => m.default);
}

/** Lê o cache WDO do navegador (null quando ausente/corrompido). */
export function readWdoCache(storage: Pick<Storage, 'getItem'> | undefined): WdoCache | null {
  try {
    if (!storage) return null;
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WdoCache>;
    if (!Array.isArray(parsed.candles) || typeof parsed.savedAt !== 'string') return null;
    return { savedAt: parsed.savedAt, candles: parsed.candles };
  } catch {
    return null;
  }
}

export function writeWdoCache(
  storage: Pick<Storage, 'setItem'> | undefined,
  cache: WdoCache,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}
