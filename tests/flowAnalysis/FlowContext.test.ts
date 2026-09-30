import { describe, expect, it } from 'vitest';
import { FlowContext } from '../../src/core/flowAnalysis/FlowContext';

function createBookSnapshot() {
  return {
    bids: [{ price: 100, side: 'bid' as const, totalSize: 12, orderCount: 2 }],
    asks: [{ price: 101, side: 'ask' as const, totalSize: 8, orderCount: 1 }],
    bestBid: 100,
    bestAsk: 101,
    spread: 1,
  };
}

describe('FlowContext', () => {
  it('atualiza preco atual e timestamp por LAST_PRICE', () => {
    const context = new FlowContext();
    context.onLastPriceUpdate(5123.5, 1_500);

    const snap = context.snapshot();
    expect(snap.currentPrice).toBe(5123.5);
    expect(snap.timestamp).toBe(1_500);
  });

  it('atualiza ultimo trade, delta, agressor e velocidade', () => {
    const context = new FlowContext();
    context.onTradeExecuted({ price: 5001, size: 11, side: 'buy', timestamp: 2_000 }, 11, 3.2);

    const snap = context.snapshot();
    expect(snap.currentPrice).toBe(5001);
    expect(snap.currentDelta).toBe(11);
    expect(snap.currentAggressor).toBe('BUY');
    expect(snap.tradeVelocity).toBeCloseTo(3.2, 8);
    expect(snap.lastTrade).toEqual({ price: 5001, size: 11, side: 'BUY', timestamp: 2_000 });
    expect(snap.timestamp).toBe(2_000);
  });

  it('atualiza snapshot do book sem compartilhar referencia mutavel', () => {
    const context = new FlowContext();
    const book = createBookSnapshot();

    context.onBookUpdate(book, 2_100);
    const beforeMutation = context.snapshot();

    book.bids[0].totalSize = 999;
    book.asks.push({ price: 102, side: 'ask', totalSize: 1, orderCount: 1 });

    const afterMutation = context.snapshot();
    expect(beforeMutation.bookSnapshot?.bids[0].totalSize).toBe(12);
    expect(afterMutation.bookSnapshot?.bids[0].totalSize).toBe(12);
    expect(afterMutation.bookSnapshot?.asks).toHaveLength(1);
  });

  it('preserva marketState entre atualizacoes de outros campos', () => {
    const context = new FlowContext();
    context.setMarketState('LIVE', 3_000);
    context.onBookUpdate(createBookSnapshot(), 3_100);

    expect(context.snapshot().marketState).toBe('LIVE');
  });

  it('onPositionUpdate atualiza timestamp', () => {
    const context = new FlowContext();
    context.onPositionUpdate(3_500);
    expect(context.snapshot().timestamp).toBe(3_500);
  });

  it('reset limpa completamente', () => {
    const context = new FlowContext();
    context.onLastPriceUpdate(5000, 1_000);
    context.onTradeExecuted({ price: 5000, size: 5, side: 'sell', timestamp: 1_100 }, -5, 1.1);
    context.onBookUpdate(createBookSnapshot(), 1_200);
    context.setMarketState('REPLAY', 1_300);

    context.reset();

    const snap = context.snapshot();
    expect(snap.currentPrice).toBe(0);
    expect(snap.lastTrade).toBeNull();
    expect(snap.currentDelta).toBe(0);
    expect(snap.currentAggressor).toBe('NONE');
    expect(snap.tradeVelocity).toBe(0);
    expect(snap.marketState).toBe('UNDEFINED');
    expect(snap.bookSnapshot).toBeNull();
    expect(snap.timestamp).toBe(0);
  });
});
