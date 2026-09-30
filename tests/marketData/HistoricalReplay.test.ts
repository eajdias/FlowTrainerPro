import { existsSync, readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { parseCsvTrades } from '../../src/core/marketData/import';
import {
  HISTORICAL_REPLAY_EVENTS,
  HistoricalReplayController,
  HistoricalReplayError,
  HistoricalTradeReplaySource,
  MarketDataSourceGuard,
  type HistoricalReplayScheduler,
} from '../../src/core/marketData/replay';
import { usePositionStore } from '../../src/store/positionStore';
import type { MarketTrade } from '../../src/core/marketData/types';

class FakeScheduler implements HistoricalReplayScheduler {
  private tasks = new Map<number, { callback: () => void; delayMs: number }>();
  private nextId = 1;
  currentTime = 0;

  now(): number {
    return this.currentTime;
  }

  setTimeout(callback: () => void, delayMs: number): unknown {
    const id = this.nextId++;
    this.tasks.set(id, { callback, delayMs });
    return id;
  }

  clearTimeout(timerId: unknown): void {
    this.tasks.delete(timerId as number);
  }

  getTimerCount(): number {
    return this.tasks.size;
  }

  runNext(): void {
    const next = Array.from(this.tasks.entries())[0];
    if (!next) return;
    const [id, task] = next;
    this.tasks.delete(id);
    this.currentTime += task.delayMs;
    task.callback();
  }

  runAll(limit = 100000): void {
    let count = 0;
    while (this.tasks.size > 0 && count < limit) {
      this.runNext();
      count++;
    }
    if (count >= limit) throw new Error('FakeScheduler limit reached');
  }
}

const broker = Object.freeze({ code: 1, name: 'TESTE', raw: '1 - TESTE' });

function trade(index: number, timestamp = 1000, extra: Partial<MarketTrade> = {}): MarketTrade {
  return Object.freeze({
    tradeId: `trade-${index}`,
    sourceLine: index + 1,
    sourceSequence: index,
    chronologicalSequence: index,
    asset: 'WDOFUT',
    tradeDate: '13/07/2026',
    tradeTime: '09:00:00',
    timestamp,
    price: 5150 + index * 0.5,
    priceInTicks: 10300 + index,
    quantity: 10 + index,
    buyerBroker: broker,
    sellerBroker: broker,
    aggressor: index % 2 === 0 ? 'BUY' : 'SELL',
    source: 'HISTORICAL_CSV',
    ...extra,
  });
}

function sampleTrades(): MarketTrade[] {
  return [trade(0, 1000), trade(1, 2000), trade(2, 3000)];
}

function controllerWith(scheduler = new FakeScheduler(), maxTradesPerCycle = 500): { controller: HistoricalReplayController; scheduler: FakeScheduler; emitted: string[] } {
  const emitted: string[] = [];
  eventBus.on(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, (event: any) => emitted.push(event.trade.tradeId));
  return {
    controller: new HistoricalReplayController({
      scheduler,
      maxTradesPerCycle,
      replaySessionIdFactory: () => 'session-test',
    }),
    scheduler,
    emitted,
  };
}

describe('HistoricalTradeReplaySource', () => {
  beforeEach(() => {
    MarketDataSourceGuard.resetForTests();
    eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
  });

  afterEach(() => {
    MarketDataSourceGuard.resetForTests();
  });

  it('carrega lista valida, preserva acesso somente leitura e timestamps', () => {
    const source = new HistoricalTradeReplaySource(sampleTrades());
    expect(source.getTotalTrades()).toBe(3);
    expect(source.getFirstTimestamp()).toBe(1000);
    expect(source.getLastTimestamp()).toBe(3000);
    expect(Object.isFrozen(source.getTrades())).toBe(true);
  });

  it('rejeita lista vazia', () => {
    expect(() => new HistoricalTradeReplaySource([])).toThrow(HistoricalReplayError);
  });

  it('rejeita lista fora de ordem cronologica', () => {
    expect(() => new HistoricalTradeReplaySource([trade(0, 2000), trade(1, 1000)])).toThrow(HistoricalReplayError);
  });

  it('calcula offsets sinteticos determinísticos para same-second', () => {
    const source = new HistoricalTradeReplaySource([trade(0, 1000), trade(1, 1000), trade(2, 1000), trade(3, 2000)]);
    expect([0, 1, 2].map((index) => source.getSyntheticOffsetMs(index))).toEqual([0, 333, 666]);
    expect(source.getSyntheticOffsetMs(3)).toBe(0);
  });
});

describe('HistoricalReplayController lifecycle', () => {
  beforeEach(() => {
    MarketDataSourceGuard.resetForTests();
    eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
    eventBus.clear(HISTORICAL_REPLAY_EVENTS.STATE_UPDATED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
  });

  afterEach(() => {
    MarketDataSourceGuard.resetForTests();
  });

  it('possui estado inicial imutavel sem NaN ou Infinity', () => {
    const { controller } = controllerWith();
    const state = controller.getState();
    expect(state.status).toBe('IDLE');
    expect(Object.isFrozen(state)).toBe(true);
    expect(Number.isFinite(state.progress)).toBe(true);
    expect(Number.isFinite(state.elapsedHistoricalMs)).toBe(true);
  });

  it('load valido cria sessao LOADED sem emitir trades', () => {
    const { controller, emitted } = controllerWith();
    const state = controller.load(sampleTrades());
    expect(state.status).toBe('LOADED');
    expect(state.currentIndex).toBe(0);
    expect(state.totalTrades).toBe(3);
    expect(state.remainingTrades).toBe(3);
    expect(emitted).toEqual([]);
  });

  it('start e start idempotente nao criam timer duplicado', () => {
    const { controller, scheduler } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    controller.start();
    expect(controller.getState().status).toBe('PLAYING');
    expect(scheduler.getTimerCount()).toBe(1);
  });

  it('pause e pause idempotente preservam indice e cancelam timer', () => {
    const { controller, scheduler } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    scheduler.runNext();
    controller.pause();
    controller.pause();
    expect(controller.getState().status).toBe('PAUSED');
    expect(controller.getState().currentIndex).toBe(1);
    expect(scheduler.getTimerCount()).toBe(0);
  });

  it('resume continua sem duplicar trade nem timer', () => {
    const { controller, scheduler, emitted } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    scheduler.runNext();
    controller.pause();
    controller.resume();
    controller.resume();
    expect(scheduler.getTimerCount()).toBe(1);
    scheduler.runAll();
    expect(emitted).toEqual(['trade-0', 'trade-1', 'trade-2']);
  });

  it('stop e stop idempotente preservam indice e liberam fonte', () => {
    const { controller, scheduler } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    scheduler.runNext();
    controller.stop();
    controller.stop();
    expect(controller.getState().status).toBe('STOPPED');
    expect(controller.getState().currentIndex).toBe(1);
    expect(MarketDataSourceGuard.getActive()).toBeNull();
  });

  it('reset preserva lista carregada e volta ao indice zero', () => {
    const { controller, scheduler } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    scheduler.runNext();
    controller.reset();
    expect(controller.getState().status).toBe('LOADED');
    expect(controller.getState().currentIndex).toBe(0);
    expect(controller.getState().remainingTrades).toBe(3);
  });

  it('unload limpa sessao e volta para IDLE', () => {
    const { controller } = controllerWith();
    controller.load(sampleTrades());
    controller.unload();
    expect(controller.getState().status).toBe('IDLE');
    expect(controller.getState().totalTrades).toBe(0);
    expect(controller.getState().replaySessionId).toBeNull();
  });

  it('completa ao ultimo trade com progresso e remainingTrades corretos', () => {
    const { controller, scheduler, emitted } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    scheduler.runAll();
    const state = controller.getState();
    expect(emitted).toEqual(['trade-0', 'trade-1', 'trade-2']);
    expect(state.status).toBe('COMPLETED');
    expect(state.progress).toBe(1);
    expect(state.remainingTrades).toBe(0);
    expect(state.lastEmittedTradeId).toBe('trade-2');
  });

  it('setSpeed aceita velocidades oficiais e rejeita invalidas', () => {
    const { controller } = controllerWith();
    controller.setSpeed(4);
    expect(controller.getState().speed).toBe(4);
    expect(() => controller.setSpeed(3 as any)).toThrow(HistoricalReplayError);
  });

  it('seek por indice, percentual e timestamp reposiciona sem emitir retroativos', () => {
    const { controller, emitted } = controllerWith();
    controller.load(sampleTrades());
    controller.seek({ type: 'index', index: 2 });
    expect(controller.getState().currentIndex).toBe(2);
    controller.seek({ type: 'percent', percent: 0 });
    expect(controller.getState().currentIndex).toBe(0);
    controller.seek({ type: 'timestamp', timestamp: 2500 });
    expect(controller.getState().currentIndex).toBe(2);
    expect(emitted).toEqual([]);
  });

  it('same-second preserva sequencia, nao duplica e nao perde trades', () => {
    const { controller, scheduler, emitted } = controllerWith(new FakeScheduler(), 1);
    const trades = [trade(0, 1000), trade(1, 1000), trade(2, 1000), trade(3, 2000)];
    controller.load(trades);
    controller.start();
    scheduler.runAll();
    expect(emitted).toEqual(['trade-0', 'trade-1', 'trade-2', 'trade-3']);
    expect(new Set(emitted).size).toBe(4);
    expect(controller.getState().status).toBe('COMPLETED');
  });

  it('erro em scheduler cancela timer e publica estado ERROR', () => {
    const badScheduler: HistoricalReplayScheduler = {
      now: () => 0,
      setTimeout: () => { throw new Error('boom'); },
      clearTimeout: () => undefined,
    };
    const controller = new HistoricalReplayController({ scheduler: badScheduler, replaySessionIdFactory: () => 'bad-session' });
    controller.load(sampleTrades());
    controller.start();
    expect(controller.getState().status).toBe('ERROR');
    expect(controller.hasActiveTimer()).toBe(false);
  });
});

describe('HistoricalReplay isolation, determinism and source mode', () => {
  beforeEach(() => {
    MarketDataSourceGuard.resetForTests();
    eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
    usePositionStore.getState().reset();
  });

  afterEach(() => {
    MarketDataSourceGuard.resetForTests();
  });

  it('historical:trade:executed nao emite matching, nao altera posicao, PnL, stops ou FIFO', () => {
    const { controller, scheduler } = controllerWith();
    const matchingEvents: unknown[] = [];
    const unsubscribeMatching = eventBus.on(MATCHING_EVENTS.EXECUTION_CREATED, (event) => matchingEvents.push(event));
    const beforePosition = usePositionStore.getState();

    try {
      controller.load(sampleTrades());
      controller.start();
      scheduler.runAll();

      const afterPosition = usePositionStore.getState();
      expect(matchingEvents).toEqual([]);
      expect(afterPosition.side).toBe(beforePosition.side);
      expect(afterPosition.quantity).toBe(beforePosition.quantity);
      expect(afterPosition.realizedPnL).toBe(beforePosition.realizedPnL);
    } finally {
      unsubscribeMatching();
    }
  });

  it('mantem determinismo em 1x, 4x e 16x', () => {
    const results = ([1, 4, 16] as const).map((speed) => {
      MarketDataSourceGuard.resetForTests();
      eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
      const scheduler = new FakeScheduler();
      const emitted: { id: string; timestamp: number }[] = [];
      const unsubscribeTrade = eventBus.on(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, (event: any) => {
        emitted.push({ id: event.trade.tradeId, timestamp: event.historicalTimestamp });
      });
      const controller = new HistoricalReplayController({ scheduler, speed, replaySessionIdFactory: () => `session-${speed}` });
      try {
        controller.load(sampleTrades());
        controller.start();
        scheduler.runAll();
        return { emitted, state: controller.getState() };
      } finally {
        unsubscribeTrade();
      }
    });

    expect(results[0].emitted).toEqual(results[1].emitted);
    expect(results[1].emitted).toEqual(results[2].emitted);
    expect(results.every((result) => result.state.status === 'COMPLETED')).toBe(true);
    expect(results.every((result) => result.state.totalTrades === 3)).toBe(true);
  });

  it('source mode impede HISTORICAL_FILE junto com SYNTHETIC ou SCENARIO e libera em stop/reset', () => {
    MarketDataSourceGuard.acquire('SYNTHETIC', 'synthetic');
    const blocked = new HistoricalReplayController({ scheduler: new FakeScheduler(), replaySessionIdFactory: () => 'blocked' });
    blocked.load(sampleTrades());
    blocked.start();
    expect(blocked.getState().status).toBe('ERROR');
    MarketDataSourceGuard.release('synthetic');

    const { controller } = controllerWith();
    controller.load(sampleTrades());
    controller.start();
    expect(MarketDataSourceGuard.getActive()?.mode).toBe('HISTORICAL_FILE');
    controller.stop();
    expect(MarketDataSourceGuard.getActive()).toBeNull();

    MarketDataSourceGuard.acquire('SCENARIO', 'scenario');
    const blockedByScenario = new HistoricalReplayController({ scheduler: new FakeScheduler(), replaySessionIdFactory: () => 'blocked-scenario' });
    blockedByScenario.load(sampleTrades());
    blockedByScenario.start();
    expect(blockedByScenario.getState().status).toBe('ERROR');
  });

  it('apenas um replay controller ativo por vez', () => {
    const first = new HistoricalReplayController({ scheduler: new FakeScheduler(), replaySessionIdFactory: () => 'first' });
    const second = new HistoricalReplayController({ scheduler: new FakeScheduler(), replaySessionIdFactory: () => 'second' });
    first.load(sampleTrades());
    second.load(sampleTrades());
    first.start();
    second.start();
    expect(first.getState().status).toBe('PLAYING');
    expect(second.getState().status).toBe('ERROR');
    first.reset();
    expect(MarketDataSourceGuard.getActive()).toBeNull();
  });
});

describe('HistoricalReplay real CSV and load tests', () => {
  beforeEach(() => {
    MarketDataSourceGuard.resetForTests();
    eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
  });

  afterEach(() => {
    MarketDataSourceGuard.resetForTests();
  });

  it('executa 10.000 e 100.000 trades sinteticos sem perda ou duplicacao', () => {
    for (const total of [10000, 100000]) {
      MarketDataSourceGuard.resetForTests();
      eventBus.clear(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED);
      const scheduler = new FakeScheduler();
      const ids: string[] = [];
      const unsubscribeTrade = eventBus.on(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, (event: any) => ids.push(event.trade.tradeId));
      const trades = Array.from({ length: total }, (_, index) => trade(index, 1000 + Math.floor(index / 100)));
      const controller = new HistoricalReplayController({
        scheduler,
        maxTradesPerCycle: 1000,
        replaySessionIdFactory: () => `load-${total}`,
      });
      try {
        controller.load(trades);
        controller.start();
        controller.pause();
        expect(controller.getState().status).toBe('PAUSED');
        controller.resume();
        controller.stop();
        expect(controller.getState().status).toBe('STOPPED');
        controller.resume();
        scheduler.runAll(200000);
        expect(ids.length).toBe(total);
        expect(new Set(ids).size).toBe(total);
        expect(controller.getState().status).toBe('COMPLETED');
        expect(Number.isFinite(controller.getState().progress)).toBe(true);
      } finally {
        unsubscribeTrade();
      }
    }
  });

  it('executa CSV real completo quando arquivo existe', () => {
    const filePath = 'data/imports/WDOFUT_F_0_Trade_13-07-2026.csv';
    if (!existsSync(filePath)) {
      console.warn(`SKIPPED: CSV real nao encontrado em ${filePath}`);
      return;
    }

    const buffer = readFileSync(filePath);
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      text = new TextDecoder('latin1').decode(buffer);
    }
    const parsed = parseCsvTrades(text, { now: () => 0 });
    const scheduler = new FakeScheduler();
    const emitted: string[] = [];
    const matchingEvents: unknown[] = [];
    const unsubscribeTrade = eventBus.on(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, (event: any) => emitted.push(event.trade.tradeId));
    const unsubscribeMatching = eventBus.on(MATCHING_EVENTS.EXECUTION_CREATED, (event) => matchingEvents.push(event));

    const controller = new HistoricalReplayController({
      scheduler,
      speed: 16,
      maxTradesPerCycle: 2000,
      replaySessionIdFactory: () => 'real-csv',
    });
    try {
      controller.load(parsed.trades);
      controller.start();
      scheduler.runAll(200000);

      expect(emitted.length).toBe(parsed.diagnostics.validTradeCount);
      expect(emitted[0]).toBe(parsed.trades[0].tradeId);
      expect(emitted[emitted.length - 1]).toBe(parsed.trades[parsed.trades.length - 1].tradeId);
      expect(new Set(emitted).size).toBe(emitted.length);
      expect(controller.getState().status).toBe('COMPLETED');
      expect(matchingEvents).toEqual([]);
    } finally {
      unsubscribeTrade();
      unsubscribeMatching();
    }
  });
});
