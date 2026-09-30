// tests/feedback-engine-validation.ts
// Sprint 15 — Validação do FeedbackEngine
// Run with: npx --yes tsx tests/feedback-engine-validation.ts

import { eventBus } from '../src/core/engine/EventBus';
import { loadMission, clearMission } from '../src/training/TrainingMissionEngine';
import { initEvaluationEngine } from '../src/training/evaluation/MissionEvaluationEngine';
import { useEvaluationStore } from '../src/training/evaluation/EvaluationStore';
import { initRulesEngine, evaluateFinal, useRulesStore } from '../src/training/rules/MissionRulesEngine';
import { initFeedbackEngine, FEEDBACK_EVENTS } from '../src/training/feedback/FeedbackEngine';
import { useFeedbackStore } from '../src/training/feedback/FeedbackStore';
import { usePositionStore } from '../src/store/positionStore';
import { useMissionStore } from '../src/training/MissionStore';
import { MATCHING_EVENTS } from '../src/core/kernel/MatchingEngine';

let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 15 — FEEDBACK ENGINE');
console.log('═══════════════════════════════════════════════════');

initEvaluationEngine();
initRulesEngine();
initFeedbackEngine();

function resetAll() {
  useEvaluationStore.getState().reset();
  usePositionStore.getState().reset();
  useMissionStore.getState().reset();
  useRulesStore.getState().reset();
  useFeedbackStore.getState().clear();
}

function simulateTraderExec() {
  eventBus.emit(MATCHING_EVENTS.EXECUTION_CREATED, {
    executionId: `e_${Date.now()}`, timestamp: Date.now(), tick: 1,
    aggressorOrderId: 'o1', passiveOrderId: 'o2',
    aggressorPlayerId: 'trader_user', passivePlayerId: 'p1',
    aggressorBrokerId: 3, passiveBrokerId: 85,
    side: 'buy', price: 5069, size: 1, remainingAggressor: 0, remainingPassive: 99,
  });
}

// ─────────────────────────────────────────────────────────────
section('TESTE 1: Feedback gerado após avaliação de regras (SUCCESS)');

resetAll();
loadMission('mission_canal_rompimento_comprador');
simulateTraderExec();
usePositionStore.getState().openPosition('long', 5069, 1);
usePositionStore.getState().closePosition(5073);

let feedbackGenerated = false;
eventBus.on(FEEDBACK_EVENTS.GENERATED, () => { feedbackGenerated = true; });

evaluateFinal();

assert(feedbackGenerated, 'Evento feedback:generated emitido');

const report1 = useFeedbackStore.getState().report;
assert(report1 !== null, 'FeedbackStore.report preenchido');
assert(report1?.status === 'success', 'Status = success');
assert(report1?.messages.length! > 0, `${report1?.messages.length} mensagens geradas`);
assert(report1?.passedRules.length! > 0, `Regras cumpridas: ${report1?.passedRules.length}`);
assert(report1?.failedRules.length === 0, 'Nenhuma regra violada');
assert(report1?.generatedAt! > 0, 'generatedAt preenchido');

// ─────────────────────────────────────────────────────────────
section('TESTE 2: Feedback com regras violadas (FAILED)');

resetAll();
loadMission('mission_canal_rompimento_comprador'); // maxTrades=3
simulateTraderExec();
simulateTraderExec();
simulateTraderExec();
simulateTraderExec(); // 4 trades > 3

evaluateFinal();

const report2 = useFeedbackStore.getState().report;
assert(report2?.status === 'failed', 'Status = failed');
assert(report2?.failedRules.includes('max_trades')!, 'max_trades nas failedRules');
assert(report2?.messages.some((m) => !m.passed && m.ruleId === 'max_trades')!, 'Mensagem de falha presente');

// ─────────────────────────────────────────────────────────────
section('TESTE 3: Mensagens corretas (templates)');

const msgs = report2?.messages ?? [];
const maxTradesMsg = msgs.find((m) => m.ruleId === 'max_trades');
assert(maxTradesMsg?.message === 'Você excedeu o número máximo de operações.', 'Template max_trades correto');

const scenarioMsg = msgs.find((m) => m.ruleId === 'scenario_completed');
assert(scenarioMsg?.passed === true, 'scenario_completed passed');
assert(scenarioMsg?.message === 'Cenário concluído.', 'Template scenario_completed correto');

// ─────────────────────────────────────────────────────────────
section('TESTE 4: Disciplina mission feedback');

resetAll();
loadMission('mission_lateralizacao'); // maxTrades=0

evaluateFinal(); // 0 trades

const report4 = useFeedbackStore.getState().report;
assert(report4?.status === 'success', 'Disciplina: success');
const zeroMsg = report4?.messages.find((m) => m.ruleId === 'zero_trades');
assert(zeroMsg?.passed === true, 'zero_trades passed');
assert(zeroMsg?.message === 'Missão de disciplina cumprida — nenhuma operação realizada.', 'Template zero_trades correto');

// ─────────────────────────────────────────────────────────────
section('TESTE 5: Clear mission limpa feedback');

let feedbackCleared = false;
eventBus.on(FEEDBACK_EVENTS.CLEARED, () => { feedbackCleared = true; });

clearMission();

assert(feedbackCleared, 'Evento feedback:cleared emitido');
assert(useFeedbackStore.getState().hasReport === false, 'hasReport = false');
assert(useFeedbackStore.getState().report === null, 'report = null');

// ─────────────────────────────────────────────────────────────
section('TESTE 6: hasReport indica disponibilidade');

resetAll();
assert(useFeedbackStore.getState().hasReport === false, 'Inicialmente sem report');

loadMission('mission_tendencia_forte');
usePositionStore.getState().openPosition('long', 5069, 1);
usePositionStore.getState().closePosition(5075);
simulateTraderExec();
evaluateFinal();

assert(useFeedbackStore.getState().hasReport === true, 'hasReport = true após avaliação');

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 15');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 15 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
