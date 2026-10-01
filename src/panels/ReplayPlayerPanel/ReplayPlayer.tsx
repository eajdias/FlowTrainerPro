// panels/ReplayPlayerPanel/ReplayPlayer.tsx
// Player de replay histórico: arquivo CSV -> HistoricalReplayEngine.
// Emite historical:trade:executed; projections atualizam os stores.
import { useEffect, useState } from 'react';
import { getSharedReplayEngine } from '../../core/marketData/replay';
import { initHistoricalMarketDataProjection } from '../../core/marketData/projections';
import { parseCsvTrades } from '../../core/marketData/import';
import { PanelShell } from '../PanelShell/PanelShell';

export function ReplayPlayer() {
  const [engine] = useState(() => getSharedReplayEngine());
  const [, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initHistoricalMarketDataProjection();
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const state = engine.getState();

  const onFile = (file: File | undefined): void => {
    if (!file) return;
    setError(null);
    void file.text().then((text) => {
      const parsed = parseCsvTrades(text);
      if (parsed.trades.length === 0) {
        setError(`Nenhum negócio válido em ${file.name}.`);
        return;
      }
      engine.load(parsed.trades, file.name);
      setTick((t) => t + 1);
    });
  };

  return (
    <PanelShell title="Replay Player">
      <div>
        <label>
          Arquivo CSV
          <input
            type="file"
            accept=".csv"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <div>
        <span>
          {state.status} {state.currentIndex}/{state.totalTrades}
        </span>
        <span>vel {state.speed}x</span>
      </div>
      <div>
        <button type="button" onClick={() => engine.start()} disabled={state.totalTrades === 0}>
          ▶
        </button>
        <button type="button" onClick={() => engine.pause()}>
          ⏸
        </button>
        <button
          type="button"
          onClick={() => {
            engine.step();
            setTick((t) => t + 1);
          }}
        >
          ⏭
        </button>
        <button type="button" onClick={() => engine.unload()}>
          ⏏
        </button>
        <label>
          Velocidade
          <select value={state.speed} onChange={(e) => engine.setSpeed(Number(e.target.value))}>
            {[0.5, 1, 2, 4, 8, 16].map((v) => (
              <option key={v} value={v}>
                {v}x
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p>{error}</p>}
    </PanelShell>
  );
}
