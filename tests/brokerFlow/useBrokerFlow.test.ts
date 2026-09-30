import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BROKER_FLOW_EVENTS } from '../../src/core/analytics/brokerFlow';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS } from '../../src/core/kernel/MatchingEngine';
import { MARKET_DATA_PROJECTION_EVENTS } from '../../src/core/marketData/projections';
import {
  getBrokerFlowSnapshotSyncStatus,
  resetBrokerFlowSnapshotSyncForTests,
  startBrokerFlowSnapshotSync,
  stopBrokerFlowSnapshotSync,
} from '../../src/shared/hooks/useBrokerFlow';
import { useBrokerFlowStore } from '../../src/store/brokerFlowStore';
import { broker, snapshot } from './brokerFlowFixtures';

describe('useBrokerFlow sincronização oficial', () => {
  beforeEach(() => {
    resetBrokerFlowSnapshotSyncForTests();
    useBrokerFlowStore.getState().reset();
    eventBus.clear(BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED);
    eventBus.clear(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET);
    eventBus.clear(MATCHING_EVENTS.EXECUTION_CREATED);
  });

  afterEach(() => {
    resetBrokerFlowSnapshotSyncForTests();
    vi.restoreAllMocks();
  });

  it('assina o evento oficial e sincroniza o store', () => {
    startBrokerFlowSnapshotSync();
    eventBus.emit(BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED, snapshot([broker({ brokerCode: 7 })]));

    expect(useBrokerFlowStore.getState().brokers[0].brokerKey).toBe('CODE:7');
    expect(useBrokerFlowStore.getState().status).toBe('ready');
  });

  it('não duplica listener com múltiplos consumidores e faz cleanup', () => {
    const onSpy = vi.spyOn(eventBus, 'on');
    startBrokerFlowSnapshotSync();
    startBrokerFlowSnapshotSync();

    expect(getBrokerFlowSnapshotSyncStatus().activeConsumers).toBe(2);
    expect(onSpy.mock.calls.filter(([event]) => event === BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED)).toHaveLength(1);

    stopBrokerFlowSnapshotSync();
    expect(getBrokerFlowSnapshotSyncStatus().isSubscribed).toBe(true);
    stopBrokerFlowSnapshotSync();
    expect(getBrokerFlowSnapshotSyncStatus().isSubscribed).toBe(false);

    eventBus.emit(BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED, snapshot([broker({ brokerCode: 9 })]));
    expect(useBrokerFlowStore.getState().brokers).toHaveLength(0);
  });

  it('não assina matching:execution:created', () => {
    const onSpy = vi.spyOn(eventBus, 'on');
    startBrokerFlowSnapshotSync();
    expect(onSpy.mock.calls.some(([event]) => event === MATCHING_EVENTS.EXECUTION_CREATED)).toBe(false);
  });

  it('reseta ao receber reset de projeção e aceita nova sessão', () => {
    startBrokerFlowSnapshotSync();
    eventBus.emit(BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED, snapshot([broker({ brokerCode: 1 })]));
    expect(useBrokerFlowStore.getState().brokers).toHaveLength(1);

    eventBus.emit(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, {});
    expect(useBrokerFlowStore.getState().brokers).toHaveLength(0);
    expect(useBrokerFlowStore.getState().status).toBe('idle');

    eventBus.emit(BROKER_FLOW_EVENTS.SNAPSHOT_UPDATED, {
      ...snapshot([broker({ brokerCode: 2 })]),
      sessionId: 'session-b',
    });
    expect(useBrokerFlowStore.getState().sessionId).toBe('session-b');
    expect(useBrokerFlowStore.getState().brokers[0].brokerKey).toBe('CODE:2');
  });
});
