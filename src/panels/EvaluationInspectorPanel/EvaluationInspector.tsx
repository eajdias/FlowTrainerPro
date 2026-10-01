// panels/EvaluationInspectorPanel/EvaluationInspector.tsx
// Técnico: entradas disponíveis p/ avaliação. Motor de avaliação pendente.
import { useMissionStore } from '../../training/MissionStore';
import { useTradeStore } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function EvaluationInspector() {
  const mission = useMissionStore((s) => s.currentMission);
  const execs = useTradeStore((s) => s.totalExecs);

  return (
    <PanelShell title="Evaluation Inspector">
      <ul>
        <li>missão {mission ? mission.id : '—'}</li>
        <li>execuções {execs}</li>
      </ul>
      <p>Motor de avaliação pendente.</p>
    </PanelShell>
  );
}
