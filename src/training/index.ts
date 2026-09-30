// training/index.ts
// Public API da camada de Treinamento.

export type { TrainingMission, MissionStatus } from './types';
export { listMissions, getMission, getMissionsByCategory, getMissionsByDifficulty } from './MissionLibrary';
export { loadMission, clearMission, restartMission, getCurrentMission, isMissionLoaded, MISSION_EVENTS } from './TrainingMissionEngine';
export { useMissionStore } from './MissionStore';
