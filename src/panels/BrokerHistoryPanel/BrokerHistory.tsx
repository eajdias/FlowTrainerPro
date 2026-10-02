// panels/BrokerHistoryPanel/BrokerHistory.tsx
// Histórico de corretoras: replay histórico (prioridade) ou atividade ao vivo
// da sessão (fallback) — alimentado pelo BrokerFlowAnalyzer. Somente leitura.
import { useHistoricalBrokerHistoryStore } from '../../store/historicalBrokerHistoryStore';
import { useBrokerFlowStore } from '../../store/brokerFlowStore';
import { brokerRegistry } from '../../core/marketIdentity/BrokerRegistry';
import { PanelShell } from '../PanelShell/PanelShell';

function fmt(v: number): string {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)} mi`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)} k`;
  return String(v);
}

export function BrokerHistory() {
  const historical = useHistoricalBrokerHistoryStore((s) => s.sorted);
  const live = useBrokerFlowStore((s) => s.brokers);

  // 1) Replay histórico tem prioridade quando presente.
  if (historical.length > 0) {
    return (
      <PanelShell title="Histórico de Corretoras">
        <table>
          <thead>
            <tr>
              <th>Corretora</th>
              <th>Vol</th>
              <th>Média</th>
              <th>Agressão</th>
              <th>Passivo</th>
            </tr>
          </thead>
          <tbody>
            {historical.map((b) => (
              <tr key={b.brokerId}>
                <td style={{ color: b.color }}>{b.name}</td>
                <td>{fmt(b.totalVolume)}</td>
                <td>{b.avgPrice.toFixed(2)}</td>
                <td>{b.aggressionNet}</td>
                <td>{b.passiveNet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelShell>
    );
  }

  // 2) Fallback: atividade ao vivo da sessão (BrokerFlowAnalyzer).
  if (live.length === 0) {
    return (
      <PanelShell title="Histórico de Corretoras">
        <p>Sem atividade de corretoras na sessão.</p>
      </PanelShell>
    );
  }

  const rows = [...live]
    .sort(
      (a, b) =>
        b.totalBuyVolume + b.totalSellVolume - (a.totalBuyVolume + a.totalSellVolume),
    )
    .slice(0, 16);

  return (
    <PanelShell title="Histórico de Corretoras">
      <table>
        <thead>
          <tr>
            <th>Corretora</th>
            <th>Compra</th>
            <th>Venda</th>
            <th>Net</th>
            <th>Ativ.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const broker = b.brokerCode !== null ? brokerRegistry.getBroker(b.brokerCode) : undefined;
            const net = b.aggressiveNetVolume;
            return (
              <tr key={b.brokerKey} className={net >= 0 ? 'is-buy' : 'is-sell'}>
                <td style={{ color: broker?.primaryColor ?? 'var(--ftp-text-secondary)' }}>{b.brokerName}</td>
                <td>{fmt(b.totalBuyVolume)}</td>
                <td>{fmt(b.totalSellVolume)}</td>
                <td className={net >= 0 ? 'ftp-net-buy' : 'ftp-net-sell'}>
                  {net >= 0 ? '+' : ''}{fmt(net)}
                </td>
                <td>{Math.round(b.activityRate * 100)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PanelShell>
  );
}
