// store/bookStore.ts
// Dedicated Zustand store for the Order Book (DOM).
// SOURCE OF TRUTH: OrderBookEngine via "book:update" event.
// The SuperDOM reads EXCLUSIVELY from this store.
// This store shows INTENTIONS (resting orders) — NEVER executions.

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { BOOK_EVENTS } from '../core/kernel/OrderBookEngine';
import type { BookSnapshot, BookLevelView } from '../core/kernel/OrderBookEngine';

// ── Store state ───────────────────────────────────────────────────────────────

interface BookState {
  bids:       BookLevelView[];   // sorted price desc (best bid first)
  asks:       BookLevelView[];   // sorted price asc (best ask first)
  bestBid:    number;
  bestAsk:    number;
  spread:     number;
  lastPrice:  number;            // updated ONLY by trade:executed
  lastUpdate: number;            // timestamp of last update
  execCount:  number;            // total executions this session
}

interface BookActions {
  applySnapshot: (snapshot: BookSnapshot) => void;
  setLastPrice:  (price: number) => void;
  incrementExec: () => void;
  reset:         () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBookStore = create<BookState & BookActions>((set) => ({
  bids:       [],
  asks:       [],
  bestBid:    0,
  bestAsk:    0,
  spread:     0,
  lastPrice:  0,
  lastUpdate: 0,
  execCount:  0,

  applySnapshot: (snapshot) => set({
    bids:       snapshot.bids,
    asks:       snapshot.asks,
    bestBid:    snapshot.bestBid,
    bestAsk:    snapshot.bestAsk,
    spread:     snapshot.spread,
    lastUpdate: Date.now(),
  }),

  setLastPrice: (price) => set({ lastPrice: price }),

  incrementExec: () => set((s) => ({ execCount: s.execCount + 1 })),

  reset: () => set({
    bids: [], asks: [], bestBid: 0, bestAsk: 0, spread: 0,
    lastPrice: 0, lastUpdate: 0, execCount: 0,
  }),
}));

// ── Wire EventBus → Store (runs once on module load) ──────────────────────────
// This ensures the store is always updated when the book changes.

import { MATCHING_EVENTS } from '../core/kernel/MatchingEngine';
import type { Execution } from '../core/kernel/MatchingEngine';

eventBus.on<BookSnapshot>(BOOK_EVENTS.BOOK_UPDATE, (snapshot) => {
  useBookStore.getState().applySnapshot(snapshot);
});

// Last Price updated ONLY by executions — never by book changes
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
  useBookStore.getState().setLastPrice(exec.price);
  useBookStore.getState().incrementExec();
});
