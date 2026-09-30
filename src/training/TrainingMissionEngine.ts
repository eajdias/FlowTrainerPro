// training/TrainingMissionEngine.ts
// Controla qual missão está ativa.
// NÃO avalia. NÃO pontua. NÃO calcula progresso.
// Apenas gerencia o ciclo de vida da missão ativa.

import { eventBus } from '../core/engine/EventBus';
import type { TrainingMission } from './types';
import { getMission } from './MissionLibrary';
import { useMissionStore } from './MissionStore';

// ── Events ────────────────────────────────────────────────────────────────────

export const MISSION_EVENTS = {
  STARTED:   'mission:started',
  CLEARED:   'mission:cleared',
  RESTARTED: 'mission:restarted',
  CHANGED:   'mission:changed',
} as const;

// ── Engine ────────────────────────────────────────────────────────────────────

export function loadMission(missionId: string): boolean {
  const mission = getMission(missionId);
  if (!mission) return false;

  useMissionStore.getState().setMission(mission);

  eventBus.emit(MISSION_EVENTS.STARTED, { missionId: mission.id, title: mission.title });
  eventBus.emit(MISSION_EVENTS.CHANGED, { missionId: mission.id, status: 'active' });

  return true;
}

export function clearMission(): void {
  const current = useMissionStore.getState().currentMission;
  useMissionStore.getState().clear();

  if (current) {
    eventBus.emit(MISSION_EVENTS.CLEARED, { missionId: current.id });
    eventBus.emit(MISSION_EVENTS.CHANGED, { missionId: null, status: 'cleared' });
  }
}

export function restartMission(): void {
  const store = useMissionStore.getState();
  const current = store.currentMission;
  if (!current) return;

  store.restart();

  eventBus.emit(MISSION_EVENTS.RESTARTED, { missionId: current.id, restartCount: store.restartCount });
  eventBus.emit(MISSION_EVENTS.CHANGED, { missionId: current.id, status: 'active' });
}

export function getCurrentMission(): TrainingMission | null {
  return useMissionStore.getState().currentMission;
}

export function isMissionLoaded(): boolean {
  return useMissionStore.getState().currentMission !== null;
}
