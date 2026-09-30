// tests/scenario-library-integration.ts
// Sprint 9 — Validação da integração ScenarioLibrary + SimulationKernel
// Run with: npx --yes tsx tests/scenario-library-integration.ts

import { MarketScenarioEngine, SCENARIO_EVENTS } from '../src/core/kernel/MarketScenarioEngine';
import { eventBus } from '../src/core/engine/EventBus';
import { listScenarios, getScenario } from '../src/core/kernel/scenarios/ScenarioLibrary';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) { console.log(`  ✅ ${message}`); passed++; }
  else { console.log(`  ❌ FALHOU: ${message}`); failed++; }
}

function section(title: string): void {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${title}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 9 — INTEGRAÇÃO SCENARIO LIBRARY');
console.log('═══════════════════════════════════════════════════');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 1: Biblioteca contém 10 cenários');

const all = listScenarios();
assert(all.length === 10, `Biblioteca possui ${all.length} cenários (esperado 10)`);

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 2: Cada cenário possui campos obrigatórios');

for (const sc of all) {
  assert(!!sc.id, `${sc.id}: tem id`);
  assert(!!sc.name, `${sc.id}: tem name`);
  assert(!!sc.description, `${sc.id}: tem description`);
  assert(!!sc.objective, `${sc.id}: tem objective`);
  assert(sc.phases.length > 0, `${sc.id}: tem phases (${sc.phases.length})`);
  assert(sc.durationTicks > 0, `${sc.id}: durationTicks = ${sc.durationTicks}`);
}

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 3: getScenario por ID');

const sc = getScenario('falso_rompimento');
assert(sc !== undefined, 'Cenário "falso_rompimento" encontrado');
assert(sc?.name === 'Falso Rompimento (Armadilha)', `Nome correto: ${sc?.name}`);

const notFound = getScenario('cenario_inexistente');
assert(notFound === undefined, 'Cenário inexistente retorna undefined');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 4: MarketScenarioEngine carrega cenário');

const engine = new MarketScenarioEngine();
const scenario = getScenario('canal_rompimento_comprador')!;

let phaseChangedCount = 0;
let lastPhaseEvent: any = null;
let scenarioStarted = false;
let scenarioFinished = false;

eventBus.on(SCENARIO_EVENTS.PHASE_CHANGED, (ev: any) => { phaseChangedCount++; lastPhaseEvent = ev; });
eventBus.on(SCENARIO_EVENTS.SCENARIO_STARTED, () => { scenarioStarted = true; });
eventBus.on(SCENARIO_EVENTS.SCENARIO_FINISHED, () => { scenarioFinished = true; });

engine.loadScript(scenario.phases, { id: scenario.id, name: scenario.name, loop: false });

assert(engine.getIsScripted() === true, 'Engine está em modo scripted');
assert(engine.getCurrentScenarioId() === 'canal_rompimento_comprador', 'ID do cenário correto');
assert(engine.getCurrentScenarioName() === 'Canal + Rompimento Comprador', 'Nome correto');
assert(engine.getCurrentPhaseIndex() === 0, 'Inicia na fase 0');
assert(engine.getCurrentPhaseName() === 'Acumulação', 'Fase inicial = Acumulação');
assert(engine.getTotalPhases() === 4, 'Total = 4 fases');
assert(scenarioStarted, 'Evento SCENARIO_STARTED emitido');
assert(phaseChangedCount === 1, 'PHASE_CHANGED emitido ao carregar (fase 0)');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 5: Fases transitam automaticamente');

// Fase 1 dura 90 ticks
for (let i = 0; i < 90; i++) { engine.tick(); }

assert(engine.getCurrentPhaseIndex() === 1, 'Após 90 ticks: fase 1 (Testes do Topo)');
assert(engine.getCurrentPhaseName() === 'Testes do Topo', 'Nome da fase 1 correto');
assert(phaseChangedCount === 2, 'PHASE_CHANGED emitido na transição');

// Fase 2 dura 30 ticks
for (let i = 0; i < 30; i++) { engine.tick(); }

assert(engine.getCurrentPhaseIndex() === 2, 'Após +30 ticks: fase 2 (Rompimento)');
assert(engine.getCurrentPhaseName() === 'Rompimento', 'Nome da fase 2 correto');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 6: Cenário finaliza e emite evento');

// Fase 3 = 60 ticks, Fase 4 = 30 ticks → mais 90 ticks
for (let i = 0; i < 90; i++) { engine.tick(); }

// Um tick extra para disparar a finalização
engine.tick();

assert(scenarioFinished, 'Evento SCENARIO_FINISHED emitido');
assert(engine.getIsScripted() === false, 'Volta ao modo procedural após finalizar');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 7: Loop (reinicia ao terminar)');

const engine2 = new MarketScenarioEngine();
const lateralScenario = getScenario('lateralizacao')!;

engine2.loadScript(lateralScenario.phases, { id: lateralScenario.id, name: lateralScenario.name, loop: true });

// Avançar toda a duração + 1 tick extra para processar o loop
for (let i = 0; i < lateralScenario.durationTicks + 1; i++) { engine2.tick(); }

// Deve reiniciar
assert(engine2.getIsScripted() === true, 'Com loop=true, permanece em modo scripted');
assert(engine2.getCurrentPhaseIndex() === 0, 'Reinicia na fase 0');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 8: clearScript retorna ao procedural');

engine2.clearScript();
assert(engine2.getIsScripted() === false, 'clearScript → modo procedural');
assert(engine2.getCurrentScenarioId() === '', 'ID limpo');

// Tick funciona normalmente no modo procedural
const snap = engine2.tick();
assert(snap.regime !== undefined, 'Procedural funciona após clear');

// ──────────────────────────────────────────────────────────────────────────────
section('TESTE 9: Parâmetros do cenário controlam o regime');

const engine3 = new MarketScenarioEngine();
const tendencia = getScenario('tendencia_forte')!;
engine3.loadScript(tendencia.phases, { id: tendencia.id, name: tendencia.name });

const firstSnap = engine3.tick();
assert(firstSnap.regime === 'trend_up', `Regime = trend_up (${firstSnap.regime})`);
assert(firstSnap.directionalBias > 0.4, `Bias comprador: ${firstSnap.directionalBias.toFixed(2)}`);
assert(firstSnap.aggressionRate > 0.4, `Agressão alta: ${firstSnap.aggressionRate.toFixed(2)}`);

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 9');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 9 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
console.log('');
