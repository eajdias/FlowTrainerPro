// core/kernel/SimulationKernel.ts
// OS da simulacao: clock 150ms -> scenario -> generator -> book.
// Singleton via getKernel(); create/dispose p/ testes e boot.

import { eventBus } from '../engine/EventBus';
import { MatchingEngine } from './MatchingEngine';
import { OrderBookEngine } from './OrderBookEngine';
import { MarketScenarioEngine } from './MarketScenarioEngine';
import { KernelMarketGenerator } from './KernelMarketGenerator';

export const KERNEL_EVENTS = {
  TICK: 'kernel:tick',
} as const;

export interface KernelTickEvent {
  tick: number;
  timestamp: number;
  elapsedMs: number;
}

export const KERNEL_TICK_MS = 150;

class Kernel {
  readonly matching = new MatchingEngine();
  readonly scenario = new MarketScenarioEngine();
  readonly book: OrderBookEngine;
  readonly generator: KernelMarketGenerator;

  isInitialized = false;
  isRunning = false;
  speed = 1;

  private tick = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;

  constructor() {
    this.book = new OrderBookEngine(this.matching);
    this.generator = new KernelMarketGenerator(this.matching, this.scenario);
  }

  boot(): void {
    if (this.isInitialized) return;
    this.generator.seedBook();
    this.book.refresh();
    this.isInitialized = true;
  }

  start(): void {
    this.boot();
    if (this.isRunning) return;
    this.isRunning = true;
    this.startedAt = Date.now();
    this.schedule();
  }

  pause(): void {
    this.isRunning = false;
    this.stopTimer();
  }

  resume(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.schedule();
  }

  stop(): void {
    this.isRunning = false;
    this.stopTimer();
  }

  setSpeed(speed: number): void {
    if (!(speed > 0)) return;
    this.speed = speed;
    if (this.isRunning) {
      this.stopTimer();
      this.schedule();
    }
  }

  /** Avanco manual (testes / stepping). */
  step(now: number = Date.now()): void {
    this.tick += 1;
    this.scenario.onTick(this.tick);
    this.generator.onTick(this.tick, now);
    this.book.refresh();
    eventBus.emit<KernelTickEvent>(KERNEL_EVENTS.TICK, {
      tick: this.tick,
      timestamp: now,
      elapsedMs: now - this.startedAt,
    });
  }

  getTick(): number {
    return this.tick;
  }

  private schedule(): void {
    this.stopTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.isRunning) return;
      this.step();
      this.schedule();
    }, Math.max(1, Math.round(KERNEL_TICK_MS / this.speed)));
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

let instance: Kernel | null = null;

export function createKernel(): Kernel {
  disposeKernel();
  instance = new Kernel();
  return instance;
}

export function getKernel(): Kernel {
  if (!instance) instance = new Kernel();
  return instance;
}

export function disposeKernel(): void {
  instance?.stop();
  instance = null;
}

export type SimulationKernel = Kernel;
