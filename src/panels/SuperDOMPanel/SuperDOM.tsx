// panels/SuperDOMPanel/SuperDOM.tsx
// DOM interativo: click = limit, Shift+click = agressora (doc SUPERDOM_TRADING_INTERACTIONS).
// Handlers homologados: TradingController. Fila: QueueInspector read-only.
import { useMemo } from 'react';
import { useBookStore } from '../../store/bookStore';
import { usePositionStore } from '../../store/positionStore';
import { useTraderOrderStore } from '../../store/traderOrderStore';
import {
  placeOrder,
  buyMarket,
  sellMarket,
  cancelOrder,
  flattenPosition,
} from '../../trader/TradingController';
import { getOrderQueueState, getAllOrderQueueStates } from '../../trader/QueueInspector';
import { getKernel } from '../../core/kernel/SimulationKernel';
import { BROKERS } from '../../core/marketIdentity/data/brokers';
import { PanelShell } from '../PanelShell/PanelShell';

const VISIBLE_LEVELS = 15;
const TICK_SIZE = 0.5;
const TICK_VALUE = 5.0;

function QueueSection() {
  const orders = useTraderOrderStore((s) => s.orders);
  if (orders.length === 0) return null;
  const states = getAllOrderQueueStates();
  const waits = getKernel().matching.getQueueTimeStats();
  const waitByPrice = new Map(waits.map((w) => [w.price, w]));

  return (
    <div>
      <strong>Fila ({states.length})</strong>
      <ul>
        {states.map((q) => (
          <li key={q.orderId}>
            {q.side} {q.remainingQuantity} @ {q.price.toFixed(2)} — #{q.queuePosition} |{' '}
            {q.volumeAhead} ahead | {Math.round(q.progress * 100)}% | {q.status}
            {(() => {
              const w = waitByPrice.get(q.price);
              return w ? ` | espera média ${Math.round(w.avgWaitMs)}ms (${w.fills})` : '';
            })()}
          </li>
        ))}
      </ul>
    </div>
  );
}
function estimateAt(price: number, side: 'long' | 'short', avg: number, size: number): number {
  const ticks = (price - avg) / TICK_SIZE;
  const pnl = ticks * TICK_VALUE * size;
  return side === 'long' ? pnl : -pnl;
}

export function SuperDOM() {
  const bids = useBookStore((s) => s.bids);
  const asks = useBookStore((s) => s.asks);
  const bestBid = useBookStore((s) => s.bestBid);
  const bestAsk = useBookStore((s) => s.bestAsk);
  const lastPrice = useBookStore((s) => s.lastPrice);
  const posSide = usePositionStore((s) => s.side);
  const posSize = usePositionStore((s) => s.size);
  const avgPrice = usePositionStore((s) => s.averagePrice);
  const unrealized = usePositionStore((s) => s.unrealizedPnL);
  const orders = useTraderOrderStore((s) => s.orders);
  const brokerId = useTraderOrderStore((s) => s.brokerId);
  const setBrokerId = useTraderOrderStore((s) => s.setBrokerId);

  const prices = useMemo(() => {
    const set = new Set<number>();
    for (const b of bids) set.add(b.price);
    for (const a of asks) set.add(a.price);
    const sorted = [...set].sort((x, y) => y - x);
    const mid = lastPrice > 0 ? lastPrice : (bestBid + bestAsk) / 2;
    if (!(mid > 0)) return sorted.slice(0, VISIBLE_LEVELS * 2);
    const above = sorted.filter((p) => p >= mid).slice(-VISIBLE_LEVELS).reverse();
    const below = sorted.filter((p) => p < mid).slice(0, VISIBLE_LEVELS);
    const top = [...above.reverse(), ...below];
    return top.length > 0 ? top : sorted.slice(0, VISIBLE_LEVELS * 2);
  }, [bids, asks, lastPrice, bestBid, bestAsk]);

  const bidByPrice = useMemo(() => new Map(bids.map((b) => [b.price, b.size])), [bids]);
  const askByPrice = useMemo(() => new Map(asks.map((a) => [a.price, a.size])), [asks]);
  const buyOrdersByPrice = useMemo(() => {
    const m = new Map<number, typeof orders>();
    for (const o of orders) {
      if (o.side !== 'buy') continue;
      const list = m.get(o.price) ?? [];
      list.push(o);
      m.set(o.price, list);
    }
    return m;
  }, [orders]);
  const sellOrdersByPrice = useMemo(() => {
    const m = new Map<number, typeof orders>();
    for (const o of orders) {
      if (o.side !== 'sell') continue;
      const list = m.get(o.price) ?? [];
      list.push(o);
      m.set(o.price, list);
    }
    return m;
  }, [orders]);

  if (prices.length === 0) {
    return (
      <PanelShell title="SuperDOM">
        <p>Book indisponível para a fonte atual.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="SuperDOM">
      <div>
        <span>
          {posSide ? `${posSide.toUpperCase()} ${posSize} @ ${avgPrice.toFixed(2)}` : 'FLAT'}
        </span>
        <span>P&L {unrealized.toFixed(2)}</span>
        <label>
          Corretora
          <select value={brokerId} onChange={(e) => setBrokerId(Number(e.target.value))}>
            {BROKERS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} {b.name}
              </option>
            ))}
          </select>
        </label>
        {posSide && (
          <button type="button" onClick={() => flattenPosition()}>
            ZERAR
          </button>
        )}
      </div>
      <QueueSection />
      <table>
        <thead>
          <tr>
            <th>Ord.C</th>
            <th>Qtd.C</th>
            <th>Preço</th>
            <th>Qtd.V</th>
            <th>Ord.V</th>
            <th>R$</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => {
            const buys = buyOrdersByPrice.get(price) ?? [];
            const sells = sellOrdersByPrice.get(price) ?? [];
            const isBid = price === bestBid;
            const isAsk = price === bestAsk;
            const isLast = price === lastPrice;
            return (
              <tr key={price}>
                <td
                  onClick={(e) => {
                    if (e.shiftKey) buyMarket();
                    else placeOrder('buy', price);
                  }}
                >
                  {buys.map((o) => {
                    const q = getOrderQueueState(o.id);
                    return (
                      <span key={o.id} title={q ? `#${q.queuePosition} | ${q.volumeAhead} ahead | ${Math.round(q.progress * 100)}% | rem ${q.remainingQuantity}` : 'Fila indisponível'}>
                        {o.size}
                        <button type="button" aria-label={`cancel ${o.id}`} onClick={(e) => { e.stopPropagation(); cancelOrder(o.id); }}>
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </td>
                <td
                  onClick={(e) => {
                    if (e.shiftKey) buyMarket();
                    else placeOrder('buy', price);
                  }}
                >
                  {bidByPrice.get(price) ?? ''}
                </td>
                <td>
                  {price.toFixed(2)}
                  {isBid ? ' B' : ''}
                  {isAsk ? ' A' : ''}
                  {isLast ? ' LAST' : ''}
                </td>
                <td
                  onClick={(e) => {
                    if (e.shiftKey) sellMarket();
                    else placeOrder('sell', price);
                  }}
                >
                  {askByPrice.get(price) ?? ''}
                </td>
                <td
                  onClick={(e) => {
                    if (e.shiftKey) sellMarket();
                    else placeOrder('sell', price);
                  }}
                >
                  {sells.map((o) => {
                    const q = getOrderQueueState(o.id);
                    return (
                      <span key={o.id} title={q ? `#${q.queuePosition} | ${q.volumeAhead} ahead | ${Math.round(q.progress * 100)}% | rem ${q.remainingQuantity}` : 'Fila indisponível'}>
                        {o.size}
                        <button type="button" aria-label={`cancel ${o.id}`} onClick={(e) => { e.stopPropagation(); cancelOrder(o.id); }}>
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </td>
                <td>{posSide ? estimateAt(price, posSide, avgPrice, posSize).toFixed(0) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PanelShell>
  );
}
