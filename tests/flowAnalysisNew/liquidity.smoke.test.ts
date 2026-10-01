import { describe, expect, it } from 'vitest';
import { LiquidityEngine } from '../../src/core/analytics/liquidity/index.js';
import { HeatmapEngine } from '../../src/core/analytics/liquidity/heatmapEngine.js';

describe('liquidity smoke', () => {
  it('detecta sweep em agressão concentrada', () => {
    const eng = new LiquidityEngine(0.5);
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 10; i++) {
      eng.processTrade({ time: t0 + i * 100, price: 5000, qty: 5, side: 'buy' });
    }
    const sweeps = eng.getSweptEvents();
    expect(sweeps.length).toBeGreaterThan(0);
    expect(sweeps[0]?.aggressorSide).toBe('buy');
  });

  it('measureRange calcula delta líquido', () => {
    const eng = new LiquidityEngine(0.5);
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) eng.processTrade({ time: t0 + i * 100, price: 5000, qty: 2, side: 'buy' });
    for (let i = 0; i < 3; i++) eng.processTrade({ time: t0 + 1000 + i * 100, price: 5001, qty: 1, side: 'sell' });
    const m = eng.measureRange(4999, 5002);
    expect(m.totalFilledVolume).toBe(13);
    expect(m.netDelta).toBe(7);
  });

  it('heatmap registra snapshot e cor', () => {
    const heat = new HeatmapEngine(0.5, 100);
    heat.pushSnapshot({
      bids: [{ price: 4999.5, qty: 10 }],
      asks: [{ price: 5000.5, qty: 12 }],
      bestBid: 4999.5,
      bestAsk: 5000.5,
      timestamp: Date.now(),
    });
    expect(heat.getSnapshots().length).toBe(1);
    expect(typeof heat.getColor(10, 25)).toBe('string');
  });
});
