// panels/FeedbackInspectorPanel/FeedbackInspector.tsx
// Técnico: entradas disponíveis p/ feedback. Motor de feedback pendente.
import { useMissionStore } from '../../training/MissionStore';
import { usePositionStore } from '../../store/positionStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function FeedbackInspector() {
  const mission = useMissionStore((s) => s.currentMission);
  const realized = usePositionStore((s) => s.realizedPnL);
  const totalTrades = usePositionStore((s) => s.totalTrades);

  return (
    <PanelShell title="Feedback Inspector">
      <ul>
        <li>missão {mission ? mission.id : '—'}</li>
        <li>trades {totalTrades}</li>
        <li>realizado {realized.toFixed(2)}</li>
      </ul>
      <p>Motor de feedback pendente.</p>
    </PanelShell>
  );
}
