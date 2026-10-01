// panels/ScenarioInspectorPanel/ScenarioInspector.tsx
// Técnico: regime, cenário, tick.
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { useTrainingStore } from '../../store/trainingStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function ScenarioInspector() {
  const regime = useTrainingSessionStore((s) => s.currentRegime);
  const tick = useTrainingSessionStore((s) => s.tickCount);
  const scenario = useTrainingStore((s) => s.scenario);

  return (
    <PanelShell title="Scenario Inspector">
      <ul>
        <li>regime {regime ?? '—'}</li>
        <li>tick {tick}</li>
        <li>cenário {scenario ? `${scenario.id} — ${scenario.name}` : '—'}</li>
      </ul>
    </PanelShell>
  );
}
