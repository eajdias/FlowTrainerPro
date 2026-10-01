import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';
import { useMarketStore } from '../../src/store/marketStore';
import { useMarketDataSourceStore } from '../../src/store/marketDataSourceStore';
import { useTrainingSessionStore } from '../../src/store/trainingSessionStore';

function exec(id: string): Execution {
  return {
    executionId: id,
    timestamp: 1000,
    price: 5000,
    size: 2,
    side: 'buy',
    aggressorPlayerId: 'p',
    passivePlayerId: 'q',
    aggressorBrokerId: 3,
    passiveBrokerId: 114,
    aggressorOrderId: `a-${id}`,
    passiveOrderId: `p-${id}`,
    slippageTicks: 0,
  };
}

describe('live store wiring', () => {
  beforeEach(() => {
    useTrainingSessionStore.getState().reset();
    useMarketDataSourceStore.getState().reset();
  });

  it('execucao alimenta priceLevels e brokerActivity', () => {
    eventBus.emit<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, exec('w1'));
    const s = useMarketStore.getState();
    expect(s.tickCount).toBeGreaterThan(0);
    expect(s.brokerActivity.length).toBeGreaterThan(0);
    expect(s.brokerActivity[0]?.brokerName).toBe('XP');
    expect(s.priceLevels.some((l) => l.bidVolume > 0)).toBe(true);
  });

  it('guard bloqueia troca de fonte com sessao rodando', () => {
    useTrainingSessionStore.setState({ status: 'running' });
    useMarketDataSourceStore.getState().setSource('HISTORICAL_FILE', 's1');
    expect(useMarketDataSourceStore.getState().sourceMode).toBe('SYNTHETIC');

    useTrainingSessionStore.setState({ status: 'idle' });
    useMarketDataSourceStore.getState().setSource('HISTORICAL_FILE', 's1');
    expect(useMarketDataSourceStore.getState().sourceMode).toBe('HISTORICAL_FILE');
  });
});
