// panels/DebugPanel/DebugPanel.tsx
// Diagnóstico read-only: contadores dos stores. Sem ações.
import { useBookStore } from '../../store/bookStore';
import { useTradeStore } from '../../store/tradeStore';
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { useMarketStore } from '../../store/marketStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function DebugPanel() {
  const bids = useBookStore((s) => s.bids.length);
  const asks = useBookStore((s) => s.asks.length);
  const execs = useTradeStore((s) => s.totalExecs);
  const ticks = useTrainingSessionStore((s) => s.tickCount);
  const status = useTrainingSessionStore((s) => s.status);
  const marketTicks = useMarketStore((s) => s.tickCount);

  return (
    <PanelShell title="Debug">
      <ul>
        <li>book bids {bids} / asks {asks}</li>
        <li>executions {execs}</li>
        <li>session {status} · tick {ticks}</li>
        <li>market ticks {marketTicks}</li>
      </ul>
    </PanelShell>
  );
}
