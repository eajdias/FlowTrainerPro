// core/sessionActions.ts
// Ações compartilhadas da sessão de simulação (usadas pelo DataReplayPanel e pelo modal de setup).
// Sem regra de negócio própria — orquestra kernel + stores existentes.
import { useTrainingSessionStore } from '../store/trainingSessionStore';
import { useMarketStore } from '../store/marketStore';
import { useTrainingStore } from '../store/trainingStore';
import { usePositionStore } from '../store/positionStore';
import { useMissionStore } from '../training/MissionStore';
import { getKernel } from './kernel/SimulationKernel';
import { initTraderBridge } from '../trader/TraderExecutionBridge';

let bridgeReady = false;

export function ensureBridge(): void {
  if (bridgeReady) return;
  bridgeReady = true;
  initTraderBridge();
}

/** Inicia a simulação com a configuração atual da sessão. */
export function startSimulation(): void {
  ensureBridge();
  const session = useTrainingSessionStore.getState();
  const kernel = getKernel();
  kernel.setSpeed(session.speed);
  kernel.setProfile(session.profile);
  kernel.setTrainingFifo(session.trainingFifo);
  kernel.start();
  session.start();
  useMarketStore.getState().setRunning(true);
  const training = useTrainingStore.getState();
  if (training.scenario && training.status !== 'running') training.startSession();
}

/** Pausa a simulação. */
export function pauseSimulation(): void {
  getKernel().pause();
  useTrainingSessionStore.getState().pause();
}

/** Retoma a simulação pausada. */
export function resumeSimulation(): void {
  getKernel().resume();
  useTrainingSessionStore.getState().resume();
}

/** Finaliza a sessão: para o kernel, fecha a avaliação e limpa a missão se aprovada. */
export function finishSimulation(): void {
  getKernel().stop();
  useTrainingSessionStore.getState().finish();
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
}

/** Reseta a sessão (kernel parado, contadores zerados). */
export function resetSimulation(): void {
  getKernel().stop();
  useMarketStore.getState().setRunning(false);
  useTrainingSessionStore.getState().reset();
}

/** Avança a simulação N segundos em chunks assíncronos (não trava a UI). */
export async function advanceSimulation(
  seconds: number,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const kernel = getKernel();
  const total = Math.max(1, Math.round((seconds * 1000) / 150)); // 150ms por tick
  const CHUNK = 80;
  for (let done = 0; done < total; done += CHUNK) {
    const size = Math.min(CHUNK, total - done);
    kernel.advance(size);
    onProgress?.(done + size, total);
    // cede a thread para a UI respirar entre chunks
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
  }
}
