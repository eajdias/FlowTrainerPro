import { describe, expect, it } from 'vitest';
import {
  ConstantLatency,
  JitteredLatency,
  EmpiricalPlayback,
  EmpiricalBootstrap,
} from '../../src/core/marketData/latency/index.js';
import { applyReplayLatency } from '../../src/core/marketData/latency/index.js';

const trades = [
  { timestamp: 1000, price: 5000 },
  { timestamp: 2000, price: 5001 },
  { timestamp: 3000, price: 5002 },
];

describe('latency models', () => {
  it('constante zero preserva timestamps', () => {
    const out = applyReplayLatency(trades, new ConstantLatency(0, 0));
    expect(out.map((t) => t.timestamp)).toEqual([1000, 2000, 3000]);
  });

  it('constante desloca entry+response', () => {
    // 1.5ms + 0.5ms = 2ms
    const out = applyReplayLatency(trades, new ConstantLatency(1_500_000, 500_000));
    expect(out.map((t) => t.timestamp)).toEqual([1002, 2002, 3002]);
  });

  it('jitter com mesma seed é determinístico', () => {
    const a = new JitteredLatency(1_000_000, 1_000_000, 500_000, 42);
    const b = new JitteredLatency(1_000_000, 1_000_000, 500_000, 42);
    expect(a.sample(0)).toEqual(b.sample(0));
    expect(a.sample(1)).toEqual(b.sample(1));
  });

  it('jitter respeita bounds', () => {
    const m = new JitteredLatency(2_000_000, 2_000_000, 500_000, 7);
    for (let i = 0; i < 20; i++) {
      const s = m.sample(i);
      expect(s.entryNs).toBeGreaterThanOrEqual(1_500_000);
      expect(s.entryNs).toBeLessThanOrEqual(2_500_000);
    }
  });

  it('playback esgota e reset recupera', () => {
    const p = new EmpiricalPlayback([
      { tsNs: 0, entryNs: 1_000_000, responseNs: 0 },
      { tsNs: 1, entryNs: 2_000_000, responseNs: 0 },
    ]);
    expect(p.sample(0)).toEqual({ entryNs: 1_000_000, responseNs: 0 });
    expect(p.sample(1)).toEqual({ entryNs: 2_000_000, responseNs: 0 });
    expect(() => p.sample(2)).toThrow();
    p.reset();
    expect(p.sample(0)).toEqual({ entryNs: 1_000_000, responseNs: 0 });
  });

  it('bootstrap amostra dentro do conjunto', () => {
    const b = new EmpiricalBootstrap(
      [
        { tsNs: 0, entryNs: 1_000_000, responseNs: 100 },
        { tsNs: 1, entryNs: 2_000_000, responseNs: 200 },
      ],
      3,
    );
    for (let i = 0; i < 10; i++) {
      const s = b.sample(i);
      expect([1_000_000, 2_000_000]).toContain(s.entryNs);
    }
  });

  it('adapter reordena após shifts diferentes', () => {
    const close = [
      { timestamp: 1000, price: 1 },
      { timestamp: 1001, price: 2 },
    ];
    const p = new EmpiricalPlayback([
      { tsNs: 0, entryNs: 5_000_000, responseNs: 0 },
      { tsNs: 1, entryNs: 0, responseNs: 0 },
    ]);
    const out = applyReplayLatency(close, p);
    expect(out[0]?.price).toBe(2);
    expect(out[1]?.price).toBe(1);
  });
});
