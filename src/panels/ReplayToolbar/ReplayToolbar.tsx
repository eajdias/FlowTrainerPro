// panels/ReplayToolbar/ReplayToolbar.tsx
// Transporte da sessao: session store + kernel + bridge (init unico).
// Sem regra de negocio — so aciona handlers existentes.
import { useState } from 'react';
import { useTrainingSessionStore, type SimulationSpeed } from '../../store/trainingSessionStore';
import { getKernel } from '../../core/kernel/SimulationKernel';
import { initTraderBridge } from '../../trader/TraderExecutionBridge';
import { PanelShell } from '../PanelShell/PanelShell';

const SPEEDS: SimulationSpeed[] = [0.5, 1, 2, 4, 8, 16];

let bridgeReady = false;
function ensureBridge(): void {
  if (bridgeReady) return;
  bridgeReady = true;
  initTraderBridge();
}

export function ReplayToolbar() {
  const status = useTrainingSessionStore((s) => s.status);
  const speed = useTrainingSessionStore((s) => s.speed);
  const start = useTrainingSessionStore((s) => s.start);
  const pause = useTrainingSessionStore((s) => s.pause);
  const resume = useTrainingSessionStore((s) => s.resume);
  const finish = useTrainingSessionStore((s) => s.finish);
  const reset = useTrainingSessionStore((s) => s.reset);
  const setSpeed = useTrainingSessionStore((s) => s.setSpeed);
  const [started, setStarted] = useState(false);

  const onStart = (): void => {
    ensureBridge();
    getKernel().setSpeed(speed);
    getKernel().start();
    setStarted(true);
    start();
  };
  const onPause = (): void => {
    getKernel().pause();
    pause();
  };
  const onResume = (): void => {
    getKernel().resume();
    resume();
  };
  const onFinish = (): void => {
    getKernel().stop();
    finish();
  };
  const onReset = (): void => {
    getKernel().stop();
    setStarted(false);
    reset();
  };
  const onSpeed = (v: SimulationSpeed): void => {
    setSpeed(v);
    getKernel().setSpeed(v);
  };

  return (
    <PanelShell title="Replay">
      <span>Status {status}</span>
      {!started ? (
        <button type="button" onClick={onStart}>
          ▶ Iniciar
        </button>
      ) : (
        <>
          {status === 'running' ? (
            <button type="button" onClick={onPause}>
              ⏸ Pausar
            </button>
          ) : (
            <button type="button" onClick={onResume}>
              ▶ Retomar
            </button>
          )}
          <button type="button" onClick={onFinish}>
            ⏹ Finalizar
          </button>
          <button type="button" onClick={onReset}>
            ↺ Reset
          </button>
        </>
      )}
      <label>
        Velocidade
        <select value={speed} onChange={(e) => onSpeed(Number(e.target.value) as SimulationSpeed)}>
          {SPEEDS.map((v) => (
            <option key={v} value={v}>
              {v}x
            </option>
          ))}
        </select>
      </label>
    </PanelShell>
  );
}
