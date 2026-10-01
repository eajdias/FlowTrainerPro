// core/orderflow/models/Order.ts
// Ordem do simulador (universo do mercado + ordens do trader via bridge).

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type OrderStatus = 'pending' | 'open' | 'filled' | 'cancelled';

export interface Order {
  id: string;
  playerId: string;
  brokerId: number;
  type: OrderType;
  side: OrderSide;
  /** 0 para market */
  price: number;
  size: number;
  filledSize: number;
  remainingSize: number;
  status: OrderStatus;
  timestamp: number;
  tick: number;
}
