import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  formatQueueSummary,
  getOrderVisualStatus,
  SuperDOMView,
} from '../../src/panels/SuperDOMPanel/SuperDOM';
import {
  getAggressorLabel,
  getTradeSizeTier,
  normalizeTradeViewModel,
  TimesAndTradesView,
} from '../../src/panels/TimesTradesPanel/TimesAndTrades';
import { ThemeProvider } from '../../src/ui/designSystem';
import type { TraderOrder } from '../../src/store/traderOrderStore';
import type { HistoricalTradeRecord } from '../../src/store/historicalTradeStore';
import type { TradeRecord } from '../../src/store/tradeStore';
import type { OrderQueueState } from '../../src/trader/QueueInspector';
import type { AggressorType } from '../../src/core/marketData/types';

function renderPanel(node: React.ReactNode): string {
  return renderToStaticMarkup(<ThemeProvider>{node}</ThemeProvider>);
}

function traderOrder(overrides: Partial<TraderOrder>): TraderOrder {
  return {
    id: overrides.id ?? 'order-1',
    side: overrides.side ?? 'buy',
    price: overrides.price ?? 5068.5,
    size: overrides.size ?? 1,
    status: overrides.status ?? 'pending',
    label: overrides.label ?? 'limit',
    createdAt: overrides.createdAt ?? 1,
  };
}

function historicalTrade(index: number, aggressor: AggressorType, quantity = 10): HistoricalTradeRecord {
  return {
    tradeId: `hist-${aggressor}-${index}`,
    timestamp: Date.UTC(2026, 6, 13, 12, 10, index),
    tradeTime: `09:10:${String(index).padStart(2, '0')}`,
    price: 5068.5 + index * 0.5,
    quantity,
    aggressor,
    buyerBrokerCode: 1,
    buyerBrokerName: `COMPRADORA ${index}`,
    sellerBrokerCode: 2,
    sellerBrokerName: `VENDEDORA ${index}`,
    sequence: index,
  };
}

describe('Market panels UX3', () => {
  const noopClick = () => undefined;

  function renderSuperDOMView(options: {
    bids?: Array<{ price: number; totalSize: number; orderCount: number }>;
    asks?: Array<{ price: number; totalSize: number; orderCount: number }>;
    traderOrders?: TraderOrder[];
    bestBid?: number;
    bestAsk?: number;
    lastPrice?: number;
    inspectQueue?: (orderId: string) => OrderQueueState | null;
  } = {}) {
    return renderPanel(
      <SuperDOMView
        bids={options.bids ?? []}
        asks={options.asks ?? []}
        bestBid={options.bestBid ?? 0}
        bestAsk={options.bestAsk ?? 0}
        spread={(options.bestAsk ?? 0) - (options.bestBid ?? 0)}
        lastPrice={options.lastPrice ?? 0}
        positionSide={null}
        positionSize={0}
        averagePrice={0}
        unrealizedPnL={0}
        traderOrders={options.traderOrders ?? []}
        onBuyClick={noopClick}
        onSellClick={noopClick}
        onFlatten={noopClick}
        onCancelOrders={noopClick}
        inspectQueue={options.inspectQueue}
      />,
    );
  }

  it('SuperDOM renderiza estado vazio profissional', () => {
    const html = renderSuperDOMView();
    expect(html).toContain('Book indisponível para a fonte atual.');
  });

  it('SuperDOM renderiza níveis, best bid, best ask, last price e barras de liquidez', () => {
    const html = renderSuperDOMView({
      bids: [{ price: 5068.5, totalSize: 340, orderCount: 4 }],
      asks: [{ price: 5069, totalSize: 420, orderCount: 5 }],
      bestBid: 5068.5,
      bestAsk: 5069,
      lastPrice: 5068.5,
    });

    expect(html).toContain('5.068,50');
    expect(html).toContain('5.069,00');
    expect(html).toContain('LAST');
    expect(html).toContain('BID');
    expect(html).toContain('ASK');
    expect(html).toContain('340');
    expect(html).toContain('420');
  });

  it('SuperDOM renderiza ordens BUY, SELL, parcial, stop, cancelamento e tooltip de fila', () => {
    const html = renderSuperDOMView({
      bids: [{ price: 5068.5, totalSize: 340, orderCount: 4 }],
      asks: [{ price: 5069, totalSize: 420, orderCount: 5 }],
      bestBid: 5068.5,
      bestAsk: 5069,
      lastPrice: 5068.5,
      traderOrders: [
        traderOrder({ id: 'buy-limit', side: 'buy', price: 5068.5, size: 2, status: 'partial', label: 'limit' }),
        traderOrder({ id: 'sell-limit', side: 'sell', price: 5069, size: 1, status: 'pending', label: 'gain' }),
        traderOrder({ id: 'sell-stop', side: 'sell', price: 5068.5, size: 1, status: 'pending', label: 'stop' }),
      ],
      inspectQueue: () => null,
    });

    expect(html).toContain('PARCIAL');
    expect(html).toContain('GAIN');
    expect(html).toContain('STOP');
    expect(html).toContain('Fila indisponível');
    expect(html).toContain('aria-label="Cancelar ordem"');
  });

  it('SuperDOM preserva documentação visual de clique normal e Shift+Click', () => {
    const html = renderSuperDOMView({
      bids: [{ price: 5068.5, totalSize: 100, orderCount: 1 }],
      asks: [{ price: 5069, totalSize: 100, orderCount: 1 }],
      bestBid: 5068.5,
      bestAsk: 5069,
      lastPrice: 5068.5,
    });

    expect(html).toContain('Clique: BUY LIMIT. Shift + clique: BUY agressora.');
    expect(html).toContain('Clique: SELL LIMIT. Shift + clique: SELL agressora.');
  });

  it('formatQueueSummary exibe posição, volume à frente, progresso e restante', () => {
    const queue: OrderQueueState = {
      orderId: 'q1',
      price: 5068.5,
      side: 'buy',
      queuePosition: 4,
      volumeAhead: 327,
      originalVolumeAhead: 700,
      remainingQuantity: 1,
      progress: 0.55,
      status: 'PARCIAL',
    };

    expect(formatQueueSummary(queue)).toContain('#4');
    expect(formatQueueSummary(queue)).toContain('327 ahead');
    expect(formatQueueSummary(queue)).toContain('55%');
    expect(formatQueueSummary(queue)).toContain('rem 1');
  });

  it('getOrderVisualStatus diferencia limit, parcial, gain e stop', () => {
    expect(getOrderVisualStatus(traderOrder({ side: 'buy', label: 'limit' }))).toBe('BUY LIMIT');
    expect(getOrderVisualStatus(traderOrder({ side: 'sell', label: 'limit' }))).toBe('SELL LIMIT');
    expect(getOrderVisualStatus(traderOrder({ status: 'partial' }))).toBe('PARCIAL');
    expect(getOrderVisualStatus(traderOrder({ label: 'gain' }))).toBe('GAIN');
    expect(getOrderVisualStatus(traderOrder({ label: 'stop' }))).toBe('STOP');
  });

  it('Times & Trades renderiza BUY, SELL, RLP, DIRECT, AUCTION e UNKNOWN sem NaN/Infinity', () => {
    const trades = (['BUY', 'SELL', 'RLP', 'DIRECT', 'AUCTION', 'UNKNOWN'] as AggressorType[])
      .map((aggressor, index) => historicalTrade(index, aggressor, 10 + index));

    const html = renderPanel(<TimesAndTradesView isHistorical trades={trades} />);
    expect(html).toContain('BUY');
    expect(html).toContain('SELL');
    expect(html).toContain('RLP');
    expect(html).toContain('DIRETO');
    expect(html).toContain('LEILÃO');
    expect(html).toContain('DESCONH.');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });

  it('Times & Trades aplica limite visual de 250 linhas', () => {
    const trades = Array.from({ length: 260 }, (_, index) => historicalTrade(index, 'BUY', 1));

    const html = renderPanel(<TimesAndTradesView isHistorical trades={trades} />);
    expect(html).toContain('VIS 250/260');
    expect(html).toContain('09:10:249');
    expect(html).not.toContain('09:10:250');
  });

  it('Times & Trades renderiza estado vazio e ações compacto/detalhado/live', () => {
    const html = renderPanel(<TimesAndTradesView isHistorical={false} trades={[]} />);
    expect(html).toContain('Aguardando negócios.');
    expect(html).toContain('COMP');
    expect(html).toContain('DET');
    expect(html).toContain('LIVE');
  });

  it('Times & Trades classifica lotes e normaliza live trade com key estável', () => {
    const liveTrade: TradeRecord = {
      tradeId: 'live-1',
      timestamp: Date.UTC(2026, 6, 13, 12, 10, 32),
      price: 5068.5,
      size: 250,
      aggressorSide: 'BUY',
      aggressorBrokerId: 1,
      aggressorBrokerName: 'AGRESSORA LONGA',
      aggressorBrokerColor: '#fff',
      passiveBrokerId: 2,
      passiveBrokerName: 'PASSIVA',
      passiveBrokerColor: '#888',
      aggressorOrderId: 'a',
      passiveOrderId: 'p',
    };

    const normalized = normalizeTradeViewModel(liveTrade);
    expect(normalized.tradeId).toBe('live-1');
    expect(normalized.tier).toBe('exceptional');
    expect(normalized.buyerName).toBe('AGRESSORA LONGA');
    expect(getTradeSizeTier(25)).toBe('medium');
    expect(getTradeSizeTier(100)).toBe('large');
    expect(getAggressorLabel('DIRECT')).toBe('DIRETO');
  });
});
