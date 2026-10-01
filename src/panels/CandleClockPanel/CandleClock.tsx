// panels/CandleClockPanel/CandleClock.tsx
// v0 honesto: relógio da sessão (ticks + decorrido).
// Contagem regressiva de candle exige o motor 8P — pendente.
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { useBookStore } from '../../store/bookStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function CandleClock() {
  const tickCount = useTrainingSessionStore((s) => s.tickCount);
  const elapsedMs = useTrainingSessionStore((s) => s.elapsedMs);
  const lastPrice = useBookStore((s) => s.lastPrice);

  const seconds = Math.floor(elapsedMs / 1000);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <PanelShell title="Relógio">
      <div>
        <span>Sessão {clock}</span>
        <span>Ticks {tickCount}</span>
        <span>Último {lastPrice > 0 ? lastPrice.toFixed(2) : '--'}</span>
      </div>
      <p>Countdown de candle pendente do motor 8P.</p>
    </PanelShell>
  );
}
