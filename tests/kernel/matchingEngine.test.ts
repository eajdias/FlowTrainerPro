import { describe, expect, it, beforeEach } from 'vitest';
import { eventBus } from '../../src/core/engine/EventBus';
import { MatchingEngine, MATCHING_EVENTS, type Execution } from '../../src/core/kernel/MatchingEngine';
import type { Order } from '../../src/core/orderflow/models/Order';

let n = 0;
function order(partial: Partial<Order>): Order {
  n += 1;
  return {
    id: `o${n}`,
    playerId: 'p1',
    brokerId: 3,
    type: 'limit',
    side: 'buy',
    price: 5000,
    size: 5,
    filledSize: 0,
    remainingSize: 5,
    status: 'pending',
    timestamp: 1,
    tick: 0,
    ...partial,
  };
}

describe('MatchingEngine FIFO', () => {
  let fills: Execution[];

  beforeEach(() => {
    n = 0;
    fills = [];
    eventBus.clear();
    eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => fills.push(e));
  });

  it('descansa limit sem cruzamento e executa agressora FIFO', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001 }), 0, 1);
    eng.submit(order({ id: 'b', side: 'sell', price: 5001 }), 0, 1);
    expect(fills.length).toBe(0);

    eng.submit(order({ id: 'c', side: 'buy', price: 5001, size: 7, remainingSize: 7 }), 0, 2);
    expect(fills.length).toBe(2);
    expect(fills[0]?.passiveOrderId).toBe('a');
    expect(fills[0]?.size).toBe(5);
    expect(fills[1]?.passiveOrderId).toBe('b');
    expect(fills[1]?.size).toBe(2);
  });

  it('prioridade de preco antes de tempo', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5002 }), 0, 1);
    eng.submit(order({ id: 'b', side: 'sell', price: 5001 }), 0, 1);
    eng.submit(order({ id: 'c', side: 'buy', price: 5002, size: 5, remainingSize: 5 }), 0, 2);
    expect(fills.length).toBe(1);
    expect(fills[0]?.price).toBe(5001);
    expect(fills[0]?.passiveOrderId).toBe('b');
  });

  it('market consome varios niveis', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001, size: 2, remainingSize: 2 }), 0, 1);
    eng.submit(order({ id: 'b', side: 'sell', price: 5002, size: 2, remainingSize: 2 }), 0, 1);
    eng.submit(order({ id: 'c', side: 'buy', type: 'market', price: 0, size: 3, remainingSize: 3 }), 0, 2);
    expect(fills.length).toBe(2);
    expect(fills[0]?.price).toBe(5001);
    expect(fills[1]?.price).toBe(5002);
  });

  it('cancel remove da fila', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001 }), 0, 1);
    expect(eng.cancel('a', 5001, 'sell')).toBe(true);
    expect(eng.cancel('a', 5001, 'sell')).toBe(false);
    eng.submit(order({ id: 'c', side: 'buy', price: 5001, size: 5, remainingSize: 5 }), 0, 2);
    expect(fills.length).toBe(0);
  });

  it('expõe posição na fila', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001, size: 5, remainingSize: 5 }), 0, 1);
    eng.submit(order({ id: 'b', side: 'sell', price: 5001, size: 3, remainingSize: 3 }), 0, 1);
    const level = eng.getLevel(5001);
    expect(level?.askQueue.length).toBe(2);
    expect(level?.askQueue[1]?.sizeAhead).toBe(5);
  });

  it('slippage zero no toque, positiva varrendo níveis', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001, size: 2, remainingSize: 2 }), 0, 1);
    eng.submit(order({ id: 'b', side: 'sell', price: 5002, size: 2, remainingSize: 2 }), 0, 1);
    eng.submit(order({ id: 'c', side: 'buy', type: 'market', price: 0, size: 3, remainingSize: 3 }), 0, 2);
    expect(fills.length).toBe(2);
    expect(fills[0]?.slippageTicks).toBe(0);
    expect(fills[1]?.slippageTicks).toBe(2);
  });

  it('tempo médio de fila por nível', () => {
    const eng = new MatchingEngine();
    eng.submit(order({ id: 'a', side: 'sell', price: 5001, size: 5, remainingSize: 5 }), 0, 1000);
    eng.submit(order({ id: 'c', side: 'buy', type: 'market', price: 0, size: 5, remainingSize: 5 }), 0, 2500);
    const stats = eng.getQueueTimeStats();
    expect(stats).toEqual([{ price: 5001, avgWaitMs: 1500, fills: 1 }]);
  });
});
