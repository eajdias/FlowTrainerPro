import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { createKernel, disposeKernel } from '../../src/core/kernel/SimulationKernel';
import { MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';

describe('market profiles', () => {
  let fills: Execution[];

  beforeEach(() => {
    eventBus.clear();
    disposeKernel();
    fills = [];
    eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => fills.push(e));
  });

  it('aggressive gera mais volume que slow', () => {
    const slow = createKernel();
    slow.generator.setProfile('slow');
    for (let i = 0; i < 30; i++) slow.step(i);
    const slowVol = fills.reduce((s, e) => s + e.size, 0);

    fills = [];
    const fast = createKernel();
    fast.generator.setProfile('aggressive');
    for (let i = 0; i < 30; i++) fast.step(i);
    const fastVol = fills.reduce((s, e) => s + e.size, 0);

    expect(fastVol).toBeGreaterThan(slowVol);
  });

  it('TRAINING FIFO usa filas menores', () => {
    const normal = createKernel();
    normal.generator.seedBook();
    const { asks } = normal.book.snapshot();
    const normalTop = asks[0]?.size ?? 0;

    const fifo = createKernel();
    fifo.generator.setTrainingFifo(true);
    fifo.generator.seedBook();
    const { asks: fifoAsks } = fifo.book.snapshot();
    const fifoTop = fifoAsks[0]?.size ?? 0;

    expect(fifoTop).toBeLessThanOrEqual(3);
    expect(normalTop).toBeGreaterThan(fifoTop);
  });
});
