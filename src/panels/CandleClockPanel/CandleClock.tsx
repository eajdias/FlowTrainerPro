// panels/CandleClockPanel/CandleClock.tsx
// Relógio da sessão + progresso do candle 8P em formação (range atual / 4.00).
import { useEffect, useState } from 'react';
import { useTrainingSessionStore } from '../../store/trainingSessionStore';
import { useBookStore } from '../../store/bookStore';
import { getCandleEngine, RANGE_SIZE } from '../../core/marketData/candles';
import { PanelShell } from '../PanelShell/PanelShell';

export function CandleClock() {
  const tickCount = useTrainingSessionStore((s) => s.tickCount);
  const elapsedMs = useTrainingSessionStore((s) => s.elapsedMs);
  const lastPrice = useBookStore((s) => s.lastPrice);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor(elapsedMs / 1000);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const snap = getCandleEngine().snapshot();
  const forming = snap.length > 0 && !snap[snap.length - 1]?.closed ? snap[snap.length - 1] : null;
  const progress = forming ? Math.min(1, (forming.high - forming.low) / RANGE_SIZE) : 0;

  return (
    <PanelShell title="Relógio">
      <div>
        <span>Sessão {clock}</span>
        <span>Ticks {tickCount}</span>
        <span>Último {lastPrice > 0 ? lastPrice.toFixed(2) : '--'}</span>
      </div>
      <div>
        <span>Candle 8P {Math.round(progress * 100)}%</span>
        <span>
          {forming ? `${forming.low.toFixed(2)}–${forming.high.toFixed(2)}` : '—'}
        </span>
      </div>
    </PanelShell>
  );
}
