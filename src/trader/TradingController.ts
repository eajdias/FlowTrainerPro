// trader/TradingController.ts
// PONTO DE ENTRADA ÚNICO para todas as ações do trader.
// Toda interface (SuperDOM, DataReplayPanel, Hotkeys, futuros) chama APENAS aqui.
// O TradingController traduz intenções do usuário em operações no TraderOrderStore.
// NUNCA acessa o kernel, MatchingEngine ou OrderBook diretamente.

import { eventBus } from '../core/engine/EventBus';
import { useTraderOrderStore } from '../store/traderOrderStore';
import { usePositionStore } from '../store/positionStore';

// ── Trader Events (emitidos pelo controller, consumidos pelo Bridge) ──────────

export const TRADER_EVENTS = {
  ORDER_SUBMIT:     'trader:order:submit',
  ORDER_CANCEL:     'trader:order:cancel',
  STOP_TRIGGERED:   'trader:stop:triggered',
  ORDER_FILLED:     'trader:order:filled',
} as const;

// ── Public API — o que as interfaces chamam ───────────────────────────────────

/**
 * Coloca uma ordem (limit, gain ou stop) no preço especificado.
 * Classifica automaticamente baseado na posição atual.
 */
export function placeOrder(side: 'buy' | 'sell', price: number, size: number = 1): void {
  const pos = usePositionStore.getState();
  const label = classifyOrder(side, price, pos.side, pos.averagePrice);

  const order = useTraderOrderStore.getState().addOrder(side, price, size, label);

  // Se NÃO é stop → emite evento para o Bridge submeter ao mercado
  if (label !== 'stop') {
    eventBus.emit(TRADER_EVENTS.ORDER_SUBMIT, {
      id:    order.id,
      side:  order.side,
      price: order.price,
      size:  order.size,
      type:  'limit',
    });
  }
}

/**
 * Compra a mercado (abre posição ou escala).
 */
export function buyMarket(size: number = 1): void {
  const order = useTraderOrderStore.getState().addOrder('buy', 0, size, 'limit');

  eventBus.emit(TRADER_EVENTS.ORDER_SUBMIT, {
    id:    order.id,
    side:  'buy',
    price: 0,
    size,
    type:  'market',
  });
}

/**
 * Vende a mercado (abre posição short ou escala).
 */
export function sellMarket(size: number = 1): void {
  const order = useTraderOrderStore.getState().addOrder('sell', 0, size, 'limit');

  eventBus.emit(TRADER_EVENTS.ORDER_SUBMIT, {
    id:    order.id,
    side:  'sell',
    price: 0,
    size,
    type:  'market',
  });
}

/**
 * Zera posição (flatten).
 */
export function flattenPosition(): void {
  const pos = usePositionStore.getState();
  if (pos.side === null || pos.size === 0) return;

  // Submete market order no lado oposto
  const side: 'buy' | 'sell' = pos.side === 'long' ? 'sell' : 'buy';
  const order = useTraderOrderStore.getState().addOrder(side, 0, pos.size, 'limit');

  eventBus.emit(TRADER_EVENTS.ORDER_SUBMIT, {
    id:    order.id,
    side,
    price: 0,
    size:  pos.size,
    type:  'market',
  });
}

/**
 * Cancela uma ordem pendente do trader.
 */
export function cancelOrder(orderId: string): void {
  const order = useTraderOrderStore.getState().orders.find((o) => o.id === orderId);
  if (!order) return;

  useTraderOrderStore.getState().removeOrder(orderId);

  // Se era gain/limit (está no book) → avisar Bridge para cancelar no MatchingEngine
  if (order.label !== 'stop') {
    eventBus.emit(TRADER_EVENTS.ORDER_CANCEL, {
      id:    order.id,
      price: order.price,
      side:  order.side,
    });
  }
}

/**
 * Cancela todas as ordens pendentes.
 */
export function cancelAll(): void {
  const orders = useTraderOrderStore.getState().orders;
  for (const order of orders) {
    cancelOrder(order.id);
  }
}

// ── Classificação de ordem ────────────────────────────────────────────────────

function classifyOrder(
  side: 'buy' | 'sell',
  price: number,
  positionSide: 'long' | 'short' | null,
  avgPrice: number,
): 'stop' | 'gain' | 'limit' {
  if (price === 0) return 'limit'; // market order

  if (positionSide === 'long' && side === 'sell') {
    return price < avgPrice ? 'stop' : 'gain';
  }
  if (positionSide === 'short' && side === 'buy') {
    return price > avgPrice ? 'stop' : 'gain';
  }

  return 'limit';
}
