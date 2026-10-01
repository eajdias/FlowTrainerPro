// core/marketData/replay.ts
// Fonte de dados exclusiva + replay historico isolado.
// Replay emite `historical:trade:executed` — nunca `matching:execution:created`.

import { eventBus } from '../engine/EventBus';
import type { MarketTrade } from './types';

export type MarketDataSourceMode = 'SYNTHETIC' | 'SCENARIO' | 'HISTORICAL_FILE' | 'LIVE_FUTURE';

export const HISTORICAL_REPLAY_EVENTS = {
  TRADE_EXECUTED: 'historical:trade:executed',
} as const;

export interface HistoricalTradeExecutedEvent {
  trade: MarketTrade;
  sequence: number;
  sessionId: string;
}

export type HistoricalReplayStatus =
  | 'empty'
  | 'loaded'
  | 'running'
  | 'paused'
  | 'finished';

export interface HistoricalReplayState {
  readonly status: HistoricalReplayStatus;
  readonly sessionId: string | null;
  readonly speed: number;
  readonly currentIndex: number;
  readonly totalTrades: number;
  readonly remainingTrades: number;
  readonly firstTimestamp: number | null;
  readonly lastTimestamp: number | null;
  readonly lastTrade: MarketTrade | null;
}

const INITIAL_STATE: HistoricalReplayState = {
  status: 'empty',
  sessionId: null,
  speed: 1,
  currentIndex: 0,
  totalTrades: 0,
  remainingTrades: 0,
  firstTimestamp: null,
  lastTimestamp: null,
  lastTrade: null,
};

/**
 * Replay historico com lifecycle load/start/pause/resume/stop/reset/unload.
 * Estado imutavel; timestamps historicos preservados; sem efeitos no matching.
 */
export class HistoricalReplayEngine {  private state: HistoricalReplayState = INITIAL_STATE;
  private trades: MarketTrade[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  getState(): HistoricalReplayState {
    return this.state;
  }

  load(trades: MarketTrade[], sessionId: string): void {
    this.stopTimer();
    this.trades = [...trades];
    this.state = {
      ...INITIAL_STATE,
      status: 'loaded',
      sessionId,
      speed: this.state.speed,
      totalTrades: trades.length,
      remainingTrades: trades.length,
      firstTimestamp: trades[0]?.timestamp ?? null,
      lastTimestamp: trades[trades.length - 1]?.timestamp ?? null,
    };
  }

  unload(): void {
    this.stopTimer();
    this.trades = [];
    this.state = { ...INITIAL_STATE, speed: this.state.speed };
  }

  setSpeed(speed: number): void {
    if (!(speed > 0)) return;
    const wasRunning = this.state.status === 'running';
    if (wasRunning) this.stopTimer();
    this.state = { ...this.state, speed };
    if (wasRunning) this.schedule();
  }

  start(): void {
    if (this.state.status !== 'loaded' && this.state.status !== 'paused') return;
    if (this.state.currentIndex >= this.trades.length) {
      this.state = { ...this.state, status: 'finished', remainingTrades: 0 };
      return;
    }
    this.state = { ...this.state, status: 'running' };
    this.schedule();
  }

  pause(): void {
    if (this.state.status !== 'running') return;
    this.stopTimer();
    this.state = { ...this.state, status: 'paused' };
  }

  resume(): void {
    this.start();
  }

  stop(): void {
    this.stopTimer();
    this.state = { ...this.state, status: 'loaded', currentIndex: 0, remainingTrades: this.trades.length, lastTrade: null };
  }

  reset(): void {
    this.stop();
  }

  seek(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.trades.length));
    const wasRunning = this.state.status === 'running';
    if (wasRunning) this.stopTimer();
    this.state = {
      ...this.state,
      status: this.trades.length === 0 ? 'empty' : clamped >= this.trades.length ? 'finished' : 'paused',
      currentIndex: clamped,
      remainingTrades: this.trades.length - clamped,
      lastTrade: clamped > 0 ? this.trades[clamped - 1] ?? null : null,
    };
    if (wasRunning && clamped < this.trades.length) {
      this.state = { ...this.state, status: 'running' };
      this.schedule();
    }
  }

  /** Emite o proximo trade sincronamente (passo manual / testes). */
  step(): boolean {
    const trade = this.trades[this.state.currentIndex];
    if (!trade || !this.state.sessionId) return false;
    const sequence = this.state.currentIndex;
    eventBus.emit<HistoricalTradeExecutedEvent>(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, {
      trade,
      sequence,
      sessionId: this.state.sessionId,
    });
    const next = sequence + 1;
    this.state = {
      ...this.state,
      currentIndex: next,
      remainingTrades: this.trades.length - next,
      lastTrade: trade,
      status: next >= this.trades.length ? 'finished' : this.state.status,
    };
    return true;
  }

  private schedule(): void {
    this.stopTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.state.status !== 'running') return;
      const more = this.step();
      if (more && this.state.status === 'running') this.schedule();
    }, Math.max(1, Math.round(150 / this.state.speed)));
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ─── Instância compartilhada (DataPanel carrega, ReplayPlayer toca) ───────────

let shared: HistoricalReplayEngine | null = null;

/** Motor único do replay histórico na sessão. */
export function getSharedReplayEngine(): HistoricalReplayEngine {
  if (!shared) shared = new HistoricalReplayEngine();
  return shared;
}
