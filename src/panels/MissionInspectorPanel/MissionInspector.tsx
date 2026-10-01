// panels/MissionInspectorPanel/MissionInspector.tsx
// Técnico: missão ativa, status, restarts.
import { useMissionStore } from '../../training/MissionStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function MissionInspector() {
  const mission = useMissionStore((s) => s.currentMission);
  const status = useMissionStore((s) => s.status);
  const restarts = useMissionStore((s) => s.restartCount);

  return (
    <PanelShell title="Mission Inspector">
      <ul>
        <li>missão {mission ? `${mission.id} — ${mission.title}` : '—'}</li>
        <li>status {status}</li>
        <li>restarts {restarts}</li>
      </ul>
    </PanelShell>
  );
}
