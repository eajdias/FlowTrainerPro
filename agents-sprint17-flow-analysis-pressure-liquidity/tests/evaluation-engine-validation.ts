// tests/evaluation-engine-validation.ts
// Sprint 13 — Validação do MissionEvaluationEngine
// Run with: npx --yes tsx tests/evaluation-engine-validation.ts

import { eventBus } from '../src/core/engine/EventBus';
import { MISSION_EVENTS } from '../src/training/TrainingMissionEngine';
import { SCENARIO_EVENTS } from '../src/core/kernel/MarketScenarioEngine';
import { MATCHING_EVENTS } from '../src/core/kernel/MatchingEngine';
import { initEvaluationEngine, EVALUATION_EVENTS } from '../src/training/evaluation/MissionEvaluationEngine';
import { useEvaluationStore } from '../src/training/evaluation/EvaluationStore';
import { usePositionStore } from '../src/store/positionStore';
import { useMissionStore } from '../src/training/MissionStore';
import { loadMission, clearMission, restartMission } from '../src/training/TrainingMissionEngine';

let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 13 — MISSION EVALUATION ENGINE');
console.log('═══════════════════════════════════════════════════');

// Initialize
initEvaluationEngine();

function resetAll() {
  useEvaluationStore.getState().reset();
  usePositionStore.getState().reset();
  useMissionStore.getState().reset();
}

// ─────────────────────────────────────────────────────────────
section('TESTE 1: Evaluation inicia com missão');

resetAll();
let evalStarted = false;
eventBus.on(EVALUATION_EVENTS.STARTED, () => { evalStarted = true; });

loadMission('mission_canal_rompimento_comprador');

const s1 = useEvaluationStore.getState();
assert(evalStarted, 'Evento evaluation:started emitido');
assert(s1.status === 'running', 'Status = running');
assert(s1.missionId === 'mission_canal_rompimento_comprador', 'missionId correto');
assert(s1.startedAt > 0, 'startedAt preenchido');
assert(s1.traderTrades === 0, 'traderTrades = 0');
assert(s1.result === 'pending', 'result = pending');

// ─────────────────────────────────────────────────────────────
section('TESTE 2: Trade do trader incrementa contador');

let evalUpdated = false;
eventBus.on(EVALUATION_EVENTS.UPDATED, () => { evalUpdated = true; });

// Simulate trader execution
eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
  executionId: 'exec_1',
  timestamp: Date.now(),
  tick: 1,
  aggressorOrderId: 'ord_1',
  passiveOrderId: 'ord_2',
  aggressorPlayerId: 'trader_user',
  passivePlayerId: 'player_85',
  aggressorBrokerId: 3,
  passiveBrokerId: 85,
  side: 'buy',
  price: 5069,
  size: 1,
  remainingAggressor: 0,
  remainingPassive: 99,
});

const s2 = useEvaluationStore.getState();
assert(s2.traderTrades === 1, 'traderTrades = 1 após execução do trader');
assert(evalUpdated, 'Evento evaluation:updated emitido');

// ─────────────────────────────────────────────────────────────
section('TESTE 3: Execução de player NÃO incrementa');

eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
  executionId: 'exec_2',
  timestamp: Date.now(),
  tick: 2,
  aggressorOrderId: 'ord_3',
  passiveOrderId: 'ord_4',
  aggressorPlayerId: 'player_72',
  passivePlayerId: 'player_85',
  aggressorBrokerId: 72,
  passiveBrokerId: 85,
  side: 'buy',
  price: 5069.5,
  size: 50,
  remainingAggressor: 0,
  remainingPassive: 50,
});

assert(useEvaluationStore.getState().traderTrades === 1, 'traderTrades continua 1 (player execution ignorada)');

// ─────────────────────────────────────────────────────────────
section('TESTE 4: Cenário finaliza → evaluation completa (success)');

let evalCompleted = false;
let completedPayload: any = null;
eventBus.on(EVALUATION_EVENTS.COMPLETED, (p: any) => { evalCompleted = true; completedPayload = p; });

// Set positive PnL and flat position
usePositionStore.getState().openPosition('long', 5069, 1);
usePositionStore.getState().closePosition(5072); // +3 pontos

// Trigger scenario finished
eventBus.emit(SCENARIO_EVENTS.SCENARIO_FINISHED, { id: 'canal_rompimento_comprador', name: 'test' });

const s4 = useEvaluationStore.getState();
assert(evalCompleted, 'Evento evaluation:completed emitido');
assert(s4.status === 'completed', 'Status = completed');
assert(s4.result === 'success', 'Result = success (PnL positivo e flat)');
assert(s4.finalPosition === 'flat', 'Final position = flat');
assert(completedPayload?.result === 'success', 'Payload result = success');

// ─────────────────────────────────────────────────────────────
section('TESTE 5: Clear mission → reset evaluation');

resetAll();
loadMission('mission_absorcao_topo');
assert(useEvaluationStore.getState().status === 'running', 'Running após load');

clearMission();
assert(useEvaluationStore.getState().status === 'idle', 'Idle após clear');
assert(useEvaluationStore.getState().missionId === null, 'missionId null após clear');

// ─────────────────────────────────────────────────────────────
section('TESTE 6: Restart mission → restart evaluation');

resetAll();
loadMission('mission_tendencia_forte');

// Add some trades
eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
  executionId: 'exec_r1', timestamp: Date.now(), tick: 1,
  aggressorOrderId: 'o1', passiveOrderId: 'o2',
  aggressorPlayerId: 'trader_user', passivePlayerId: 'p1',
  aggressorBrokerId: 3, passiveBrokerId: 85,
  side: 'buy', price: 5069, size: 1, remainingAggressor: 0, remainingPassive: 99,
});

assert(useEvaluationStore.getState().traderTrades === 1, 'Trade contado');

restartMission();

const s6 = useEvaluationStore.getState();
assert(s6.status === 'running', 'Status = running após restart');
assert(s6.traderTrades === 0, 'traderTrades resetado para 0');

// ─────────────────────────────────────────────────────────────
section('TESTE 7: Missão disciplina (0 trades) → success se 0 trades');

resetAll();
loadMission('mission_lateralizacao'); // maxTrades = 0

// Cenário termina sem trader operar
eventBus.emit(SCENARIO_EVENTS.SCENARIO_FINISHED, { id: 'lateralizacao', name: 'test' });

const s7 = useEvaluationStore.getState();
assert(s7.result === 'success', 'Disciplina: 0 trades + maxTrades=0 = success');

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 13');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 13 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
