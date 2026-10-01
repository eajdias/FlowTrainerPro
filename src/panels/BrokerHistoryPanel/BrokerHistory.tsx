// panels/BrokerHistoryPanel/BrokerHistory.tsx
// Histórico de corretoras (replay histórico): representa
// historicalBrokerHistoryStore. Somente leitura, sem intenção.
import { useHistoricalBrokerHistoryStore } from '../../store/historicalBrokerHistoryStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function BrokerHistory() {
  const sorted = useHistoricalBrokerHistoryStore((s) => s.sorted);

  if (sorted.length === 0) {
    return (
      <PanelShell title="Histórico de Corretoras">
        <p>Nenhum negócio histórico projetado.</p>
      </PanelShell>
    );
  }

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
          {sorted.map((b) => (
            <tr key={b.brokerId}>
              <td style={{ color: b.color }}>{b.name}</td>
              <td>{b.totalVolume}</td>
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
