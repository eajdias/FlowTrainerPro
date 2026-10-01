// store/trainingSessionStore.ts
// Controls the training session lifecycle.
// OBSERVES and CONTROLS the simulation — never generates market data.
// Source of truth for: session status, speed, time, regime display.

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { SCENARIO_EVENTS } from '../core/kernel/MarketScenarioEngine';
import { MATCHING_EVENTS } from '../core/kernel/MatchingEngine';
import { KERNEL_EVENTS, type KernelTickEvent } from '../core/kernel/SimulationKernel';
import type { MarketRegime } from '../core/kernel/MarketScenarioEngine';

// ── Session status ────────────────────────────────────────────────────────────

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';
export type SimulationSpeed = 0.5 | 1 | 2 | 4 | 8 | 16;

// ── State ─────────────────────────────────────────────────────────────────────

interface TrainingSessionState {
  status:         SessionStatus;
  speed:          SimulationSpeed;
  startedAt:      number | null;    // timestamp when session started
  elapsedMs:      number;           // total time elapsed (paused time excluded)
  tickCount:      number;           // ticks since session start
  currentRegime:  MarketRegime | null;
  totalTrades:    number;
  totalVolume:    number;
}

interface TrainingSessionActions {
  start:      () => void;
  pause:      () => void;
  resume:     () => void;
  finish:     () => void;
  reset:      () => void;
  setSpeed:   (speed: SimulationSpeed) => void;
  incrementTick: () => void;
  updateElapsed: (ms: number) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTrainingSessionStore = create<TrainingSessionState & TrainingSessionActions>((set) => ({
  status:        'idle',
  speed:         1,
  startedAt:     null,
  elapsedMs:     0,
  tickCount:     0,
  currentRegime: null,
  totalTrades:   0,
  totalVolume:   0,

  start: () => set({
    status: 'running',
    startedAt: Date.now(),
    elapsedMs: 0,
    tickCount: 0,
    totalTrades: 0,
    totalVolume: 0,
  }),

  pause:  () => set({ status: 'paused' }),
  resume: () => set({ status: 'running' }),
  finish: () => set({ status: 'finished' }),

  reset: () => set({
    status: 'idle',
    speed: 1,
    startedAt: null,
    elapsedMs: 0,
    tickCount: 0,
    currentRegime: null,
    totalTrades: 0,
    totalVolume: 0,
  }),

  setSpeed: (speed) => set({ speed }),

  incrementTick: () => set((s) => ({ tickCount: s.tickCount + 1 })),

  updateElapsed: (ms) => set({ elapsedMs: ms }),
}));

// ── Wire: Listen to regime changes and executions ─────────────────────────────

eventBus.on<KernelTickEvent>(KERNEL_EVENTS.TICK, (event) => {
  useTrainingSessionStore.getState().incrementTick();
  useTrainingSessionStore.getState().updateElapsed(event.elapsedMs);
});

eventBus.on(SCENARIO_EVENTS.REGIME_CHANGED, (data: any) => {
  useTrainingSessionStore.setState({ currentRegime: data.regime });
});

eventBus.on(MATCHING_EVENTS.EXECUTION_CREATED, (exec: any) => {
  useTrainingSessionStore.setState((s) => ({
    totalTrades: s.totalTrades + 1,
    totalVolume: s.totalVolume + exec.size,
  }));
});
