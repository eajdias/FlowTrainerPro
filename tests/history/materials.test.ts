import { describe, expect, it } from 'vitest';
import { buildSessionStats } from '../../src/core/analytics/history/sessionStats';
import type { DailyCandle } from '../../src/core/marketData/history/daily';

function candle(date: string, o: number, h: number, l: number, c: number, volume: number): DailyCandle {
  return Object.freeze({ symbol: 'PETR4', date, o, h, l, c, trades: 10, qty: volume, volume });
}

const calm = [
  candle('2024-01-02', 10, 10.5, 9.8, 10.1, 1000),
  candle('2024-01-03', 10.1, 10.6, 9.9, 10.2, 1100),
];

describe('sessionStats (spec 4)', () => {
  it('calcula range, volume e gap da sessao', () => {
    const out = buildSessionStats(calm);
    expect(out.length).toBe(2);
    expect(out[0]?.range).toBeCloseTo(0.7, 8);
    expect(out[0]?.volume).toBe(1000);
    expect(out[0]?.gapPct).toBe(0);
    expect(out[1]?.gapPct).toBeCloseTo(((10.1 - 10.1) / 10.1) * 100, 8);
  });

  it('classifica tendencia de corpo cheio', () => {
    const out = buildSessionStats([
      ...calm,
      candle('2024-01-04', 10.2, 12.0, 10.1, 11.9, 5000),
    ]);
    expect(out[2]?.regime).toBe('trend-up');
  });

  it('dia sem volume nao quebra e lista vazia retorna []', () => {
    const out = buildSessionStats([candle('2024-01-02', 10, 10, 10, 10, 0)]);
    expect(out[0]?.regime).toBe('range');
    expect(buildSessionStats([])).toEqual([]);
  });
});
