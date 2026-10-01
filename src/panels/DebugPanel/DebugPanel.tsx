// panels/DebugPanel/DebugPanel.tsx
// Diagnóstico read-only: contadores dos stores + FlowAnalysis. Sem ações.
import { useEffect, useState } from 'react';
import { useBookStore } from '../../store/bookStore';
import { useTradeStore } from '../../store/tradeStore';
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { useMarketStore } from '../../store/marketStore';
import { getFlowEngine, type FlowAnalysisSnapshot } from '../../core/analytics/flowAnalysis';
import { PanelShell } from '../PanelShell/PanelShell';

export function DebugPanel() {
  const bids = useBookStore((s) => s.bids.length);
  const asks = useBookStore((s) => s.asks.length);
  const execs = useTradeStore((s) => s.totalExecs);
  const ticks = useTrainingSessionStore((s) => s.tickCount);
  const status = useTrainingSessionStore((s) => s.status);
  const marketTicks = useMarketStore((s) => s.tickCount);
  const [flow, setFlow] = useState<FlowAnalysisSnapshot>(() => getFlowEngine().snapshot());
  const [longTasks, setLongTasks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFlow(getFlowEngine().snapshot()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      const obs = new PerformanceObserver(() => setLongTasks((n) => n + 1));
      obs.observe({ entryTypes: ['longtask'] });
      return () => obs.disconnect();
    } catch {
      return;
    }
  }, []);

  return (
    <PanelShell title="Debug">
      <ul>
        <li>book bids {bids} / asks {asks}</li>
        <li>executions {execs}</li>
        <li>session {status} · tick {ticks}</li>
        <li>market ticks {marketTicks}</li>
        <li>
          flow {flow.trained ? 'trained' : 'collecting'} · pressão {flow.pressure.toFixed(2)} (
          {flow.pressureSide}) · conf {flow.confidence.toFixed(2)} {flow.severity}
        </li>
        <li>
          sweeps pend {flow.sweepsPending} · cont {flow.continuations} · abs {flow.absorptions} (+
          {flow.significantAbsorptions} signif)
        </li>
        <li>longtasks {longTasks}</li>
      </ul>
    </PanelShell>
  );
}
