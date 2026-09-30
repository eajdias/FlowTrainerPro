// store/positionStore.ts
// Zustand store for trader positions and P&L.
// The trader is just another player — same rules apply.
// Updated on every tick from marketStore.

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PositionSide = 'long' | 'short';

export interface TradeRecord {
  id:          string;
  side:        PositionSide;
  entryPrice:  number;
  exitPrice:   number | null;
  size:        number;
  pnl:         number;
  openedAt:    number;
  closedAt:    number | null;
  isOpen:      boolean;
}

export interface PositionState {
  // Current position
  side:            PositionSide | null;  // null = flat
  size:            number;
  averagePrice:    number;
  unrealizedPnL:   number;
  realizedPnL:     number;

  // History
  trades:          TradeRecord[];
  totalTrades:     number;
  winningTrades:   number;
  losingTrades:    number;
}

interface PositionActions {
  openPosition:   (side: PositionSide, price: number, size?: number) => void;
  closePosition:  (price: number) => void;
  flattenAll:     (price: number) => void;
  updatePnL:      (currentPrice: number) => void;
  reset:          () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TICK_SIZE = 0.50;
const TICK_VALUE = 5.00; // R$ 5,00 por tick de 0,50

// ── Helper ────────────────────────────────────────────────────────────────────

let tradeId = 0;

function calcPnL(side: PositionSide, entry: number, current: number, size: number): number {
  const ticks = (current - entry) / TICK_SIZE;
  const pnl = ticks * TICK_VALUE * size;
  return side === 'long' ? pnl : -pnl;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePositionStore = create<PositionState & PositionActions>((set, get) => ({
  side:           null,
  size:           0,
  averagePrice:   0,
  unrealizedPnL:  0,
  realizedPnL:    0,
  trades:         [],
  totalTrades:    0,
  winningTrades:  0,
  losingTrades:   0,

  openPosition: (side, price, size = 1) => {
    const s = get();

    // If already positioned in the same direction — scale in
    if (s.side === side) {
      const totalSize = s.size + size;
      const newAvg    = (s.averagePrice * s.size + price * size) / totalSize;
      set({ size: totalSize, averagePrice: newAvg });
      return;
    }

    // If positioned in opposite direction — close first, then open remainder
    if (s.side !== null && s.side !== side) {
      // Close existing
      const pnl = calcPnL(s.side, s.averagePrice, price, s.size);
      const closedTrade: TradeRecord = {
        id: `trade-${++tradeId}`,
        side: s.side,
        entryPrice: s.averagePrice,
        exitPrice: price,
        size: s.size,
        pnl,
        openedAt: Date.now() - 5000, // approximate
        closedAt: Date.now(),
        isOpen: false,
      };

      const isWin = pnl > 0;

      // Open new in opposite direction
      set((prev) => ({
        side,
        size,
        averagePrice: price,
        unrealizedPnL: 0,
        realizedPnL: prev.realizedPnL + pnl,
        trades: [closedTrade, ...prev.trades].slice(0, 50),
        totalTrades: prev.totalTrades + 1,
        winningTrades: prev.winningTrades + (isWin ? 1 : 0),
        losingTrades: prev.losingTrades + (isWin ? 0 : 1),
      }));
      return;
    }

    // Flat → open new position
    const newTrade: TradeRecord = {
      id: `trade-${++tradeId}`,
      side,
      entryPrice: price,
      exitPrice: null,
      size,
      pnl: 0,
      openedAt: Date.now(),
      closedAt: null,
      isOpen: true,
    };

    set({
      side,
      size,
      averagePrice: price,
      unrealizedPnL: 0,
      trades: [newTrade, ...get().trades].slice(0, 50),
    });
  },

  closePosition: (price) => {
    const s = get();
    if (s.side === null || s.size === 0) return;

    const pnl = calcPnL(s.side, s.averagePrice, price, s.size);
    const isWin = pnl > 0;

    // Close the open trade in history
    const updatedTrades = s.trades.map((t) =>
      t.isOpen ? { ...t, exitPrice: price, pnl, closedAt: Date.now(), isOpen: false } : t,
    );

    set({
      side: null,
      size: 0,
      averagePrice: 0,
      unrealizedPnL: 0,
      realizedPnL: s.realizedPnL + pnl,
      trades: updatedTrades,
      totalTrades: s.totalTrades + 1,
      winningTrades: s.winningTrades + (isWin ? 1 : 0),
      losingTrades: s.losingTrades + (isWin ? 0 : 1),
    });
  },

  flattenAll: (price) => {
    get().closePosition(price);
  },

  updatePnL: (currentPrice) => {
    const s = get();
    if (s.side === null || s.size === 0) {
      if (s.unrealizedPnL !== 0) set({ unrealizedPnL: 0 });
      return;
    }
    const pnl = calcPnL(s.side, s.averagePrice, currentPrice, s.size);
    set({ unrealizedPnL: pnl });
  },

  reset: () => {
    tradeId = 0;
    set({
      side: null, size: 0, averagePrice: 0,
      unrealizedPnL: 0, realizedPnL: 0,
      trades: [], totalTrades: 0, winningTrades: 0, losingTrades: 0,
    });
  },
}));
