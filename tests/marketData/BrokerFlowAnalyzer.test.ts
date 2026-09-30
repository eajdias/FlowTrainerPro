import { existsSync, readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { parseCsvTrades } from '../../src/core/marketData/import';
import { usePositionStore } from '../../src/store/positionStore';
import {
  adaptBrokerFlowToLegacyBrokerHistory,
  BrokerFlowAnalyzer,
  type BrokerFlowMarketSnapshot,
} from '../../src/core/analytics/brokerFlow';
import type { AggressorType, MarketBroker, MarketTrade } from '../../src/core/marketData/types';

const A: MarketBroker = Object.freeze({ code: 1, name: 'ALFA', raw: '1 - ALFA' });
const B: MarketBroker = Object.freeze({ code: 2, name: 'BETA', raw: '2 - BETA' });

function trade(index: number, aggressor: AggressorType, price: number, quantity: number, timestamp: number, buyerBroker = A, sellerBroker = B): MarketTrade {
  return Object.freeze({
    tradeId: `t-${index}-${aggressor}`,
    sourceLine: index + 1,
    sourceSequence: index,
    chronologicalSequence: index,
    asset: 'WDOFUT',
    tradeDate: '13/07/2026',
    tradeTime: '09:00:00',
    timestamp,
    price,
    priceInTicks: price / 0.5,
    quantity,
    buyerBroker,
    sellerBroker,
    aggressor,
    source: 'HISTORICAL_CSV',
  });
}

function find(snapshot: BrokerFlowMarketSnapshot, key: string) {
  const broker = snapshot.brokers.find((item) => item.brokerKey === key);
  expect(broker).toBeTruthy();
  return broker!;
}

describe('BrokerFlowAnalyzer', () => {
  beforeEach(() => {
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
    usePositionStore.getState().reset();
  });

  it('calcula acumulados, agressividade, passividade, medias, VWAP e maior lote', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'SELL', 101, 20, 2000));
    const snap = analyzer.flushSnapshot();
    const alfa = find(snap, 'CODE:1');
    const beta = find(snap, 'CODE:2');

    expect(alfa.totalBuyVolume).toBe(30);
    expect(beta.totalSellVolume).toBe(30);
    expect(alfa.aggressiveBuyVolume).toBe(10);
    expect(beta.aggressiveSellVolume).toBe(20);
    expect(alfa.passiveBuyVolume).toBe(20);
    expect(beta.passiveSellVolume).toBe(10);
    expect(alfa.aggressiveNetVolume).toBe(10);
    expect(beta.aggressiveNetVolume).toBe(-20);
    expect(alfa.buyVWAP).toBeCloseTo((100 * 10 + 101 * 20) / 30);
    expect(beta.sellVWAP).toBeCloseTo((100 * 10 + 101 * 20) / 30);
    expect(alfa.aggressiveBuyVWAP).toBe(100);
    expect(beta.aggressiveSellVWAP).toBe(101);
    expect(alfa.largestBuyTrade).toBe(20);
    expect(beta.largestAggressiveSell).toBe(20);
  });

  it('separa RLP, DIRECT, AUCTION e UNKNOWN sem delta direcional', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'RLP', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'DIRECT', 100.5, 11, 2000));
    analyzer.processTrade(trade(2, 'AUCTION', 101, 12, 3000));
    analyzer.processTrade(trade(3, 'UNKNOWN', 101.5, 13, 4000));
    const alfa = find(analyzer.flushSnapshot(), 'CODE:1');
    expect(alfa.rlpBuyVolume).toBe(10);
    expect(alfa.directBuyVolume).toBe(11);
    expect(alfa.auctionBuyVolume).toBe(12);
    expect(alfa.unknownBuyVolume).toBe(13);
    expect(alfa.aggressiveBuyVolume).toBe(0);
    expect(alfa.directionalAggression).toBe(0);
    expect(alfa.sideSwitchCount).toBe(0);
  });

  it('calcula market share, aggressive share e directional aggression', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'BUY', 100.5, 30, 2000, B, A));
    const snap = analyzer.flushSnapshot();
    const alfa = find(snap, 'CODE:1');
    expect(snap.totalMarketSideVolume).toBe(80);
    expect(alfa.marketShare).toBeCloseTo(40 / 80);
    expect(alfa.aggressiveMarketShare).toBeCloseTo(10 / 40);
    expect(alfa.directionalAggression).toBe(1);
  });

  it('mantem janela temporal, activityRate, aggressionRate, persistencia e expira eventos', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false, config: { recentWindowMs: 5000 } });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'BUY', 101, 10, 2000));
    analyzer.processTrade(trade(2, 'BUY', 102, 10, 7000));
    const alfa = find(analyzer.flushSnapshot(), 'CODE:1');
    expect(alfa.recentAggressiveBuyVolume).toBe(20);
    expect(alfa.activityRate).toBeGreaterThan(0);
    expect(alfa.aggressionRate).toBeGreaterThan(0);
    expect(alfa.persistenceSide).toBe('BUY');
    expect(alfa.persistenceScore).toBeGreaterThan(0);
  });

  it('conta mudança de lado ignorando neutros e mantém streak', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'RLP', 100, 10, 2000));
    analyzer.processTrade(trade(2, 'DIRECT', 100, 10, 3000));
    analyzer.processTrade(trade(3, 'SELL', 99, 10, 4000, B, A));
    const alfa = find(analyzer.flushSnapshot(), 'CODE:1');
    expect(alfa.sideSwitchCount).toBe(1);
    expect(alfa.lastAggressiveSide).toBe('SELL');
    expect(alfa.currentAggressiveStreak).toBe(1);
  });

  it('gera concentração por preço limitada e ordenada por volume', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false, config: { maxPriceConcentrationLevels: 2 } });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'BUY', 101, 30, 2000));
    analyzer.processTrade(trade(2, 'SELL', 102, 20, 3000));
    const alfa = find(analyzer.flushSnapshot(), 'CODE:1');
    expect(alfa.priceConcentration).toHaveLength(2);
    expect(alfa.priceConcentration[0].price).toBe(101);
  });

  it('calcula resposta observada do preço sem afirmar causalidade', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false, config: { priceResponseHorizonsMs: [1000], tickSize: 0.5 } });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    analyzer.processTrade(trade(1, 'RLP', 101, 1, 2000));
    analyzer.processTrade(trade(2, 'SELL', 101, 10, 3000));
    analyzer.processTrade(trade(3, 'UNKNOWN', 100, 1, 4000));
    const snap = analyzer.flushSnapshot();
    const alfa = find(snap, 'CODE:1');
    const beta = find(snap, 'CODE:2');
    expect(alfa.priceResponse.horizons[0].sampleCount).toBe(1);
    expect(alfa.priceResponse.horizons[0].averageFavorableResponseTicks).toBe(2);
    expect(beta.priceResponse.horizons[0].sampleCount).toBe(1);
    expect(beta.priceResponse.horizons[0].averageFavorableResponseTicks).toBe(2);
  });

  it('ignora eventos fora de ordem para janelas/resposta sem corromper buffers', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 2000));
    analyzer.processTrade(trade(1, 'SELL', 99, 10, 1000));
    const snap = analyzer.flushSnapshot();
    expect(snap.processedTradeCount).toBe(1);
    expect(snap.outOfOrderCount).toBe(1);
  });

  it('adapter legado transforma snapshot sem recalcular e evita dupla contagem', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
    const snap = analyzer.flushSnapshot();
    const adapted = adaptBrokerFlowToLegacyBrokerHistory(snap);
    expect(snap.processedTradeCount).toBe(1);
    expect(adapted.find((item) => item.brokerId === 1)?.aggressionBuy).toBe(10);
    expect(adapted.find((item) => item.brokerId === 1)?.totalVolume).toBe(find(snap, 'CODE:1').totalBuyVolume + find(snap, 'CODE:1').totalSellVolume);
  });

  it('cenario com duas corretoras diferencia frequencia, persistencia e resposta observada', () => {
    const analyzer = new BrokerFlowAnalyzer({ autoStart: false, config: { priceResponseHorizonsMs: [1000] } });
    const C: MarketBroker = Object.freeze({ code: 3, name: 'GAMA', raw: '3 - GAMA' });
    analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000, A, B));
    analyzer.processTrade(trade(1, 'UNKNOWN', 101, 1, 2000, B, A));
    analyzer.processTrade(trade(2, 'BUY', 101, 10, 3000, A, B));
    analyzer.processTrade(trade(3, 'UNKNOWN', 102, 1, 4000, B, A));
    analyzer.processTrade(trade(4, 'BUY', 100, 20, 10000, C, B));
    analyzer.processTrade(trade(5, 'UNKNOWN', 100, 1, 11000, B, C));
    const snap = analyzer.flushSnapshot();
    const alfa = find(snap, 'CODE:1');
    const gama = find(snap, 'CODE:3');
    expect(alfa.aggressiveBuyVolume).toBe(gama.aggressiveBuyVolume);
    expect(alfa.activityRate).toBeGreaterThan(gama.activityRate);
    expect(alfa.persistenceScore).toBeGreaterThan(gama.persistenceScore);
    expect(alfa.priceResponse.horizons[0].averageFavorableResponseTicks).toBeGreaterThan(gama.priceResponse.horizons[0].averageFavorableResponseTicks);
  });

  it('permanece isolado de MatchingEngine, posição, stops, PnL e sinais operacionais', () => {
    const matching: unknown[] = [];
    const unsubscribeMatching = eventBus.on(MATCHING_EVENTS.EXECUTION_CREATED, (event) => matching.push(event));
    const before = usePositionStore.getState();
    try {
      const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
      analyzer.processTrade(trade(0, 'BUY', 100, 10, 1000));
      analyzer.flushSnapshot();
      const after = usePositionStore.getState();
      expect(matching).toEqual([]);
      expect(after.side).toBe(before.side);
      expect(after.quantity).toBe(before.quantity);
      expect(after.realizedPnL).toBe(before.realizedPnL);
    } finally {
      unsubscribeMatching();
    }
  });

  it('processa CSV real de forma deterministica e separa RLP, DIRECT e AUCTION', () => {
    const filePath = 'data/imports/WDOFUT_F_0_Trade_13-07-2026.csv';
    if (!existsSync(filePath)) {
      console.warn(`SKIPPED: CSV real nao encontrado em ${filePath}`);
      return;
    }
    const buffer = readFileSync(filePath);
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { text = new TextDecoder('latin1').decode(buffer); }
    const parsed = parseCsvTrades(text, { now: () => 0 });
    const run = () => {
      const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
      for (const item of parsed.trades) analyzer.processTrade(item);
      return analyzer.flushSnapshot();
    };
    const a = run();
    const b = run();
    expect(a.processedTradeCount).toBe(39292);
    expect(a.brokers.length).toBe(28);
    expect(a.mostActiveBroker).toBe(b.mostActiveBroker);
    expect(a.mostAggressiveBuyer).toBe(b.mostAggressiveBuyer);
    expect(JSON.stringify(a.brokers.slice(0, 5))).toBe(JSON.stringify(b.brokers.slice(0, 5)));
    expect(a.brokers.reduce((sum, item) => sum + item.rlpBuyVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.RLP);
    expect(a.brokers.reduce((sum, item) => sum + item.directBuyVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.DIRECT);
    expect(a.brokers.reduce((sum, item) => sum + item.auctionBuyVolume, 0)).toBe(parsed.diagnostics.aggressorVolumes.AUCTION);
  }, 20000);

  it('suporta carga de 10.000 e 100.000 trades com reset vazio e valores finitos', () => {
    for (const total of [10000, 100000]) {
      const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
      for (let index = 0; index < total; index++) {
        analyzer.processTrade(trade(index, index % 2 === 0 ? 'BUY' : 'SELL', 100 + (index % 20) * 0.5, 1 + (index % 50), 1000 + index));
      }
      const snap = analyzer.flushSnapshot();
      expect(snap.processedTradeCount).toBe(total);
      expect(snap.brokers.every((broker) => Number.isFinite(broker.marketShare) && Number.isFinite(broker.persistenceScore))).toBe(true);
      analyzer.reset();
      expect(analyzer.getSnapshot().processedTradeCount).toBe(0);
    }
  });
});
