// panels/TrainingHUD/TrainingHUD.tsx
// HUD da sessão: status, velocidade, ticks, regime, volume.
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function TrainingHUD() {
  const status = useTrainingSessionStore((s) => s.status);
  const speed = useTrainingSessionStore((s) => s.speed);
  const tickCount = useTrainingSessionStore((s) => s.tickCount);
  const regime = useTrainingSessionStore((s) => s.currentRegime);
  const totalTrades = useTrainingSessionStore((s) => s.totalTrades);
  const totalVolume = useTrainingSessionStore((s) => s.totalVolume);

  return (
    <PanelShell title="Training HUD">
      <div>
        <span>{status.toUpperCase()}</span>
        <span>{speed}x</span>
        <span>tick {tickCount}</span>
        <span>regime {regime ?? '—'}</span>
        <span>trades {totalTrades}</span>
        <span>vol {totalVolume}</span>
      </div>
    </PanelShell>
  );
}
