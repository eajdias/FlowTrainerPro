// tests/replay-recorder-validation.ts
// Sprint 16 — Validação do ReplayRecorder
// Run with: npx --yes tsx tests/replay-recorder-validation.ts

import { eventBus } from '../src/core/engine/EventBus';
import { loadMission, clearMission } from '../src/training/TrainingMissionEngine';
import { initEvaluationEngine } from '../src/training/evaluation/MissionEvaluationEngine';
import { initRulesEngine } from '../src/training/rules/MissionRulesEngine';
import { initFeedbackEngine } from '../src/training/feedback/FeedbackEngine';
import { initReplayRecorder, REPLAY_EVENTS } from '../src/training/replay/ReplayRecorder';
import { useReplayStore } from '../src/training/replay/ReplayStore';
import { useEvaluationStore } from '../src/training/evaluation/EvaluationStore';
import { usePositionStore } from '../src/store/positionStore';
import { useMissionStore } from '../src/training/MissionStore';
import { MATCHING_EVENTS } from '../src/core/kernel/MatchingEngine';
import { SCENARIO_EVENTS } from '../src/core/kernel/MarketScenarioEngine';

let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 16 — REPLAY RECORDER');
console.log('═══════════════════════════════════════════════════');

initEvaluationEngine();
initRulesEngine();
initFeedbackEngine();
initReplayRecorder();

function resetAll() {
  useReplayStore.getState().reset();
  useEvaluationStore.getState().reset();
  usePositionStore.getState().reset();
  useMissionStore.getState().reset();
}

// ─────────────────────────────────────────────────────────────
section('TESTE 1: Gravação inicia com missão');

resetAll();
let recStarted = false;
eventBus.on(REPLAY_EVENTS.STARTED, () => { recStarted = true; });

loadMission('mission_canal_rompimento_comprador');

assert(recStarted, 'Evento replay:started emitido');
assert(useReplayStore.getState().status === 'recording', 'Status = recording');
assert(useReplayStore.getState().startedAt > 0, 'startedAt preenchido');

// ─────────────────────────────────────────────────────────────
section('TESTE 2: Execução do mercado é gravada');

eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
  executionId: 'exec_r1', timestamp: Date.now(), tick: 1,
  aggressorOrderId: 'o1', passiveOrderId: 'o2',
  aggressorPlayerId: 'player_72', passivePlayerId: 'player_85',
  aggressorBrokerId: 72, passiveBrokerId: 85,
  side: 'buy', price: 5069, size: 50, remainingAggressor: 0, remainingPassive: 50,
});

const s2 = useReplayStore.getState();
assert(s2.frameCount >= 1, `Frames gravados: ${s2.frameCount}`);
assert(s2.lastEvent === MATCHING_EVENTS.EXECUTION_CREATED, 'Último evento = execution:created');

// ─────────────────────────────────────────────────────────────
section('TESTE 3: Phase change é gravado');

eventBus.emit(SCENARIO_EVENTS.PHASE_CHANGED, {
  scenarioId: 'test', scenarioName: 'Test', phaseIndex: 1,
  phaseName: 'Fase 2', totalPhases: 4, ticksRemaining: 30,
});

const s3 = useReplayStore.getState();
assert(s3.frames.some((f) => f.eventType === SCENARIO_EVENTS.PHASE_CHANGED), 'Phase change gravado');

// ─────────────────────────────────────────────────────────────
section('TESTE 4: Frame tem estrutura correta');

const frame = s3.frames[0];
assert(frame.timestamp > 0, 'Frame tem timestamp');
assert(frame.tick > 0, 'Frame tem tick');
assert(typeof frame.eventType === 'string', 'Frame tem eventType');
assert(frame.payload !== undefined, 'Frame tem payload');

// ─────────────────────────────────────────────────────────────
section('TESTE 5: Gravação para com clear mission');

let recStopped = false;
eventBus.on(REPLAY_EVENTS.STOPPED, () => { recStopped = true; });

clearMission();

assert(recStopped, 'Evento replay:stopped emitido');
assert(useReplayStore.getState().status === 'stopped', 'Status = stopped');
assert(useReplayStore.getState().stoppedAt > 0, 'stoppedAt preenchido');

// ─────────────────────────────────────────────────────────────
section('TESTE 6: Eventos fora de gravação NÃO são registrados');

const framesBefore = useReplayStore.getState().frameCount;

eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
  executionId: 'exec_r2', timestamp: Date.now(), tick: 2,
  aggressorOrderId: 'o3', passiveOrderId: 'o4',
  aggressorPlayerId: 'player_72', passivePlayerId: 'player_85',
  aggressorBrokerId: 72, passiveBrokerId: 85,
  side: 'sell', price: 5068, size: 30, remainingAggressor: 0, remainingPassive: 70,
});

assert(useReplayStore.getState().frameCount === framesBefore, 'Nenhum frame adicionado quando parado');

// ─────────────────────────────────────────────────────────────
section('TESTE 7: Reset limpa tudo');

useReplayStore.getState().reset();
assert(useReplayStore.getState().status === 'idle', 'Status = idle');
assert(useReplayStore.getState().frames.length === 0, 'Frames limpos');
assert(useReplayStore.getState().frameCount === 0, 'frameCount = 0');

// ─────────────────────────────────────────────────────────────
section('TESTE 8: Múltiplos frames em sequência');

resetAll();
loadMission('mission_tendencia_forte');

for (let i = 0; i < 5; i++) {
  eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
    executionId: `exec_m${i}`, timestamp: Date.now(), tick: i,
    aggressorOrderId: `o${i}`, passiveOrderId: `p${i}`,
    aggressorPlayerId: 'player_72', passivePlayerId: 'player_85',
    aggressorBrokerId: 72, passiveBrokerId: 85,
    side: 'buy', price: 5069 + i * 0.5, size: 20, remainingAggressor: 0, remainingPassive: 80,
  });
}

const s8 = useReplayStore.getState();
assert(s8.frameCount >= 5, `${s8.frameCount} frames gravados (≥5 esperado)`);
assert(s8.currentTick >= 5, `Tick atual: ${s8.currentTick}`);

// Frames em ordem cronológica
const frames = s8.frames;
let ordered = true;
for (let i = 1; i < frames.length; i++) {
  if (frames[i].tick < frames[i-1].tick) { ordered = false; break; }
}
assert(ordered, 'Frames em ordem cronológica');

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 16');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 16 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
process.exit(failed > 0 ? 1 : 0);
