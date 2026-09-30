// store/traderOrderStore.ts
// ARMAZENAMENTO PURO das ordens pendentes do trader.
// NÃO contém lógica ativa. NÃO chama engines. NÃO monitora preço.
// NÃO importa kernel, MatchingEngine ou OrderBook.
//
// Responsabilidades:
// - Armazenar ordens pendentes (stops, gains, limits)
// - Adicionar / remover ordens
// - Escutar "trader:order:filled" para remover ordens executadas
//
// Quem CHAMA este store: TradingController (único ponto de entrada)
// Quem MONITORA triggers: TraderExecutionBridge (via leitura do store)

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../core/engine/EventBus';

// ── Trader order record ───────────────────────────────────────────────────────

export interface TraderOrder {
  id:        string;
  side:      'buy' | 'sell';
  price:     number;
  size:      number;
  status:    'pending' | 'partial';
  label:     'limit' | 'gain' | 'stop';
  createdAt: number;
}

// ── Store state ───────────────────────────────────────────────────────────────

interface TraderOrderState {
  orders: TraderOrder[];
}

interface TraderOrderActions {
  /** Adiciona uma ordem ao store. Retorna a ordem criada. */
  addOrder:    (side: 'buy' | 'sell', price: number, size: number, label: 'limit' | 'gain' | 'stop') => TraderOrder;
  /** Remove uma ordem pelo ID. */
  removeOrder: (orderId: string) => void;
  /** Remove todas as ordens. */
  clearAll:    () => void;
  /** Reset completo. */
  reset:       () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTraderOrderStore = create<TraderOrderState & TraderOrderActions>((set) => ({
  orders: [],

  addOrder: (side, price, size, label) => {
    const order: TraderOrder = {
      id:        uuidv4(),
      side,
      price,
      size,
      status:    'pending',
      label,
      createdAt: Date.now(),
    };

    set((s) => ({ orders: [...s.orders, order] }));
    return order;
  },

  removeOrder: (orderId) => {
    set((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));
  },

  clearAll: () => set({ orders: [] }),

  reset: () => set({ orders: [] }),
}));

// ── Wire: "trader:order:filled" → remove from store ───────────────────────────

const TRADER_ORDER_FILLED = 'trader:order:filled';

eventBus.on(TRADER_ORDER_FILLED, (payload: { id: string }) => {
  useTraderOrderStore.getState().removeOrder(payload.id);
});
