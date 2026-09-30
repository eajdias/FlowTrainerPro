// trader/QueueInspector.ts
// Read-only inspection of the trader's order position in the FIFO queue.
// NEVER modifies the book or MatchingEngine.
// Provides authoritative data about queue position, volume ahead, and progress.

import { getKernel } from '../core/kernel/SimulationKernel';
import { useTraderOrderStore } from '../store/traderOrderStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderQueueState {
  orderId:             string;
  price:              number;
  side:               'buy' | 'sell';
  queuePosition:      number;   // 1-based position in FIFO
  volumeAhead:        number;   // remaining contracts ahead
  originalVolumeAhead: number;  // volume ahead at time of placement (estimated)
  remainingQuantity:  number;   // trader's remaining size
  progress:           number;   // 0-1 (consumedAhead / originalVolumeAhead)
  status:             'AGUARDANDO' | 'PARCIAL' | 'PRÓXIMA' | 'EXECUTADA' | 'CANCELADA';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get queue state for a specific trader order.
 * Returns null if order is not in the book (stop, filled, or not found).
 */
export function getOrderQueueState(orderId: string): OrderQueueState | null {
  const order = useTraderOrderStore.getState().orders.find((o) => o.id === orderId);
  if (!order) return null;
  if (order.label === 'stop') return null; // stops are not in the book

  const kernel = getKernel();
  if (!kernel.isInitialized) return null;

  const level = kernel.book.getLevel(order.price);
  if (!level) return null;

  const queue = order.side === 'buy' ? level.bidQueue : level.askQueue;
  const idx = queue.findIndex((e) => e.order.id === orderId);

  if (idx === -1) return null; // not in queue (may have been filled)

  // Calculate volume ahead
  let volumeAhead = 0;
  for (let i = 0; i < idx; i++) {
    volumeAhead += queue[i].order.remainingSize;
  }

  // Estimate original volume ahead (from sizeAhead stored at entry time)
  const entry = queue[idx];
  const originalVolumeAhead = entry.sizeAhead > 0 ? entry.sizeAhead : volumeAhead;

  // Progress
  const consumed = originalVolumeAhead - volumeAhead;
  const progress = originalVolumeAhead > 0
    ? Math.min(1, Math.max(0, consumed / originalVolumeAhead))
    : 1;

  // Status
  let status: OrderQueueState['status'] = 'AGUARDANDO';
  if (volumeAhead === 0) {
    status = 'PRÓXIMA';
  } else if (progress > 0) {
    status = 'PARCIAL';
  }

  return {
    orderId,
    price: order.price,
    side: order.side,
    queuePosition: idx + 1,
    volumeAhead,
    originalVolumeAhead,
    remainingQuantity: queue[idx].order.remainingSize,
    progress,
    status,
  };
}

/**
 * Get queue states for ALL active trader orders.
 */
export function getAllOrderQueueStates(): OrderQueueState[] {
  const orders = useTraderOrderStore.getState().orders;
  const states: OrderQueueState[] = [];

  for (const order of orders) {
    const state = getOrderQueueState(order.id);
    if (state) states.push(state);
  }

  return states;
}
