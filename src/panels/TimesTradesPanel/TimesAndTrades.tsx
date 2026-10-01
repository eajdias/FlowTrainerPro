// panels/TimesTradesPanel/TimesAndTrades.tsx
// Times & Trades: HORA/QTD/PRECO/COMPRADOR/VENDEDORA.
// So execucoes (tradeStore). Agressor direcional apenas.
import { useTradeStore } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour12: false });
}

export function TimesAndTrades() {
  const trades = useTradeStore((s) => s.trades);

  if (trades.length === 0) {
    return (
      <PanelShell title="Times & Trades">
        <p>Sem execuções na sessão.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Times & Trades">
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Qtd</th>
            <th>Preço</th>
            <th>Comprador</th>
            <th>Vendedora</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.tradeId}>
              <td>{clock(t.timestamp)}</td>
              <td>{t.size}</td>
              <td>{t.price.toFixed(2)}</td>
              <td style={{ color: t.aggressorBrokerColor }}>{t.aggressorBrokerName}</td>
              <td style={{ color: t.passiveBrokerColor }}>{t.passiveBrokerName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
