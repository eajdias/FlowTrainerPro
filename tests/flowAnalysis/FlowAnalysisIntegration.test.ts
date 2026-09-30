import { describe, expect, it } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import {
  FLOW_ANALYSIS_EVENTS,
  FlowAnalysisEngine,
} from '../../src/core/flowAnalysis/FlowAnalysisEngine';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';

describe('FlowAnalysisEngine integracao com EventBus oficial', () => {
  it('trade -> metrics -> context -> snapshot publicado com valores finais corretos', () => {
    eventBus.clear(FLOW_ANALYSIS_EVENTS.SNAPSHOT_UPDATED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);

    const snapshots: Array<ReturnType<FlowAnalysisEngine['getSnapshot']>> = [];
    eventBus.on(FLOW_ANALYSIS_EVENTS.SNAPSHOT_UPDATED, (snapshot) => {
      snapshots.push(snapshot as ReturnType<FlowAnalysisEngine['getSnapshot']>);
    });

    const engine = new FlowAnalysisEngine({ autoStart: true, eventBus, now: () => 7_000 });

    eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
      executionId: 'integration-1',
      timestamp: 7_010,
      tick: 1,
      aggressorOrderId: 'ao',
      passiveOrderId: 'po',
      aggressorPlayerId: 'trader',
      passivePlayerId: 'maker',
      aggressorBrokerId: 10,
      passiveBrokerId: 20,
      side: 'sell',
      price: 5_120,
      size: 12,
      remainingAggressor: 0,
      remainingPassive: 0,
    });

    const last = snapshots[snapshots.length - 1];
    expect(last).toBeTruthy();
    expect(last.metrics.tradeCount).toBe(1);
    expect(last.metrics.sellerAggressorVolume).toBe(12);
    expect(last.metrics.delta).toBe(-12);
    expect(last.metrics.cumulativeDelta).toBe(-12);

    expect(last.context.currentPrice).toBe(5_120);
    expect(last.context.currentAggressor).toBe('SELL');
    expect(last.context.currentDelta).toBe(-12);
    expect(last.context.lastTrade?.price).toBe(5_120);
    expect(last.context.lastTrade?.size).toBe(12);

    expect(Object.values(last.signals).every((flag) => flag === false)).toBe(true);

    engine.stop();
    eventBus.clear(FLOW_ANALYSIS_EVENTS.SNAPSHOT_UPDATED);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
  });
});
