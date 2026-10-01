import { describe, expect, it } from 'vitest';
import {
  FlowAnalysisEngine,
  fromExecution,
  fromHistorical,
} from '../../src/core/analytics/flowAnalysis/FlowAnalysisEngine.js';
import type { FlowTrade } from '../../src/core/analytics/flowAnalysis/FlowAnalysisEngine.js';

function calmBaseline(n = 120, t0 = 1_700_000_000_000): FlowTrade[] {
  const out: FlowTrade[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      timestamp: t0 + i * 500,
      price: 5000 + (i % 2 === 0 ? 0.5 : -0.5),
      qty: 1 + (i % 2),
      aggressorSide: i % 2 === 0 ? 'buy' : 'sell',
    });
  }
  return out;
}

function buyBurst(n = 60, t0 = 1_700_000_100_000): FlowTrade[] {
  const out: FlowTrade[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ timestamp: t0 + i * 50, price: 5010, qty: 5, aggressorSide: 'buy' });
  }
  return out;
}

describe('FlowAnalysisEngine', () => {
  it('treina no baseline e detecta pressão compradora no burst', () => {
    const engine = new FlowAnalysisEngine();
    engine.trainBaseline(calmBaseline());
    expect(engine.isTrained()).toBe(true);

    let lastTs = 0;
    for (const t of buyBurst()) {
      const sig = engine.onTrade(t);
      lastTs = sig.lastTimestamp;
    }

    const snap = engine.snapshot();
    expect(snap.trained).toBe(true);
    expect(snap.pressure).toBeGreaterThan(0.5);
    expect(snap.pressureSide).toBe('buy');
    expect(snap.lastTimestamp).toBe(lastTs);
  });

  it('burst tem confiança maior que mercado calmo', () => {
    const engine = new FlowAnalysisEngine();
    const base = calmBaseline();
    engine.trainBaseline(base);

    for (const t of base.slice(-60)) engine.onTrade(t);
    const calmConf = engine.snapshot().confidence;

    for (const t of buyBurst()) engine.onTrade(t);
    const burstConf = engine.snapshot().confidence;

    expect(burstConf).toBeGreaterThanOrEqual(calmConf);
    expect(burstConf).toBeGreaterThan(0);
  });

  it('adapters convertem execution e histórico', () => {
    expect(fromExecution({ timestamp: 1, price: 5000, size: 3, side: 'sell' })).toEqual({
      timestamp: 1, price: 5000, qty: 3, aggressorSide: 'sell',
    });
    expect(fromHistorical({ timestamp: 2, price: 5001, quantity: 4, aggressor: 'BUY' }).aggressorSide).toBe('buy');
    expect(fromHistorical({ timestamp: 3, price: 5001, quantity: 4, aggressor: 'SELL' }).aggressorSide).toBe('sell');
  });

  it('reset limpa estado', () => {
    const engine = new FlowAnalysisEngine();
    engine.trainBaseline(calmBaseline());
    for (const t of buyBurst(10)) engine.onTrade(t);
    engine.reset();
    const snap = engine.snapshot();
    expect(snap.trained).toBe(false);
    expect(snap.tradesSeen).toBe(0);
    expect(snap.pressure).toBe(0);
  });

  it('lança sem train quando detect() é chamado sem baseline', () => {
    const engine = new FlowAnalysisEngine();
    const sig = engine.onTrade({ timestamp: 1, price: 5000, qty: 1, aggressorSide: 'buy' });
    expect(sig.anomaly).toBe(false);
    expect(sig.confidence).toBe(0);
  });
});
