import { describe, expect, it } from 'vitest';
import { RangeCandleEngine, RANGE_SIZE } from '../../src/core/marketData/candles/index';

function trade(price: number, qty = 1, side: 'buy' | 'sell' = 'buy', ts = 1000): Parameters<RangeCandleEngine['onTrade']>[0] {
  return { price, quantity: qty, aggressorSide: side, timestamp: ts };
}

describe('RangeCandleEngine (8P)', () => {
  it(`fecha quando range >= ${RANGE_SIZE}`, () => {
    const eng = new RangeCandleEngine();
    eng.onTrade(trade(5000));
    eng.onTrade(trade(5004));
    expect(eng.closed().length).toBe(0);
    eng.onTrade(trade(5008));
    const closed = eng.closed();
    expect(closed.length).toBe(1);
    expect(closed[0]?.open).toBe(5000);
    expect(closed[0]?.high).toBe(5008);
    expect(closed[0]?.low).toBe(5000);
    expect(closed[0]?.close).toBe(5008);
  });

  it('ignora ticks invalidos', () => {
    const eng = new RangeCandleEngine();
    eng.onTrade(trade(0));
    eng.onTrade(trade(5000, 0));
    expect(eng.snapshot().length).toBe(0);
  });

  it('candles fechados sao imutaveis; em formacao e copia', () => {
    const eng = new RangeCandleEngine();
    eng.onTrade(trade(5000));
    eng.onTrade(trade(5008));
    expect(Object.isFrozen(eng.closed()[0])).toBe(true);

    eng.onTrade(trade(5010));
    eng.onTrade(trade(5011));
    const snap = eng.snapshot();
    const forming = snap[snap.length - 1]!;
    expect(forming.closed).toBe(false);
    (forming as { volume: number }).volume = 9999;
    const fresh = eng.snapshot();
    expect(fresh[fresh.length - 1]?.volume).toBe(2);
  });

  it('soma agressao por lado', () => {
    const eng = new RangeCandleEngine();
    eng.onTrade(trade(5000, 3, 'buy'));
    eng.onTrade(trade(5001, 2, 'sell'));
    eng.onTrade(trade(5008, 1, 'buy'));
    const closed = eng.closed();
    expect(closed.length).toBe(1);
    expect(closed[0]?.buyVolume).toBe(4);
    expect(closed[0]?.sellVolume).toBe(2);
    expect(closed[0]?.volume).toBe(6);
  });
});
