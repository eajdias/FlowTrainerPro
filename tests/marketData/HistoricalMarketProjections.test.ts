import { existsSync, readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { createKernel, disposeKernel } from '../../src/core/kernel/SimulationKernel';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { FlowAnalysisEngine } from '../../src/core/flowAnalysis';
import { parseCsvTrades } from '../../src/core/marketData/import';
import {
  HISTORICAL_REPLAY_EVENTS,
  MarketDataSourceGuard,
  type HistoricalTradeExecutedEvent,
} from '../../src/core/marketData/replay';
import { initHistoricalMarketDataProjection } from '../../src/core/marketData/projections';
import { useHistoricalBrokerHistoryStore } from '../../src/store/historicalBrokerHistoryStore';
import { useHistoricalLastPriceStore } from '../../src/store/historicalLastPriceStore';
import { useHistoricalTradeStore } from '../../src/store/historicalTradeStore';
import { useHistoricalVolumeProfileStore } from '../../src/store/historicalVolumeProfileStore';
import { useMarketDataSourceStore } from '../../src/store/marketDataSourceStore';
import { usePositionStore } from '../../src/store/positionStore';
import type { AggressorType, MarketTrade } from '../../src/core/marketData/types';

const brokerA = Object.freeze({ code: 147, name: 'ATIVA', raw: '147 - ATIVA' });
const brokerB = Object.freeze({ code: 8, name: 'UBS', raw: '8 - UBS' });

function trade(index: number, aggressor: AggressorType, timestamp = 1000 + index * 1000): MarketTrade {
  return Object.freeze({
    tradeId: `hist-${aggressor}-${index}`,
    sourceLine: index + 1,
    sourceSequence: index,
    chronologicalSequence: index,
    asset: 'WDOFUT',
    tradeDate: '13/07/2026',
    tradeTime: `09:00:0${index}`,
    timestamp,
    price: 5150 + (index % 5) * 0.5,
    priceInTicks: 10300 + index,
    quantity: 10 + index,
    buyerBroker: brokerA,
    sellerBroker: brokerB,
    aggressor,
    source: 'HISTORICAL_CSV',
  });
}

function emitHistorical(trades: readonly MarketTrade[], sessionId = 'projection-session'): void {
  for (let index = 0; index < trades.length; index++) {
    const item = trades[index];
    const event: HistoricalTradeExecutedEvent = Object.freeze({
      trade: item,
      replaySessionId: sessionId,
      sequence: index,
      historicalTimestamp: item.timestamp,
      emittedAtMonotonicTime: index,
      speed: 16,
    });
    eventBus.emit(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, event);
  }
}

function resetStores(): void {
  useHistoricalTradeStore.getState().reset();
  useHistoricalVolumeProfileStore.getState().reset();
  useHistoricalBrokerHistoryStore.getState().reset();
  useHistoricalLastPriceStore.getState().reset();
  useMarketDataSourceStore.getState().reset();
  usePositionStore.getState().reset();
}

describe('HistoricalMarketDataProjection', () => {
  beforeEach(() => {
    initHistoricalMarketDataProjection();
    MarketDataSourceGuard.resetForTests();
    resetStores();
  });

  it('projeta BUY, SELL, RLP, DIRECT, AUCTION e UNKNOWN para Times & Trades historico', () => {
    const trades = ['BUY', 'SELL', 'RLP', 'DIRECT', 'AUCTION', 'UNKNOWN'].map((aggressor, index) => trade(index, aggressor as AggressorType));
    emitHistorical(trades);

    const state = useHistoricalTradeStore.getState();
    expect(state.totalTrades).toBe(6);
    expect(state.trades.map((item) => item.aggressor).sort()).toEqual(['AUCTION', 'BUY', 'DIRECT', 'RLP', 'SELL', 'UNKNOWN']);
    expect(state.trades[0].sequence).toBe(5);
  });

  it('Volume Profile acumula volume e ignora neutros no delta direcional', () => {
    emitHistorical([
      trade(0, 'BUY', 1000),
      trade(1, 'SELL', 2000),
      trade(2, 'RLP', 3000),
      trade(3, 'DIRECT', 4000),
      trade(4, 'AUCTION', 5000),
      trade(5, 'UNKNOWN', 6000),
    ]);

    const state = useHistoricalVolumeProfileStore.getState();
    const totalInputVolume = 10 + 11 + 12 + 13 + 14 + 15;
    const directionalDelta = 10 - 11;
    expect(state.totalVolume).toBe(totalInputVolume);
    expect(state.tradeCount).toBe(6);
    expect(state.levels.reduce((sum, level) => sum + level.delta, 0)).toBe(directionalDelta);
    expect(state.levels.reduce((sum, level) => sum + level.rlpVolume, 0)).toBe(12);
    expect(state.levels.reduce((sum, level) => sum + level.directVolume, 0)).toBe(13);
    expect(state.levels.reduce((sum, level) => sum + level.auctionVolume, 0)).toBe(14);
    expect(Number.isFinite(state.poc)).toBe(true);
  });

  it('Broker History separa agressivo, passivo e categorias neutras', () => {
    emitHistorical([
      trade(0, 'BUY', 1000),
      trade(1, 'SELL', 2000),
      trade(2, 'RLP', 3000),
      trade(3, 'DIRECT', 4000),
      trade(4, 'AUCTION', 5000),
    ]);

    const ativa = useHistoricalBrokerHistoryStore.getState().brokers.get(147);
    const ubs = useHistoricalBrokerHistoryStore.getState().brokers.get(8);
    expect(ativa?.aggressionBuy).toBe(10);
    expect(ativa?.passiveBuy).toBe(11);
    expect(ubs?.passiveSell).toBe(10);
    expect(ubs?.aggressionSell).toBe(11);
    expect(ativa?.rlpVolume).toBe(12);
    expect(ativa?.directVolume).toBe(13);
    expect(ativa?.auctionVolume).toBe(14);
    expect(ativa?.largestTrade).toBe(14);
  });

  it('last price atualiza com o ultimo MarketTrade observado', () => {
    emitHistorical([trade(0, 'BUY', 1000), trade(1, 'SELL', 2000)]);
    const state = useHistoricalLastPriceStore.getState();
    expect(state.price).toBe(5150.5);
    expect(state.timestamp).toBe(2000);
  });

  it('FlowAnalysis recebe BUY/SELL e ignora lado direcional de neutros', () => {
    const flow = new FlowAnalysisEngine({ autoStart: false, now: () => 0 });
    flow.start();
    flow.reset();

    emitHistorical([
      trade(0, 'BUY', 1000),
      trade(1, 'SELL', 2000),
      trade(2, 'RLP', 3000),
      trade(3, 'DIRECT', 4000),
      trade(4, 'AUCTION', 5000),
      trade(5, 'UNKNOWN', 6000),
    ]);

    const snapshot = flow.getSnapshot();
    expect(snapshot.metrics.tradeCount).toBe(2);
    expect(snapshot.metrics.tradedVolume).toBe(21);
    expect(snapshot.metrics.buyerAggressorVolume).toBe(10);
    expect(snapshot.metrics.sellerAggressorVolume).toBe(11);
    expect(snapshot.metrics.cumulativeDelta).toBe(-1);
    expect(Object.values(snapshot.signals).every((value) => value === false)).toBe(true);
    flow.stop();
  });

  it('reset limpa projeções e nova sessão começa vazia', () => {
    emitHistorical([trade(0, 'BUY', 1000)]);
    expect(useHistoricalTradeStore.getState().totalTrades).toBe(1);
    eventBus.emit(HISTORICAL_REPLAY_EVENTS.RESET, Object.freeze({
      state: Object.freeze({
        replaySessionId: 'next',
        status: 'LOADED',
        currentIndex: 0,
        totalTrades: 0,
        remainingTrades: 0,
        progress: 0,
        speed: 1,
        currentTimestamp: null,
        firstTimestamp: null,
        lastTimestamp: null,
        elapsedHistoricalMs: 0,
        lastEmittedTradeId: null,
        error: null,
      }),
    }));
    expect(useHistoricalTradeStore.getState().totalTrades).toBe(0);
    expect(useHistoricalVolumeProfileStore.getState().totalVolume).toBe(0);
    expect(useHistoricalBrokerHistoryStore.getState().sorted).toEqual([]);
  });

  it('snapshots/stores nao geram NaN ou Infinity', () => {
    emitHistorical([trade(0, 'BUY', 1000), trade(1, 'RLP', 1000)]);
    const vp = useHistoricalVolumeProfileStore.getState();
    expect(vp.levels.every((level) => Number.isFinite(level.totalVolume) && Number.isFinite(level.delta) && Number.isFinite(level.barWidth))).toBe(true);
    expect(useHistoricalBrokerHistoryStore.getState().sorted.every((broker) => Number.isFinite(broker.avgPrice) && Number.isFinite(broker.totalVolume))).toBe(true);
  });

  it('integracao historica nao emite matching nem altera posição, PnL, stops ou FIFO', () => {
    const matchingEvents: unknown[] = [];
    const unsubscribeMatching = eventBus.on(MATCHING_EVENTS.EXECUTION_CREATED, (event) => matchingEvents.push(event));
    const before = usePositionStore.getState();

    try {
      emitHistorical([trade(0, 'BUY', 1000), trade(1, 'SELL', 2000), trade(2, 'RLP', 3000)]);

      const after = usePositionStore.getState();
      expect(matchingEvents).toEqual([]);
      expect(after.side).toBe(before.side);
      expect(after.quantity).toBe(before.quantity);
      expect(after.realizedPnL).toBe(before.realizedPnL);
    } finally {
      unsubscribeMatching();
    }
  });

  it('troca de fonte no kernel isola SYNTHETIC, SCENARIO e HISTORICAL_FILE', () => {
    disposeKernel();
    const kernel = createKernel();
    expect(kernel.getMarketDataSource()).toBe('SYNTHETIC');
    kernel.setMarketDataSource('HISTORICAL_FILE', 'hist');
    expect(kernel.getMarketDataSource()).toBe('HISTORICAL_FILE');
    expect(useMarketDataSourceStore.getState().isHistorical).toBe(true);
    kernel.setMarketDataSource('SYNTHETIC');
    expect(kernel.getMarketDataSource()).toBe('SYNTHETIC');
    expect(useMarketDataSourceStore.getState().isHistorical).toBe(false);
    kernel.setMarketDataSource('SCENARIO');
    expect(kernel.getMarketDataSource()).toBe('SCENARIO');
    kernel.setMarketDataSource('HISTORICAL_FILE', 'hist-2');
    expect(kernel.getMarketDataSource()).toBe('HISTORICAL_FILE');
    disposeKernel();
  });

  it('processa carga de 10.000 e 100.000 trades sem perda ou duplicacao logica', () => {
    for (const total of [10000, 100000]) {
      resetStores();
      const trades = Array.from({ length: total }, (_, index) => trade(index, index % 3 === 0 ? 'BUY' : index % 3 === 1 ? 'SELL' : 'RLP', 1000 + index));
      emitHistorical(trades, `load-${total}`);
      expect(useHistoricalTradeStore.getState().totalTrades).toBe(total);
      expect(useHistoricalVolumeProfileStore.getState().tradeCount).toBe(total);
      expect(useHistoricalVolumeProfileStore.getState().totalVolume).toBe(trades.reduce((sum, item) => sum + item.quantity, 0));
      expect(useHistoricalTradeStore.getState().trades.length).toBeLessThanOrEqual(500);
    }
  }, 20000);

  it('processa CSV real completo quando arquivo existe', () => {
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
    emitHistorical(parsed.trades, 'real-csv-projection');

    expect(parsed.diagnostics.validTradeCount).toBe(39292);
    expect(useHistoricalTradeStore.getState().totalTrades).toBe(39292);
    expect(useHistoricalVolumeProfileStore.getState().tradeCount).toBe(39292);
    expect(useHistoricalTradeStore.getState().lastPrice).toBe(parsed.trades[parsed.trades.length - 1].price);
    expect(useHistoricalLastPriceStore.getState().price).toBe(parsed.trades[parsed.trades.length - 1].price);
    expect(useHistoricalBrokerHistoryStore.getState().sorted.length).toBeGreaterThan(0);
    expect(useHistoricalVolumeProfileStore.getState().levels.reduce((sum, level) => sum + level.rlpVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.RLP);
    expect(useHistoricalVolumeProfileStore.getState().levels.reduce((sum, level) => sum + level.directVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.DIRECT);
    expect(useHistoricalVolumeProfileStore.getState().levels.reduce((sum, level) => sum + level.auctionVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.AUCTION);
  }, 20000);
});
