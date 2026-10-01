// panels/TrainingPanel/TrainingPanel.tsx
// Missão ativa + objetivos: MissionStore + trainingStore.
import { useMissionStore } from '../../training/MissionStore';
import { useTrainingStore } from '../../store/trainingStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function TrainingPanel() {
  const mission = useMissionStore((s) => s.currentMission);
  const status = useMissionStore((s) => s.status);
  const restart = useMissionStore((s) => s.restart);
  const trainingStatus = useTrainingStore((s) => s.status);
  const scenario = useTrainingStore((s) => s.scenario);

  return (
    <PanelShell title="Training">
      <div>
        <span>Missão {mission ? mission.title : '—'}</span>
        <span>Status {status}</span>
        <span>Sessão {trainingStatus}</span>
        <span>Cenário {scenario ? scenario.name : '—'}</span>
      </div>
      {mission && (
        <button type="button" onClick={() => restart()}>
          Reiniciar missão
        </button>
      )}
    </PanelShell>
  );
}
