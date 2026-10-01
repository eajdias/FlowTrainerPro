// panels/ReplayToolbar/ReplayToolbar.tsx
// Transporte da sessao: session store + kernel + bridge (init unico).
// Sem regra de negocio — so aciona handlers existentes.
import { useState } from 'react';
import { useTrainingSessionStore, type SimulationSpeed } from '../../store/trainingSessionStore';
import { useMarketStore } from '../../store/marketStore';
import { useTrainingStore } from '../../store/trainingStore';
import { usePositionStore } from '../../store/positionStore';
import { useMissionStore } from '../../training/MissionStore';
import { getKernel, type AggressivenessProfile } from '../../core/kernel/SimulationKernel';
import { initTraderBridge } from '../../trader/TraderExecutionBridge';
import { PanelShell } from '../PanelShell/PanelShell';

const SPEEDS: SimulationSpeed[] = [0.5, 1, 2, 4, 8, 16];
const PROFILES: AggressivenessProfile[] = ['slow', 'normal', 'aggressive'];

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
  const profile = useTrainingSessionStore((s) => s.profile);
  const setProfile = useTrainingSessionStore((s) => s.setProfile);
  const trainingFifo = useTrainingSessionStore((s) => s.trainingFifo);
  const setTrainingFifo = useTrainingSessionStore((s) => s.setTrainingFifo);
  const [started, setStarted] = useState(false);

  const onStart = (): void => {
    ensureBridge();
    getKernel().setSpeed(speed);
    getKernel().setProfile(profile);
    getKernel().setTrainingFifo(trainingFifo);
    getKernel().start();
    setStarted(true);
    start();
    useMarketStore.getState().setRunning(true);
    const training = useTrainingStore.getState();
    if (training.scenario && training.status !== 'running') training.startSession();
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
    useMarketStore.getState().setRunning(false);
    const training = useTrainingStore.getState();
    if (training.status === 'running') {
      const pos = usePositionStore.getState();
      const trades = useTrainingSessionStore.getState().totalTrades;
      training.finishSession(pos.realizedPnL, trades);
      if (useTrainingStore.getState().result?.score.passed) {
        useMissionStore.getState().clear();
      }
    }
  };
  const onReset = (): void => {
    getKernel().stop();
    setStarted(false);
    useMarketStore.getState().setRunning(false);
    reset();
  };
  const onSpeed = (v: SimulationSpeed): void => {
    setSpeed(v);
    getKernel().setSpeed(v);
  };
  const onProfile = (v: AggressivenessProfile): void => {
    setProfile(v);
    getKernel().setProfile(v);
  };
  const onTrainingFifo = (v: boolean): void => {
    setTrainingFifo(v);
    getKernel().setTrainingFifo(v);
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
      <label>
        Mercado
        <select value={profile} onChange={(e) => onProfile(e.target.value as AggressivenessProfile)}>
          {PROFILES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={trainingFifo}
          onChange={(e) => onTrainingFifo(e.target.checked)}
        />
        TRAINING FIFO
      </label>
    </PanelShell>
  );
}
