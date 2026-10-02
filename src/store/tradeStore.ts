// store/tradeStore.ts
// Dedicated Zustand store for EXECUTIONS (trades).
// SOURCE OF TRUTH: MatchingEngine via "matching:execution:created" event.
// Times & Trades reads EXCLUSIVELY from this store.
// This store shows EXECUTIONS — NEVER intentions/orders.

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { MATCHING_EVENTS } from '../core/kernel/MatchingEngine';
import type { Execution } from '../core/kernel/MatchingEngine';
import { brokerRegistry } from '../core/marketIdentity/BrokerRegistry';

// ── Trade record — what panels consume ────────────────────────────────────────

export interface TradeRecord {
  tradeId:            string;
  timestamp:          number;
  price:              number;
  size:               number;
  aggressorSide:      'BUY' | 'SELL';
  aggressorBrokerId:  number;
  aggressorBrokerName: string;
  aggressorBrokerColor: string;
  passiveBrokerId:    number;
  passiveBrokerName:  string;
  passiveBrokerColor: string;
  aggressorOrderId:   string;
  passiveOrderId:     string;
  slippageTicks:      number;
}

// ── Store state ───────────────────────────────────────────────────────────────

const MAX_TRADES = 100;
const MAX_LARGE  = 200;  // agressões ≥250 (institucional)
const MAX_MEDIUM = 300;  // agressões ≥25
export const LARGE_MIN  = 250;
export const MEDIUM_MIN = 25;

interface TradeState {
  trades:    TradeRecord[];   // most recent first (janela do tape)
  largeTrades:  TradeRecord[]; // agressões ≥250 (mantidas na sessão)
  mediumTrades: TradeRecord[]; // agressões ≥25
  lastPrice: number;          // updated ONLY by executions
  totalExecs: number;
}

interface TradeActions {
  reset: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTradeStore = create<TradeState & TradeActions>((set) => ({
  trades:     [],
  largeTrades:  [],
  mediumTrades: [],
  lastPrice:  0,
  totalExecs: 0,

  reset: () => set({ trades: [], largeTrades: [], mediumTrades: [], lastPrice: 0, totalExecs: 0 }),
}));

// ── Wire: MatchingEngine → TradeStore (runs once on module load) ──────────────

eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
  const aggressorBroker = brokerRegistry.getBroker(exec.aggressorBrokerId);
  const passiveBroker   = brokerRegistry.getBroker(exec.passiveBrokerId);

  const trade: TradeRecord = {
    tradeId:              exec.executionId,
    timestamp:            exec.timestamp,
    price:                exec.price,
    size:                 exec.size,
    aggressorSide:        exec.side === 'buy' ? 'BUY' : 'SELL',
    aggressorBrokerId:    exec.aggressorBrokerId,
    aggressorBrokerName:  aggressorBroker?.abbreviation ?? '—',
    aggressorBrokerColor: aggressorBroker
      ? brokerRegistry.getOrderColor(exec.aggressorBrokerId, exec.size)
      : '#8b90a0',
    passiveBrokerId:      exec.passiveBrokerId,
    passiveBrokerName:    passiveBroker?.abbreviation ?? '—',
    passiveBrokerColor:   passiveBroker
      ? brokerRegistry.getOrderColor(exec.passiveBrokerId, exec.size)
      : '#8b90a0',
    aggressorOrderId:     exec.aggressorOrderId,
    passiveOrderId:       exec.passiveOrderId,
    slippageTicks:        exec.slippageTicks ?? 0,
  };

  useTradeStore.setState((s) => ({
    trades:     [trade, ...s.trades].slice(0, MAX_TRADES),
    largeTrades: trade.size >= LARGE_MIN
      ? [trade, ...s.largeTrades].slice(0, MAX_LARGE)
      : s.largeTrades,
    mediumTrades: trade.size >= MEDIUM_MIN
      ? [trade, ...s.mediumTrades].slice(0, MAX_MEDIUM)
      : s.mediumTrades,
    lastPrice:  exec.price,
    totalExecs: s.totalExecs + 1,
  }));
});
