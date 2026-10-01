// panels/ReplayInspectorPanel/ReplayInspector.tsx
// Técnico: sessão histórica projetada (trades, preço, sessão).
import { useHistoricalTradeStore } from '../../store/historicalTradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function ReplayInspector() {
  const total = useHistoricalTradeStore((s) => s.totalTrades);
  const lastPrice = useHistoricalTradeStore((s) => s.lastPrice);
  const sessionId = useHistoricalTradeStore((s) => s.sessionId);

  return (
    <PanelShell title="Replay Inspector">
      <ul>
        <li>sessão {sessionId ?? '—'}</li>
        <li>trades {total}</li>
        <li>último {lastPrice > 0 ? lastPrice.toFixed(2) : '--'}</li>
      </ul>
    </PanelShell>
  );
}
