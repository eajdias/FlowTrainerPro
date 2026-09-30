import { describe, expect, it } from 'vitest';
import { FlowMetrics } from '../../src/core/flowAnalysis/FlowMetrics';
import type { FlowTradeEvent } from '../../src/core/flowAnalysis/FlowAnalysisTypes';

function trade(side: 'buy' | 'sell', size: number, timestamp: number, price = 5000): FlowTradeEvent {
  return { side, size, timestamp, price };
}

describe('FlowMetrics', () => {
  it('inicia zerado', () => {
    const metrics = new FlowMetrics();
    const snap = metrics.snapshot();

    expect(snap.buyerAggressorVolume).toBe(0);
    expect(snap.sellerAggressorVolume).toBe(0);
    expect(snap.delta).toBe(0);
    expect(snap.cumulativeDelta).toBe(0);
    expect(snap.tradeCount).toBe(0);
    expect(snap.tradedVolume).toBe(0);
    expect(snap.lastAggressorSide).toBe('NONE');
  });

  it('processa agressao compradora', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 10, 1_000));

    const snap = metrics.snapshot();
    expect(snap.buyerAggressorVolume).toBe(10);
    expect(snap.tradedVolume).toBe(10);
    expect(snap.tradeCount).toBe(1);
    expect(snap.delta).toBe(10);
    expect(snap.lastAggressorSide).toBe('BUY');
    expect(snap.lastAggression).toBe(10);
  });

  it('processa agressao vendedora', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('sell', 7, 1_000));

    const snap = metrics.snapshot();
    expect(snap.sellerAggressorVolume).toBe(7);
    expect(snap.delta).toBe(-7);
    expect(snap.lastAggressorSide).toBe('SELL');
  });

  it('mantem delta acumulado correto', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 10, 1_000));
    metrics.onTradeExecuted(trade('sell', 4, 2_000));
    metrics.onTradeExecuted(trade('buy', 3, 3_000));

    expect(metrics.snapshot().cumulativeDelta).toBe(9);
  });

  it('calcula volume medio por trade', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 10, 1_000));
    metrics.onTradeExecuted(trade('sell', 20, 2_000));
    metrics.onTradeExecuted(trade('buy', 30, 3_000));

    expect(metrics.snapshot().averageVolumePerTrade).toBe(20);
  });

  it('mantem maior agressao recente dentro da janela e remove expiradas', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 100, 1_000));

    for (let i = 0; i < 63; i++) {
      metrics.onTradeExecuted(trade('buy', 10, 2_000 + i));
    }

    expect(metrics.snapshot().largestRecentAggression).toBe(100);

    metrics.onTradeExecuted(trade('sell', 10, 9_999));
    expect(metrics.snapshot().largestRecentAggression).toBe(10);
  });

  it('controla sequencia de agressao por lado', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 1, 1_000));
    metrics.onTradeExecuted(trade('buy', 1, 2_000));
    expect(metrics.snapshot().aggressionSequence).toBe(2);
    expect(metrics.snapshot().lastAggressorSide).toBe('BUY');

    metrics.onTradeExecuted(trade('sell', 1, 3_000));
    expect(metrics.snapshot().aggressionSequence).toBe(1);
    expect(metrics.snapshot().lastAggressorSide).toBe('SELL');

    metrics.onTradeExecuted(trade('sell', 1, 4_000));
    metrics.onTradeExecuted(trade('sell', 1, 5_000));
    expect(metrics.snapshot().aggressionSequence).toBe(3);
    expect(metrics.snapshot().lastAggressorSide).toBe('SELL');
  });

  it('calcula velocidade por timestamps fornecidos', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 1, 1_000));
    expect(metrics.snapshot().tradeVelocity).toBe(1);

    metrics.onTradeExecuted(trade('buy', 1, 1_500));
    expect(metrics.snapshot().tradeVelocity).toBeCloseTo(4, 8);

    metrics.onTradeExecuted(trade('buy', 1, 2_000));
    expect(metrics.snapshot().tradeVelocity).toBeCloseTo(3, 8);
  });

  it('calcula media movel de velocidade', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 1, 1_000)); // v = 1
    metrics.onTradeExecuted(trade('buy', 1, 1_500)); // v = 4
    metrics.onTradeExecuted(trade('buy', 1, 2_000)); // v = 3

    expect(metrics.snapshot().tradeVelocityMovingAverage).toBeCloseTo((1 + 4 + 3) / 3, 8);
  });

  it('reset limpa estado e buffers internos', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted(trade('buy', 9, 1_000));
    metrics.onTradeExecuted(trade('sell', 4, 2_000));

    metrics.reset();
    const snap = metrics.snapshot();
    expect(snap.tradeCount).toBe(0);
    expect(snap.tradedVolume).toBe(0);
    expect(snap.cumulativeDelta).toBe(0);
    expect(snap.tradeVelocity).toBe(0);
    expect(snap.tradeVelocityMovingAverage).toBe(0);
    expect(snap.lastAggressorSide).toBe('NONE');
    expect(snap.largestRecentAggression).toBe(0);
  });
});
