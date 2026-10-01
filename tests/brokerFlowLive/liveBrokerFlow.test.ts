import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';
import {
  useBrokerFlowStore,
  initLiveBrokerFlow,
  flushLiveBrokerFlow,
  selectBrokerFlowRankings,
} from '../../src/store/brokerFlowStore';

function exec(id: string, side: 'buy' | 'sell', price: number, size: number): Execution {
  return {
    executionId: id,
    timestamp: id.length,
    price,
    size,
    side,
    aggressorPlayerId: 'p',
    passivePlayerId: 'q',
    aggressorBrokerId: side === 'buy' ? 3 : 114,
    passiveBrokerId: side === 'buy' ? 114 : 3,
    aggressorOrderId: `a-${id}`,
    passiveOrderId: `p-${id}`,
    slippageTicks: 0,
  };
}

describe('live broker flow', () => {
  beforeEach(() => {
    // Sem eventBus.clear(): a inscricao do feed e feita no import/wiring;
    // o vitest isola modulos por arquivo.
    useBrokerFlowStore.getState().reset();
    initLiveBrokerFlow();
  });

  it('agrega execucoes por corretora', () => {
    eventBus.emit<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, exec('e1', 'buy', 5000, 5));
    eventBus.emit<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, exec('e2', 'buy', 5001, 7));
    flushLiveBrokerFlow();

    const state = useBrokerFlowStore.getState();
    expect(state.brokers.length).toBe(2);
    const rankings = selectBrokerFlowRankings(state);
    expect(rankings.mostAggressiveBuyer?.brokerCode).toBe(3);
    expect(rankings.mostAggressiveBuyer?.aggressiveBuyVolume).toBe(12);
  });
});
