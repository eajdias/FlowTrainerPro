import { describe, expect, it } from 'vitest';
import {
  FLOW_ANALYSIS_EVENTS,
  FLOW_ANALYSIS_SOURCE_EVENTS,
  FlowAnalysisEngine,
} from '../../src/core/flowAnalysis/FlowAnalysisEngine';
import { BOOK_EVENTS } from '../../src/core/kernel/OrderBookEngine';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { TestEventBus } from './TestEventBus';

function executionPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    executionId: 'exec-1',
    timestamp: 10_000,
    tick: 10,
    aggressorOrderId: 'a1',
    passiveOrderId: 'p1',
    aggressorPlayerId: 'player-a',
    passivePlayerId: 'player-p',
    aggressorBrokerId: 101,
    passiveBrokerId: 202,
    side: 'buy',
    price: 5_001,
    size: 8,
    remainingAggressor: 0,
    remainingPassive: 0,
    ...overrides,
  };
}

function bookPayload() {
  return {
    bids: [{ price: 5_000, side: 'bid' as const, totalSize: 12, orderCount: 2 }],
    asks: [{ price: 5_001, side: 'ask' as const, totalSize: 7, orderCount: 1 }],
    bestBid: 5_000,
    bestAsk: 5_001,
    spread: 1,
  };
}

describe('FlowAnalysisEngine', () => {
  it('start registra assinaturas e start duplo nao duplica', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: false, eventBus: bus, now: () => 1_000 });

    expect(bus.listenerCount()).toBe(0);

    engine.start();
    const listenersAfterFirstStart = bus.listenerCount();
    expect(listenersAfterFirstStart).toBe(14);

    engine.start();
    expect(bus.listenerCount()).toBe(listenersAfterFirstStart);

    engine.stop();
  });

  it('stop remove assinaturas e stop duplo nao falha', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000 });

    expect(bus.listenerCount()).toBeGreaterThan(0);

    engine.stop();
    expect(bus.listenerCount()).toBe(0);

    expect(() => engine.stop()).not.toThrow();
  });

  it('eventos apos stop nao alteram metricas', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000 });

    engine.stop();
    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, executionPayload());

    expect(engine.getSnapshot().metrics.tradeCount).toBe(0);
  });

  it('TRADE_EXECUTED valido atualiza metricas e contexto', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000 });

    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, executionPayload());

    const snapshot = engine.getSnapshot();
    expect(snapshot.metrics.tradeCount).toBe(1);
    expect(snapshot.metrics.buyerAggressorVolume).toBe(8);
    expect(snapshot.context.currentPrice).toBe(5_001);
    expect(snapshot.context.currentAggressor).toBe('BUY');
    expect(snapshot.context.lastTrade?.size).toBe(8);

    engine.stop();
  });

  it('payload invalido e ignorado sem quebrar engine', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000 });

    expect(() => bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, { side: 'buy', price: 100 })).not.toThrow();
    expect(engine.getSnapshot().metrics.tradeCount).toBe(0);

    engine.stop();
  });

  it('BOOK_UPDATE atualiza contexto sem alterar metricas', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 1_000 });

    bus.emit(BOOK_EVENTS.BOOK_UPDATE, bookPayload());

    const snapshot = engine.getSnapshot();
    expect(snapshot.metrics.tradeCount).toBe(0);
    expect(snapshot.context.bookSnapshot?.bestBid).toBe(5_000);
    expect(snapshot.context.bookSnapshot?.bestAsk).toBe(5_001);

    engine.stop();
  });

  it('LAST_PRICE_UPDATE atualiza preco corretamente', () => {
    const bus = new TestEventBus();
    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 5_000 });

    bus.emit('market:last-price:update', { price: 5_123, timestamp: 5_010 });
    expect(engine.getSnapshot().context.currentPrice).toBe(5_123);
    expect(engine.getSnapshot().context.timestamp).toBe(5_010);

    bus.emit(FLOW_ANALYSIS_SOURCE_EVENTS.LAST_PRICE_UPDATE, 5_200);
    expect(engine.getSnapshot().context.currentPrice).toBe(5_200);

    engine.stop();
  });

  it('cada atualizacao valida publica flow:analysis:snapshot:updated com estrutura completa', () => {
    const bus = new TestEventBus();
    const published: unknown[] = [];
    bus.on(FLOW_ANALYSIS_EVENTS.SNAPSHOT_UPDATED, (payload) => {
      published.push(payload);
    });

    const engine = new FlowAnalysisEngine({ autoStart: false, eventBus: bus, now: () => 9_000 });
    engine.start();

    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, executionPayload({ timestamp: 9_001 }));
    bus.emit(BOOK_EVENTS.BOOK_UPDATE, bookPayload());
    bus.emit('market:last-price:update', { price: 5_050, timestamp: 9_002 });

    expect(published.length).toBeGreaterThanOrEqual(4); // start + 3 updates

    const last = published[published.length - 1] as {
      metrics: unknown;
      context: unknown;
      signals: unknown;
      timestamp: number;
    };

    expect(last.metrics).toBeTruthy();
    expect(last.context).toBeTruthy();
    expect(last.signals).toBeTruthy();
    expect(typeof last.timestamp).toBe('number');

    const signals = last.signals as Record<string, boolean>;
    expect(Object.values(signals).every((v) => v === false)).toBe(true);

    engine.stop();
  });

  it('reset limpa estado e publica snapshot zerado', () => {
    const bus = new TestEventBus();
    let publishCount = 0;
    bus.on(FLOW_ANALYSIS_EVENTS.SNAPSHOT_UPDATED, () => {
      publishCount += 1;
    });

    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus: bus, now: () => 4_000 });
    bus.emit(MATCHING_EVENTS.EXECUTION_CREATED, executionPayload({ timestamp: 4_001, size: 5 }));

    const before = publishCount;
    engine.reset();
    const snapshot = engine.getSnapshot();

    expect(publishCount).toBe(before + 1);
    expect(snapshot.metrics.tradeCount).toBe(0);
    expect(snapshot.metrics.tradedVolume).toBe(0);
    expect(snapshot.context.currentPrice).toBe(0);
    expect(snapshot.context.lastTrade).toBeNull();

    engine.stop();
  });
});
