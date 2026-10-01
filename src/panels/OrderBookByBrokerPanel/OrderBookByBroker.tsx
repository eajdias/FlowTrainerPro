// panels/OrderBookByBrokerPanel/OrderBookByBroker.tsx
// Atividade por corretora na sessão: representa marketStore.brokerActivity.
import { useMarketStore } from '../../store/marketStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function OrderBookByBroker() {
  const activity = useMarketStore((s) => s.brokerActivity);

  if (activity.length === 0) {
    return (
      <PanelShell title="Book por Corretora">
        <p>Sem atividade de corretoras na sessão.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Book por Corretora">
      <table>
        <thead>
          <tr>
            <th>Corretora</th>
            <th>Compra</th>
            <th>Venda</th>
            <th>Net</th>
            <th>Trades</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((b) => (
            <tr key={b.brokerId}>
              <td style={{ color: b.color }}>{b.brokerName}</td>
              <td>{b.buyVolume}</td>
              <td>{b.sellVolume}</td>
              <td>{b.netDelta}</td>
              <td>{b.tradeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
