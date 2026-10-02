// panels/SuperDOMPanel/SuperDOM.tsx
// DOM interativo + Price Ladder FUNDIDOS:
//   [Δ exec] [Ord.C] [Qtd.C] [PREÇO] [Qtd.V] [Ord.V] [Exec.C] [Exec.V] [R$]
// Click = limit, Shift+click = agressora (TradingController; fila via QueueInspector).
// Auto-follow: a linha do preço atual sobe/desce com o mercado e fica sublinhada.
// (trava o auto-follow por alguns segundos após scroll manual)
import { useEffect, useMemo, useRef } from 'react';
import { useBookStore } from '../../store/bookStore';
import { useMarketStore } from '../../store/marketStore';
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
    <div className="ftp-dom-queue">
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

  // Dados por preço (fundidos do Price Ladder): volume executado e delta
  const execLevels = useMarketStore((s) => s.priceLevels);
  const execByPrice = useMemo(
    () => new Map(execLevels.map((l) => [l.price, l])),
    [execLevels],
  );

  // Refs de referência do dia (mesmas do gráfico 8P)
  const dayHigh = useMarketStore((s) => s.dayHigh);
  const dayLow = useMarketStore((s) => s.dayLow);
  const dayVwap = useMarketStore((s) => s.dayVwap);
  const dayOpen = useMarketStore((s) => s.dayOpen);

  const refFor = (price: number): { tag: string; cls: string; title: string } | null => {
    const eps = TICK_SIZE / 2;
    if (dayHigh > 0 && Math.abs(price - dayHigh) < eps) return { tag: 'Máx', cls: 'is-high', title: 'Máxima do dia' };
    if (dayLow > 0 && Math.abs(price - dayLow) < eps) return { tag: 'Mín', cls: 'is-low', title: 'Mínima do dia' };
    if (dayVwap > 0 && Math.abs(price - dayVwap) < eps) return { tag: 'VWAP', cls: 'is-vwap', title: 'VWAP da sessão' };
    if (dayOpen > 0 && Math.abs(price - dayOpen) < eps) return { tag: 'Abert', cls: 'is-open', title: 'Abertura da sessão' };
    return null;
  };

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
  const maxBid = useMemo(() => Math.max(1, ...bids.map((b) => b.size)), [bids]);
  const maxAsk = useMemo(() => Math.max(1, ...asks.map((a) => a.size)), [asks]);

  // Estatísticas de liquidez (estilo Jigsaw Depth & Sales)
  const totalBid = useMemo(() => bids.reduce((a, b) => a + b.size, 0), [bids]);
  const totalAsk = useMemo(() => asks.reduce((a, b) => a + b.size, 0), [asks]);
  const imbalance = totalBid + totalAsk > 0 ? (totalBid / (totalBid + totalAsk)) * 100 : 50;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const DEEP_MIN = 150;

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

  // Máximos de volume executado (barras de calor nas colunas Exec.C/Exec.V)
  const maxExecBuy = useMemo(
    () => Math.max(1, ...prices.map((p) => execByPrice.get(p)?.bidVolume ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [execLevels],
  );
  const maxExecSell = useMemo(
    () => Math.max(1, ...prices.map((p) => execByPrice.get(p)?.askVolume ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [execLevels],
  );

  // ── Auto-follow: mantém a linha do preço atual visível (com trava manual) ──
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const lockedUntil = useRef(0);
  const programmatic = useRef(false);

  const onScroll = (): void => {
    if (!programmatic.current) lockedUntil.current = Date.now() + 6000;
  };

  useEffect(() => {
    if (Date.now() < lockedUntil.current) return;
    const wrap = wrapRef.current?.closest<HTMLElement>('.ftp-panel-body');
    const row = wrapRef.current?.querySelector<HTMLElement>('tr.is-last');
    if (!wrap || !row) return;
    const wrapRect = wrap.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const rowTop = rowRect.top - wrapRect.top + wrap.scrollTop;
    const rowBottom = rowTop + rowRect.height;
    const viewTop = wrap.scrollTop;
    const viewBottom = viewTop + wrap.clientHeight;
    if (rowTop < viewTop + 12 || rowBottom > viewBottom - 12) {
      programmatic.current = true;
      wrap.scrollTo({ top: rowTop - wrap.clientHeight / 2, behavior: 'smooth' });
      setTimeout(() => { programmatic.current = false; }, 700);
    }
  }, [lastPrice]);

  if (prices.length === 0) {
    return (
      <PanelShell title="SuperDOM">
        <p>Book indisponível para a fonte atual.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="SuperDOM / Ladder" className="ftp-superdom">
      <div className="ftp-dom-head">
        <span className={`ftp-dom-pos${posSide ? (posSide === 'long' ? ' is-long' : ' is-short') : ''}`}>
          {posSide ? `${posSide === 'long' ? 'LONG' : 'SHORT'} ${posSize} @ ${avgPrice.toFixed(2)}` : 'FLAT'}
        </span>
        <span className={`ftp-dom-pnl${unrealized >= 0 ? ' is-buy' : ' is-sell'}`}>
          P&L {unrealized.toFixed(2)}
        </span>
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
          <button type="button" className="ftp-dom-flatten" onClick={() => flattenPosition()}>
            ZERAR
          </button>
        )}
      </div>
      <div className="ftp-dom-liquidity" aria-label="Liquidez do book">
        <span>Bid <strong className="is-buy">{totalBid.toLocaleString('pt-BR')}</strong></span>
        <span>Ask <strong className="is-sell">{totalAsk.toLocaleString('pt-BR')}</strong></span>
        <span>Imb <strong className={imbalance >= 50 ? 'is-buy' : 'is-sell'}>{imbalance.toFixed(0)}%</strong></span>
        <span>Spread <strong>{spread.toFixed(2)}</strong></span>
        <div className="ftp-dom-imb" title={`Imbalance de liquidez: ${imbalance.toFixed(0)}% compra`}>
          <div className="ftp-dom-imb-bid" style={{ width: `${imbalance}%` }} />
        </div>
      </div>
      <QueueSection />
      <div ref={wrapRef} onScroll={onScroll}>
        <table>
          <thead>
            <tr>
              <th className="ftp-dom-col-exec" title="Delta executado no preço (compra − venda)">Δ exec</th>
              <th className="ftp-dom-col-trader">Ord.C</th>
              <th className="ftp-dom-col-bid">Qtd.C</th>
              <th className="ftp-dom-col-price">Preço</th>
              <th className="ftp-dom-col-ask">Qtd.V</th>
              <th className="ftp-dom-col-trader">Ord.V</th>
              <th className="ftp-dom-col-exec" title="Volume executado a compra neste preço">Exec.C</th>
              <th className="ftp-dom-col-exec" title="Volume executado a venda neste preço">Exec.V</th>
              <th className="ftp-dom-col-rs">R$</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => {
              const buys = buyOrdersByPrice.get(price) ?? [];
              const sells = sellOrdersByPrice.get(price) ?? [];
              const isBid = price === bestBid;
              const isAsk = price === bestAsk;
              const isLast = price === lastPrice;
              const ref = refFor(price);
              const exec = execByPrice.get(price);
              return (
                <tr key={price} className={`${ref ? ref.cls : ''}${isLast ? ' is-last' : ''}`}>
                  <td className={`ftp-dom-exec${exec && exec.delta > 0 ? ' is-buy' : exec && exec.delta < 0 ? ' is-sell' : ''}`}>
                    {exec && exec.delta !== 0 ? (exec.delta > 0 ? '+' : '') + exec.delta : ''}
                  </td>
                  <td
                    className="ftp-dom-trader"
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
                    className={`ftp-dom-cell${(bidByPrice.get(price) ?? 0) >= DEEP_MIN ? ' is-deep' : ''}`}
                    onClick={(e) => {
                      if (e.shiftKey) buyMarket();
                      else placeOrder('buy', price);
                    }}
                  >
                    <span
                      className="ftp-dom-depth is-bid"
                      style={{ width: `${((bidByPrice.get(price) ?? 0) / maxBid) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="ftp-dom-num">{bidByPrice.get(price) || ''}</span>
                  </td>
                  <td className={`ftp-dom-price${isLast ? ' is-last' : ''}`} title={ref ? ref.title : undefined}>
                    {ref && <span className={`ftp-dom-ref ${ref.cls}`}>{ref.tag}</span>}
                    <span className="ftp-dom-priceVal">{price.toFixed(2)}</span>
                    {isBid && <span className="ftp-dom-tag is-bid">B</span>}
                    {isAsk && <span className="ftp-dom-tag is-ask">A</span>}
                    {isLast && <span className="ftp-dom-tag is-last">L</span>}
                  </td>
                  <td
                    className={`ftp-dom-cell${(askByPrice.get(price) ?? 0) >= DEEP_MIN ? ' is-deep' : ''}`}
                    onClick={(e) => {
                      if (e.shiftKey) sellMarket();
                      else placeOrder('sell', price);
                    }}
                  >
                    <span
                      className="ftp-dom-depth is-ask"
                      style={{ width: `${((askByPrice.get(price) ?? 0) / maxAsk) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="ftp-dom-num">{askByPrice.get(price) || ''}</span>
                  </td>
                  <td
                    className="ftp-dom-trader"
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
                  <td className="ftp-dom-exec-cell is-buy">
                    <span
                      className="ftp-dom-execfill"
                      style={{ width: `${(((exec && exec.bidVolume) || 0) / maxExecBuy) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="ftp-dom-execnum">{exec && exec.bidVolume ? exec.bidVolume : ''}</span>
                  </td>
                  <td className="ftp-dom-exec-cell is-sell">
                    <span
                      className="ftp-dom-execfill"
                      style={{ width: `${(((exec && exec.askVolume) || 0) / maxExecSell) * 100}%` }}
                      aria-hidden="true"
                    />
                    <span className="ftp-dom-execnum">{exec && exec.askVolume ? exec.askVolume : ''}</span>
                  </td>
                  <td className="ftp-dom-rs">{posSide ? estimateAt(price, posSide, avgPrice, posSize).toFixed(0) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
