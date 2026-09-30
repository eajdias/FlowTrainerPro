// training/MissionStore.ts
// Zustand store para estado da missão ativa.
// Mantém APENAS: currentMission, status, startedAt, restartCount.
// Nenhuma lógica de avaliação, score ou persistência.

import { create } from 'zustand';
import type { TrainingMission, MissionStatus } from './types';

interface MissionState {
  currentMission: TrainingMission | null;
  status:         MissionStatus;
  startedAt:      number;
  restartCount:   number;
}

interface MissionActions {
  setMission: (mission: TrainingMission) => void;
  clear:      () => void;
  restart:    () => void;
  reset:      () => void;
}

export const useMissionStore = create<MissionState & MissionActions>((set, get) => ({
  currentMission: null,
  status:         'idle',
  startedAt:      0,
  restartCount:   0,

  setMission: (mission) => set({
    currentMission: mission,
    status: 'active',
    startedAt: Date.now(),
    restartCount: 0,
  }),

  clear: () => set({
    currentMission: null,
    status: 'cleared',
    startedAt: 0,
    restartCount: 0,
  }),

  restart: () => set({
    status: 'active',
    startedAt: Date.now(),
    restartCount: get().restartCount + 1,
  }),

  reset: () => set({
    currentMission: null,
    status: 'idle',
    startedAt: 0,
    restartCount: 0,
  }),
}));
