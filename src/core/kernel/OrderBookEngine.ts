// core/kernel/OrderBookEngine.ts
// Projecao de leitura do MatchingEngine: snapshot p/ o SuperDOM.
// Nao casa ordens — so le as filas e emite `book:update`.

import { eventBus } from '../engine/EventBus';
import type { MatchingEngine } from './MatchingEngine';
import type { BookLevel } from './MatchingEngine';

export const BOOK_EVENTS = {
  BOOK_UPDATE: 'book:update',
} as const;

export interface BookLevelView {
  price: number;
  size: number;
  orderCount: number;
}

export interface BookSnapshot {
  bids: BookLevelView[];
  asks: BookLevelView[];
  bestBid: number;
  bestAsk: number;
  spread: number;
}

function toView(levels: BookLevel[]): BookLevelView[] {
  return levels.map((l) => ({ price: l.price, size: l.size, orderCount: l.count }));
}

export class OrderBookEngine {
  private readonly matching: MatchingEngine;

  constructor(matching: MatchingEngine) {
    this.matching = matching;
  }

  snapshot(depth = 25): BookSnapshot {
    const { bids, asks } = this.matching.getBookLevels(depth);
    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    return {
      bids: toView(bids),
      asks: toView(asks),
      bestBid,
      bestAsk,
      spread: bestBid > 0 && bestAsk > 0 ? Math.round((bestAsk - bestBid) * 100) / 100 : 0,
    };
  }

  refresh(): void {
    eventBus.emit<BookSnapshot>(BOOK_EVENTS.BOOK_UPDATE, this.snapshot());
  }

  getLevel(price: number): { bidQueue: { order: { id: string; remainingSize: number }; sizeAhead: number }[]; askQueue: { order: { id: string; remainingSize: number }; sizeAhead: number }[] } | null {
    return this.matching.getLevel(price);
  }
}
