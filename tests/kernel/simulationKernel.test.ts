import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { createKernel, disposeKernel, KERNEL_EVENTS, type KernelTickEvent } from '../../src/core/kernel/SimulationKernel';
import { MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';

describe('SimulationKernel', () => {
  beforeEach(() => {
    eventBus.clear();
    disposeKernel();
  });

  it('boot semeia book e step gera tape', () => {
    const fills: Execution[] = [];
    eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => fills.push(e));

    const kernel = createKernel();
    kernel.boot();
    expect(kernel.isInitialized).toBe(true);

    const snap = kernel.book.snapshot();
    expect(snap.bids.length).toBeGreaterThan(0);
    expect(snap.asks.length).toBeGreaterThan(0);
    expect(snap.bestBid).toBeLessThan(snap.bestAsk);

    for (let i = 0; i < 20; i++) kernel.step(1_700_000_000_000 + i * 150);
    expect(kernel.getTick()).toBe(20);
    expect(fills.length).toBeGreaterThan(0);
  });

  it('emite tick com elapsed', () => {
    const ticks: KernelTickEvent[] = [];
    eventBus.on<KernelTickEvent>(KERNEL_EVENTS.TICK, (e) => ticks.push(e));
    const kernel = createKernel();
    kernel.step(1000);
    expect(ticks.length).toBe(1);
    expect(ticks[0]?.tick).toBe(1);
  });

  it('fluxo deterministico: mesma seed, mesmos fills', () => {
    const run = (): number => {
      const f: Execution[] = [];
      const off = eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => f.push(e));
      const k = createKernel();
      for (let i = 0; i < 10; i++) k.step(i);
      off();
      return f.reduce((s, e) => s + e.size, 0);
    };
    expect(run()).toBe(run());
  });
});
