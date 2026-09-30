import { describe, expect, it } from 'vitest';
import { FlowMetrics } from '../../src/core/flowAnalysis/FlowMetrics';
import { FlowContext } from '../../src/core/flowAnalysis/FlowContext';
import { FlowSignals } from '../../src/core/flowAnalysis/FlowSignals';
import { FlowAnalysisEngine } from '../../src/core/flowAnalysis/FlowAnalysisEngine';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { TestEventBus } from './TestEventBus';

describe('Flow snapshots imutaveis', () => {
  it('FlowMetricsSnapshot e imutavel', () => {
    const metrics = new FlowMetrics();
    metrics.onTradeExecuted({ price: 5000, size: 5, side: 'buy', timestamp: 1_000 });
    const snap = metrics.snapshot() as unknown as { tradeCount: number };

    expect(() => {
      snap.tradeCount = 999;
    }).toThrow();
  });

  it('FlowContextSnapshot e estruturas aninhadas sao imutaveis', () => {
    const context = new FlowContext();
    const sourceBook = {
      bids: [{ price: 100, side: 'bid' as const, totalSize: 10, orderCount: 1 }],
      asks: [{ price: 101, side: 'ask' as const, totalSize: 12, orderCount: 2 }],
      bestBid: 100,
      bestAsk: 101,
      spread: 1,
    };

    context.onBookUpdate(sourceBook, 1_000);
    const snap = context.snapshot();
    const mutableBook = snap.bookSnapshot as unknown as {
      bids: Array<{ totalSize: number }>;
      asks: Array<{ totalSize: number }>;
    };

    expect(() => {
      mutableBook.bids.push({ totalSize: 1 });
    }).toThrow();

    expect(() => {
      mutableBook.asks[0].totalSize = 999;
    }).toThrow();

    sourceBook.bids[0].totalSize = 777;
    expect(context.snapshot().bookSnapshot?.bids[0].totalSize).toBe(10);
  });

  it('FlowSignalSnapshot e imutavel', () => {
    const signals = new FlowSignals();
    const snap = signals.getSnapshot() as unknown as { isMomentum: boolean };

    expect(() => {
      snap.isMomentum = true;
    }).toThrow();
  });

  it('FlowAnalysisSnapshot e imutavel com aninhamento protegido', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 4_000 });

    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
      executionId: 'e1',
      timestamp: 4_100,
      tick: 1,
      aggressorOrderId: 'ao',
      passiveOrderId: 'po',
      aggressorPlayerId: 'p1',
      passivePlayerId: 'p2',
      aggressorBrokerId: 1,
      passiveBrokerId: 2,
      side: 'buy',
      price: 5001,
      size: 3,
      remainingAggressor: 0,
      remainingPassive: 0,
    });

    const snapshot = engine.getSnapshot() as unknown as {
      metrics: { tradeCount: number };
      signals: { isReversal: boolean };
    };

    expect(() => {
      snapshot.metrics.tradeCount = 999;
    }).toThrow();

    expect(() => {
      snapshot.signals.isReversal = true;
    }).toThrow();

    engine.stop();
  });
});
