import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { createKernel, disposeKernel } from '../../src/core/kernel/SimulationKernel';
import { initTraderBridge } from '../../src/trader/TraderExecutionBridge';
import { placeOrder } from '../../src/trader/TradingController';
import { useTraderOrderStore } from '../../src/store/traderOrderStore';
import { usePositionStore } from '../../src/store/positionStore';
import { useTrainingStore } from '../../src/store/trainingStore';
import { SCENARIOS } from '../../src/store/scenarios';

describe('guided training objectives', () => {
  beforeEach(() => {
    eventBus.clear();
    disposeKernel();
    useTraderOrderStore.getState().reset();
    usePositionStore.getState().reset();
    useTrainingStore.getState().reset();
    initTraderBridge();
  });

  it('entrada na zona completa wait_signal e entry_after', () => {
    const sc = SCENARIOS.find((s) => s.id === 'absorption')!;
    useTrainingStore.getState().loadScenario(sc);
    useTrainingStore.getState().startSession();

    const kernel = createKernel();
    kernel.start();
    for (let i = 0; i < sc.idealEntryStart + 5; i++) kernel.step(i);

    const best = kernel.book.snapshot().bestAsk;
    placeOrder('buy', best);

    const s = useTrainingStore.getState();
    expect(s.tradedBeforeSignal).toBe(false);
    expect(s.objectives.find((o) => o.id === 'wait_signal')?.status).toBe('completed');
    expect(s.objectives.find((o) => o.id === 'entry_after')?.status).toBe('completed');
    kernel.stop();
  });
});
