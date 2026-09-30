import { beforeEach, describe, expect, it } from 'vitest';
import {
  selectBrokerFlowRankings,
  selectSelectedBrokerFlowBroker,
  selectVisibleBrokerFlowBrokers,
  useBrokerFlowStore,
} from '../../src/store/brokerFlowStore';
import { broker, snapshot } from './brokerFlowFixtures';

describe('brokerFlowStore oficial', () => {
  beforeEach(() => {
    useBrokerFlowStore.getState().reset();
  });

  it('tem estado inicial e recebe snapshot sem acumular trades', () => {
    expect(useBrokerFlowStore.getState().latestSnapshot).toBeNull();
    expect(useBrokerFlowStore.getState().status).toBe('idle');

    const snap = snapshot([broker({ brokerCode: 10, totalBuyVolume: 50, totalSellVolume: 50 })]);
    useBrokerFlowStore.getState().receiveSnapshot(snap);
    useBrokerFlowStore.getState().receiveSnapshot(snap);

    const state = useBrokerFlowStore.getState();
    expect(state.latestSnapshot).toBe(snap);
    expect(state.brokers).toHaveLength(1);
    expect(state.brokers[0].totalBuyVolume).toBe(50);
    expect(state.sourceMode).toBe('HISTORICAL_FILE');
    expect(state.sessionId).toBe('session-a');
    expect(state.status).toBe('ready');
  });

  it('reseta, troca sessão/source mode e remove seleção inexistente', () => {
    useBrokerFlowStore.getState().receiveSnapshot(snapshot([broker({ brokerCode: 1 })]));
    useBrokerFlowStore.getState().selectBroker('CODE:1');
    expect(selectSelectedBrokerFlowBroker(useBrokerFlowStore.getState())?.brokerKey).toBe('CODE:1');

    useBrokerFlowStore.getState().receiveSnapshot({
      ...snapshot([broker({ brokerCode: 2 })]),
      sourceMode: 'SYNTHETIC',
      sessionId: 'session-b',
    });
    expect(useBrokerFlowStore.getState().selectedBrokerKey).toBeNull();
    expect(useBrokerFlowStore.getState().sourceMode).toBe('SYNTHETIC');
    expect(useBrokerFlowStore.getState().sessionId).toBe('session-b');

    useBrokerFlowStore.getState().reset();
    expect(useBrokerFlowStore.getState().selectedBrokerKey).toBeNull();
    expect(useBrokerFlowStore.getState().brokers).toHaveLength(0);
  });

  it('filtra por nome, código, direção, ativos, volume e market share', () => {
    const alpha = broker({ brokerCode: 11, brokerName: 'ALPHA', totalBuyVolume: 120, totalSellVolume: 80, aggressiveNetVolume: 60, marketShare: 0.4 });
    const beta = broker({ brokerCode: 22, brokerName: 'BETA', totalBuyVolume: 20, totalSellVolume: 90, aggressiveNetVolume: -50, marketShare: 0.1 });
    const rlp = broker({ brokerCode: 33, brokerName: 'RLP HOUSE', totalBuyVolume: 0, totalSellVolume: 0, aggressiveBuyVolume: 0, aggressiveSellVolume: 0, aggressiveNetVolume: 0, rlpBuyVolume: 10, marketShare: 0.05 });
    useBrokerFlowStore.getState().receiveSnapshot(snapshot([alpha, beta, rlp]));

    useBrokerFlowStore.getState().setSearch('alp');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:11']);

    useBrokerFlowStore.getState().setSearch('22');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:22']);

    useBrokerFlowStore.getState().setSearch('');
    useBrokerFlowStore.getState().setDirectionalFilter('buyer');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:11']);

    useBrokerFlowStore.getState().setDirectionalFilter('seller');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:22']);

    useBrokerFlowStore.getState().setDirectionalFilter('rlp');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:33']);

    useBrokerFlowStore.getState().setDirectionalFilter('all');
    useBrokerFlowStore.getState().setActiveOnly(true);
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).not.toContain('CODE:33');

    useBrokerFlowStore.getState().setActiveOnly(false);
    useBrokerFlowStore.getState().setMinimumVolume(150);
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:11']);

    useBrokerFlowStore.getState().setMinimumVolume(0);
    useBrokerFlowStore.getState().setMinimumMarketShare(0.2);
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:11']);
  });

  it('ordena de forma estável e expõe rankings', () => {
    const a = broker({ brokerCode: 1, totalBuyVolume: 100, totalSellVolume: 0, aggressiveBuyVolume: 80, aggressiveSellVolume: 0, aggressiveNetVolume: 80, persistenceScore: 0.4 });
    const b = broker({ brokerCode: 2, totalBuyVolume: 50, totalSellVolume: 150, aggressiveBuyVolume: 0, aggressiveSellVolume: 120, aggressiveNetVolume: -120, persistenceScore: 0.8, largestSellTrade: 90 });
    const c = broker({ brokerCode: 3, totalBuyVolume: 100, totalSellVolume: 0, aggressiveBuyVolume: 10, aggressiveSellVolume: 0, aggressiveNetVolume: 10, persistenceScore: 0.2 });
    useBrokerFlowStore.getState().receiveSnapshot(snapshot([a, b, c]));

    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:2', 'CODE:1', 'CODE:3']);
    useBrokerFlowStore.getState().setSort('totalVolume');
    expect(selectVisibleBrokerFlowBrokers(useBrokerFlowStore.getState()).map((item) => item.brokerKey)).toEqual(['CODE:1', 'CODE:3', 'CODE:2']);

    const rankings = selectBrokerFlowRankings(useBrokerFlowStore.getState());
    expect(rankings.mostActive?.brokerKey).toBe('CODE:2');
    expect(rankings.mostAggressiveBuyer?.brokerKey).toBe('CODE:1');
    expect(rankings.mostAggressiveSeller?.brokerKey).toBe('CODE:2');
    expect(rankings.largestPositiveAggressiveNet?.brokerKey).toBe('CODE:1');
    expect(rankings.largestNegativeAggressiveNet?.brokerKey).toBe('CODE:2');
    expect(rankings.highestPersistence?.brokerKey).toBe('CODE:2');
    expect(rankings.largestTrade?.brokerKey).toBe('CODE:2');
  });

  it('mantém imutabilidade do snapshot recebido', () => {
    const snap = snapshot([broker()]);
    useBrokerFlowStore.getState().receiveSnapshot(snap);
    expect(Object.isFrozen(useBrokerFlowStore.getState().latestSnapshot)).toBe(true);
    expect(Object.isFrozen(useBrokerFlowStore.getState().brokers)).toBe(true);
  });
});
