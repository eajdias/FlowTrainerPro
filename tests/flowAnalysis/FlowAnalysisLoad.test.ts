import { describe, expect, it } from 'vitest';
import { FlowAnalysisEngine } from '../../src/core/flowAnalysis/FlowAnalysisEngine';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { TestEventBus } from './TestEventBus';

describe('FlowAnalysisEngine carga controlada', () => {
  it('processa 10.000 trades deterministically sem crescimento ilimitado de janela', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000_000 });

    let expectedTradeCount = 0;
    let expectedTotalVolume = 0;
    let expectedBuyVolume = 0;
    let expectedSellVolume = 0;
    let expectedCumulativeDelta = 0;
    let expectedDelta = 0;

    const start = Date.now();

    // Primeiro evento grande para validar expiracao da janela de agressao recente.
    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
      executionId: 'load-0',
      timestamp: 1_000_000,
      tick: 0,
      aggressorOrderId: 'ao-0',
      passiveOrderId: 'po-0',
      aggressorPlayerId: 'pa',
      passivePlayerId: 'pp',
      aggressorBrokerId: 1,
      passiveBrokerId: 2,
      side: 'buy',
      price: 5_000,
      size: 1_000,
      remainingAggressor: 0,
      remainingPassive: 0,
    });

    expectedTradeCount += 1;
    expectedTotalVolume += 1_000;
    expectedBuyVolume += 1_000;
    expectedCumulativeDelta += 1_000;
    expectedDelta = 1_000;

    for (let i = 1; i < 10_000; i++) {
      const side = i % 2 === 0 ? 'buy' : 'sell';
      const size = (i % 7) + 1;
      const signed = side === 'buy' ? size : -size;

      bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
        executionId: `load-${i}`,
        timestamp: 1_000_000 + i * 10,
        tick: i,
        aggressorOrderId: `ao-${i}`,
        passiveOrderId: `po-${i}`,
        aggressorPlayerId: 'pa',
        passivePlayerId: 'pp',
        aggressorBrokerId: 1,
        passiveBrokerId: 2,
        side,
        price: 5_000 + (i % 5),
        size,
        remainingAggressor: 0,
        remainingPassive: 0,
      });

      expectedTradeCount += 1;
      expectedTotalVolume += size;
      if (side === 'buy') {
        expectedBuyVolume += size;
      } else {
        expectedSellVolume += size;
      }
      expectedCumulativeDelta += signed;
      expectedDelta = signed;
    }

    const elapsedMs = Date.now() - start;

    const snapshot = engine.getSnapshot();
    expect(snapshot.metrics.tradeCount).toBe(expectedTradeCount);
    expect(snapshot.metrics.tradedVolume).toBe(expectedTotalVolume);
    expect(snapshot.metrics.buyerAggressorVolume).toBe(expectedBuyVolume);
    expect(snapshot.metrics.sellerAggressorVolume).toBe(expectedSellVolume);
    expect(snapshot.metrics.cumulativeDelta).toBe(expectedCumulativeDelta);
    expect(snapshot.metrics.delta).toBe(expectedDelta);

    // O valor 1000 deve sair da janela (64) ao final.
    expect(snapshot.metrics.largestRecentAggression).toBeLessThanOrEqual(7);

    // Sanidade para buffers de velocidade/medias: sem NaN/infinito.
    expect(Number.isFinite(snapshot.metrics.tradeVelocity)).toBe(true);
    expect(Number.isFinite(snapshot.metrics.tradeVelocityMovingAverage)).toBe(true);

    // Informativo de tempo (sem assercao frágil de performance rígida).
    expect(elapsedMs).toBeGreaterThanOrEqual(0);

    engine.stop();
  });
});
