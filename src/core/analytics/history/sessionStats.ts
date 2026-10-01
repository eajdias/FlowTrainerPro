// analytics/history/sessionStats.ts (Spec 4/4)
// Estatísticas por sessão a partir de candles diários. Puro, sem IO.
// Regime v1 (determinístico, documentado):
//   1. corpo >= 60% do range e close > open  → trend-up (inverso: trend-down)
//   2. range >= 2× ATR(14)                    → volatile
//   3. caso contrário                         → range

import type { DailyCandle } from '../../marketData/history/daily';

export type SessionRegime = 'range' | 'trend-up' | 'trend-down' | 'volatile';

export interface SessionStat {
  date: string;
  range: number;
  volume: number;
  gapPct: number;
  regime: SessionRegime;
}

const ATR_PERIOD = 14;
const BODY_RATIO = 0.6;
const VOLATILE_MULT = 2;

export function buildSessionStats(candles: DailyCandle[]): SessionStat[] {
  const ranges: number[] = [];
  const out: SessionStat[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const range = Math.max(0, c.h - c.l);
    const prev = i > 0 ? candles[i - 1]! : null;
    const gapPct = prev && prev.c !== 0 ? ((c.o - prev.c) / prev.c) * 100 : 0;

    const window = ranges.slice(-ATR_PERIOD);
    const atr = window.length > 0 ? window.reduce((s, r) => s + r, 0) / window.length : range;
    const body = range > 0 ? Math.abs(c.c - c.o) / range : 0;

    let regime: SessionRegime = 'range';
    if (body >= BODY_RATIO && c.c > c.o) regime = 'trend-up';
    else if (body >= BODY_RATIO && c.c < c.o) regime = 'trend-down';
    else if (atr > 0 && range >= VOLATILE_MULT * atr) regime = 'volatile';

    out.push({ date: c.date, range, volume: c.volume, gapPct, regime });
    ranges.push(range);
  }
  return out;
}
