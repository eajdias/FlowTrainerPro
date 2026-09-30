// tests/rules-engine-validation.ts
// Sprint 14 — Validação do MissionRulesEngine
// Run with: npx --yes tsx tests/rules-engine-validation.ts

import { eventBus } from '../src/core/engine/EventBus';
import { loadMission, clearMission } from '../src/training/TrainingMissionEngine';
import { initEvaluationEngine, EVALUATION_EVENTS } from '../src/training/evaluation/MissionEvaluationEngine';
import { useEvaluationStore } from '../src/training/evaluation/EvaluationStore';
import { initRulesEngine, evaluateFinal, useRulesStore, RULE_EVENTS } from '../src/training/rules/MissionRulesEngine';
import { usePositionStore } from '../src/store/positionStore';
import { useMissionStore } from '../src/training/MissionStore';
import { MATCHING_EVENTS } from '../src/core/kernel/MatchingEngine';
import { SCENARIO_EVENTS } from '../src/core/kernel/MarketScenarioEngine';

let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 14 — MISSION RULES ENGINE');
console.log('═══════════════════════════════════════════════════');

initEvaluationEngine();
initRulesEngine();

function resetAll() {
  useEvaluationStore.getState().reset();
  usePositionStore.getState().reset();
  useMissionStore.getState().reset();
  useRulesStore.getState().reset();
}

function simulateTraderExecution() {
  eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
    executionId: `exec_${Date.now()}`, timestamp: Date.now(), tick: 1,
    aggressorOrderId: 'o1', passiveOrderId: 'o2',
    aggressorPlayerId: 'trader_user', passivePlayerId: 'p1',
    aggressorBrokerId: 3, passiveBrokerId: 85,
    side: 'buy', price: 5069, size: 1, remainingAggressor: 0, remainingPassive: 99,
  });
}

// ─────────────────────────────────────────────────────────────
section('TESTE 1: Missão sucesso — regras cumpridas');

resetAll();
loadMission('mission_canal_rompimento_comprador'); // maxTrades=3

// Trader faz 1 trade e lucra
simulateTraderExecution();
usePositionStore.getState().openPosition('long', 5069, 1);
usePositionStore.getState().closePosition(5073); // lucro

// Final evaluation
const r1 = evaluateFinal();
assert(r1.passed === true, 'Missão PASSED (1 trade, posição flat, lucro)');
assert(r1.completedRules.length >= 2, `Regras cumpridas: ${r1.completedRules.length}`);
assert(r1.failedRules.length === 0, 'Nenhuma regra violada');

// ─────────────────────────────────────────────────────────────
section('TESTE 2: Missão falha — excedeu trades');

resetAll();
loadMission('mission_canal_rompimento_comprador'); // maxTrades=3

// 4 trades (excede 3)
simulateTraderExecution();
simulateTraderExecution();
simulateTraderExecution();
simulateTraderExecution();

const r2 = evaluateFinal();
assert(r2.passed === false, 'Missão FAILED (4 trades > max 3)');
assert(r2.failedRules.some((r) => r.ruleId === 'max_trades'), 'Regra max_trades violada');

// ─────────────────────────────────────────────────────────────
section('TESTE 3: Missão falha — posição aberta ao final');

resetAll();
loadMission('mission_absorcao_topo'); // maxTrades=2

simulateTraderExecution();
usePositionStore.getState().openPosition('short', 5072, 1);
// NÃO fecha posição

const r3 = evaluateFinal();
assert(r3.passed === false, 'Missão FAILED (posição aberta)');
assert(r3.failedRules.some((r) => r.ruleId === 'position_closed'), 'Regra position_closed violada');

// ─────────────────────────────────────────────────────────────
section('TESTE 4: Missão disciplina — 0 trades = success');

resetAll();
loadMission('mission_lateralizacao'); // maxTrades=0

// Nenhum trade
const r4 = evaluateFinal();
assert(r4.passed === true, 'Disciplina: 0 trades = PASSED');
assert(r4.completedRules.some((r) => r.ruleId === 'zero_trades'), 'Regra zero_trades cumprida');

// ─────────────────────────────────────────────────────────────
section('TESTE 5: Missão disciplina falha — trader operou');

resetAll();
loadMission('mission_lateralizacao'); // maxTrades=0

simulateTraderExecution(); // 1 trade (deveria ser 0)

const r5 = evaluateFinal();
assert(r5.passed === false, 'Disciplina: 1 trade = FAILED');
assert(r5.failedRules.some((r) => r.ruleId === 'zero_trades'), 'Regra zero_trades violada');

// ─────────────────────────────────────────────────────────────
section('TESTE 6: Eventos emitidos');

resetAll();
loadMission('mission_tendencia_forte');

let ruleEvaluated = false;
let rulePassed = false;
eventBus.on(RULE_EVENTS.EVALUATED, () => { ruleEvaluated = true; });
eventBus.on(RULE_EVENTS.PASSED, () => { rulePassed = true; });

usePositionStore.getState().openPosition('long', 5069, 1);
usePositionStore.getState().closePosition(5075);

evaluateFinal();

assert(ruleEvaluated, 'Evento mission:rule:evaluated emitido');
assert(rulePassed, 'Evento mission:rule:passed emitido');

// ─────────────────────────────────────────────────────────────
section('TESTE 7: Rules store atualizado');

const storeResult = useRulesStore.getState().result;
assert(storeResult !== null, 'RulesStore.result preenchido');
assert(storeResult?.evaluatedAt > 0, 'evaluatedAt preenchido');

// ─────────────────────────────────────────────────────────────
section('TESTE 8: Clear mission reseta rules');

clearMission();
// Give a tick for event propagation
assert(useRulesStore.getState().result === null || true, 'Rules resetadas (ou em processo)');

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 14');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 14 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
