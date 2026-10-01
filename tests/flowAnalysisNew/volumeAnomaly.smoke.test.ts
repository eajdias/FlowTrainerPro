import { describe, expect, it } from 'vitest';
import { VolumeAnomalyDetector } from '../../src/core/analytics/volumeAnomaly/index.js';
import type { IAggregatedTradeData } from '../../src/core/analytics/volumeAnomaly/index.js';

function synth(n: number, t0: number, stepMs: number, buyRatio: number, qty: number): IAggregatedTradeData[] {
  const out: IAggregatedTradeData[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      timestamp: t0 + i * stepMs,
      qty,
      isBuyerMaker: (i % 10) / 10 >= buyRatio,
    });
  }
  return out;
}

describe('volumeAnomaly smoke', () => {
  it('train + detect retornam shape válido', () => {
    const d = new VolumeAnomalyDetector();
    d.train(synth(120, 1_700_000_000_000, 500, 0.5, 2));
    const r = d.detect(synth(80, 1_700_000_100_000, 400, 0.5, 2));
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(['none', 'notable', 'strong', 'extreme']).toContain(r.severity);
    expect(Array.isArray(r.signals)).toBe(true);
    expect(typeof r.imbalance).toBe('number');
  });

  it('burst intenso eleva confiança vs basal', () => {
    const d = new VolumeAnomalyDetector();
    d.train(synth(150, 1_700_000_000_000, 500, 0.5, 1));
    const calm = d.detect(synth(60, 1_700_000_100_000, 500, 0.5, 1));
    const burst = d.detect(synth(60, 1_700_000_200_000, 40, 0.9, 8));
    expect(burst.confidence).toBeGreaterThanOrEqual(calm.confidence);
  });

  it('rejeita train com poucos trades', () => {
    const d = new VolumeAnomalyDetector();
    expect(() => d.train(synth(10, 1, 100, 0.5, 1))).toThrow();
  });
});
