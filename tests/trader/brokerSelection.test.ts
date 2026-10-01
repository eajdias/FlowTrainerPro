import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';
import { createKernel, disposeKernel } from '../../src/core/kernel/SimulationKernel';
import { initTraderBridge } from '../../src/trader/TraderExecutionBridge';
import { placeOrder } from '../../src/trader/TradingController';
import { useTraderOrderStore } from '../../src/store/traderOrderStore';
import { usePositionStore } from '../../src/store/positionStore';

describe('trader broker selection', () => {
  beforeEach(() => {
    eventBus.clear();
    disposeKernel();
    useTraderOrderStore.getState().reset();
    usePositionStore.getState().reset();
    initTraderBridge();
  });

  it('ordens do aluno carregam a corretora selecionada', () => {
    const fills: Execution[] = [];
    eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => fills.push(e));

    const kernel = createKernel();
    kernel.start();

    useTraderOrderStore.getState().setBrokerId(114);
    const best = kernel.book.snapshot().bestAsk;
    placeOrder('buy', best);

    const mine = fills.filter((f) => f.aggressorPlayerId === 'trader_user');
    expect(mine.length).toBeGreaterThan(0);
    expect(mine[0]?.aggressorBrokerId).toBe(114);
  });
});
