// panels/TimesTradesPanel/TimesAndTrades.tsx
// Times & Trades: HORA/QTD/PRECO/COMPRADOR/VENDEDORA/SLIP.
// So execucoes (tradeStore). Filtros locais de lado e lote minimo.
import { useState } from 'react';
import { useTradeStore } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour12: false });
}

type SideFilter = 'all' | 'BUY' | 'SELL';

export function TimesAndTrades() {
  const trades = useTradeStore((s) => s.trades);
  const [side, setSide] = useState<SideFilter>('all');
  const [minSize, setMinSize] = useState(0);

  const visible = trades.filter(
    (t) => (side === 'all' || t.aggressorSide === side) && t.size >= minSize,
  );

  return (
    <PanelShell title="Times & Trades" className="ftp-tt">
      <div>
        <label>
          Lado
          <select value={side} onChange={(e) => setSide(e.target.value as SideFilter)}>
            <option value="all">todos</option>
            <option value="BUY">compra</option>
            <option value="SELL">venda</option>
          </select>
        </label>
        <label>
          Lote mín
          <input
            type="number"
            min={0}
            value={minSize}
            onChange={(e) => setMinSize(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      </div>
      {visible.length === 0 ? (
        <div>
          <p>Sem execuções no filtro atual.</p>
          {(side !== 'all' || minSize > 0) && (
            <button
              type="button"
              onClick={() => {
                setSide('all');
                setMinSize(0);
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Qtd</th>
            <th>Preço</th>
            <th>Comprador</th>
            <th>Vendedora</th>
            <th>Slip</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((t) => (
            <tr key={t.tradeId} className={t.aggressorSide === 'BUY' ? 'is-buy' : 'is-sell'}>
              <td>{clock(t.timestamp)}</td>
              <td className="ftp-tt-size">{t.size}</td>
              <td>{t.price.toFixed(2)}</td>
              <td style={{ color: t.aggressorBrokerColor }}>{t.aggressorBrokerName}</td>
              <td style={{ color: t.passiveBrokerColor }}>{t.passiveBrokerName}</td>
              <td>{t.slippageTicks > 0 ? `${t.slippageTicks}t` : ''}</td>
            </tr>
          ))}
        </tbody>
        </table>
      )}
    </PanelShell>
  );
}
