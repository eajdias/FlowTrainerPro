// core/kernel/MatchingEngine.ts
// FIFO price-time priority. Ordens agressoras executam na hora;
// restante de limit GTC descansa no fim da fila do preco.
// Fills passivos do trader tambem passam por aqui (fila unica).

import { eventBus } from '../engine/EventBus';
import type { Order, OrderSide } from '../orderflow/models/Order';

export const MATCHING_EVENTS = {
  EXECUTION_CREATED: 'matching:execution:created',
} as const;

export interface Execution {
  executionId: string;
  timestamp: number;
  price: number;
  size: number;
  side: OrderSide;
  aggressorPlayerId: string;
  passivePlayerId: string;
  aggressorBrokerId: number;
  passiveBrokerId: number;
  aggressorOrderId: string;
  passiveOrderId: string;
}

type BookSide = 'bid' | 'ask';

interface QueueEntry {
  orderId: string;
  playerId: string;
  brokerId: number;
  remaining: number;
  sizeAhead: number;
}

export interface QueueViewEntry {
  order: { id: string; remainingSize: number };
  sizeAhead: number;
}

export interface BookLevel {
  price: number;
  size: number;
  count: number;
}

function bookSideFor(side: OrderSide): BookSide {
  return side === 'buy' ? 'bid' : 'ask';
}

function oppositeSide(side: BookSide): BookSide {
  return side === 'bid' ? 'ask' : 'bid';
}

export class MatchingEngine {
  private queues = new Map<string, QueueEntry[]>();
  private execCounter = 0;

  private key(side: BookSide, price: number): string {
    return `${side}:${price}`;
  }

  private queueOf(side: BookSide, price: number): QueueEntry[] {
    const k = this.key(side, price);
    let q = this.queues.get(k);
    if (!q) {
      q = [];
      this.queues.set(k, q);
    }
    return q;
  }

  private bestPrice(side: BookSide): number | null {
    let best: number | null = null;
    for (const [k, q] of this.queues) {
      if (q.length === 0) continue;
      const sep = k.indexOf(':');
      if (k.slice(0, sep) !== side) continue;
      const price = Number(k.slice(sep + 1));
      if (best === null) best = price;
      else if (side === 'bid' ? price > best : price < best) best = price;
    }
    return best;
  }

  /** Preco cruzaria o book agora (sem executar). */
  wouldMatch(side: OrderSide, price: number): boolean {
    if (price === 0) return true;
    const best = this.bestPrice(oppositeSide(bookSideFor(side)));
    if (best === null) return false;
    return side === 'buy' ? best <= price : best >= price;
  }

  submit(order: Order, tick: number, now: number): void {
    if (order.size <= 0) return;
    let remaining = order.remainingSize > 0 ? order.remainingSize : order.size;
    const restingSide = bookSideFor(order.side);
    const takeSide = oppositeSide(restingSide);

    while (remaining > 0) {
      const best = this.bestPrice(takeSide);
      if (best === null) break;
      if (order.type === 'limit' && order.price > 0) {
        if (order.side === 'buy' && best > order.price) break;
        if (order.side === 'sell' && best < order.price) break;
      }
      const q = this.queueOf(takeSide, best);
      const head = q[0];
      if (!head) {
        this.queues.delete(this.key(takeSide, best));
        continue;
      }
      const fill = Math.min(remaining, head.remaining);
      head.remaining -= fill;
      remaining -= fill;
      this.execCounter += 1;

      eventBus.emit<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, {
        executionId: `ex-${this.execCounter}`,
        timestamp: now,
        price: best,
        size: fill,
        side: order.side,
        aggressorPlayerId: order.playerId,
        passivePlayerId: head.playerId,
        aggressorBrokerId: order.brokerId,
        passiveBrokerId: head.brokerId,
        aggressorOrderId: order.id,
        passiveOrderId: head.orderId,
      });

      if (head.remaining <= 0) q.shift();
      if (q.length === 0) this.queues.delete(this.key(takeSide, best));
    }

    if (remaining > 0 && order.type === 'limit' && order.price > 0) {
      const q = this.queueOf(restingSide, order.price);
      const sizeAhead = q.reduce((s, e) => s + e.remaining, 0);
      q.push({
        orderId: order.id,
        playerId: order.playerId,
        brokerId: order.brokerId,
        remaining,
        sizeAhead,
      });
    }
    void tick;
  }

  cancel(id: string, price: number, side: OrderSide): boolean {
    const bookSide = bookSideFor(side);
    const q = this.queues.get(this.key(bookSide, price));
    if (!q) return false;
    const idx = q.findIndex((e) => e.orderId === id);
    if (idx === -1) return false;
    q.splice(idx, 1);
    if (q.length === 0) this.queues.delete(this.key(bookSide, price));
    return true;
  }

  getLevel(price: number): { bidQueue: QueueViewEntry[]; askQueue: QueueViewEntry[] } | null {
    const bids = this.queues.get(this.key('bid', price)) ?? [];
    const asks = this.queues.get(this.key('ask', price)) ?? [];
    if (bids.length === 0 && asks.length === 0) return null;
    const view = (q: QueueEntry[]): QueueViewEntry[] =>
      q.map((e) => ({ order: { id: e.orderId, remainingSize: e.remaining }, sizeAhead: e.sizeAhead }));
    return { bidQueue: view(bids), askQueue: view(asks) };
  }

  getBookLevels(depth = 25): { bids: BookLevel[]; asks: BookLevel[] } {
    const bids: BookLevel[] = [];
    const asks: BookLevel[] = [];
    for (const [k, q] of this.queues) {
      if (q.length === 0) continue;
      const sep = k.indexOf(':');
      const side = k.slice(0, sep);
      const price = Number(k.slice(sep + 1));
      const level: BookLevel = {
        price,
        size: q.reduce((s, e) => s + e.remaining, 0),
        count: q.length,
      };
      if (side === 'bid') bids.push(level);
      else asks.push(level);
    }
    bids.sort((a, b) => b.price - a.price);
    asks.sort((a, b) => a.price - b.price);
    return { bids: bids.slice(0, depth), asks: asks.slice(0, depth) };
  }
}
