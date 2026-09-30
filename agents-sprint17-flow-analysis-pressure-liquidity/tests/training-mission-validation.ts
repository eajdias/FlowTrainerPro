// tests/training-mission-validation.ts
// Sprint 11 — Validação da camada de Treinamento (Mission Engine)
// Run with: npx --yes tsx tests/training-mission-validation.ts

import { listMissions, getMission, getMissionsByDifficulty, getMissionsByCategory } from '../src/training/MissionLibrary';
import { loadMission, clearMission, restartMission, getCurrentMission, isMissionLoaded, MISSION_EVENTS } from '../src/training/TrainingMissionEngine';
import { useMissionStore } from '../src/training/MissionStore';
import { eventBus } from '../src/core/engine/EventBus';

let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 11 — TRAINING MISSION ENGINE');
console.log('═══════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────
section('TESTE 1: Biblioteca possui 10 missões');
const all = listMissions();
assert(all.length === 10, `${all.length} missões na biblioteca`);

// ─────────────────────────────────────────────────────────────
section('TESTE 2: Campos obrigatórios');
for (const m of all) {
  assert(!!m.id && !!m.title && !!m.scenarioId && !!m.objective, `${m.id}: campos OK`);
  assert(m.rules.length > 0, `${m.id}: tem regras`);
  assert(m.tips.length > 0, `${m.id}: tem dicas`);
}

// ─────────────────────────────────────────────────────────────
section('TESTE 3: Busca por ID');
const m = getMission('mission_falso_rompimento');
assert(m !== undefined, 'Encontrou mission_falso_rompimento');
assert(m?.scenarioId === 'falso_rompimento', 'scenarioId correto');
assert(getMission('inexistente') === undefined, 'Inexistente retorna undefined');

// ─────────────────────────────────────────────────────────────
section('TESTE 4: Filtros');
const beginners = getMissionsByDifficulty('beginner');
assert(beginners.length >= 3, `${beginners.length} missões beginner`);
const reversoes = getMissionsByCategory('Reversão');
assert(reversoes.length >= 2, `${reversoes.length} missões de Reversão`);

// ─────────────────────────────────────────────────────────────
section('TESTE 5: loadMission');
let startedEvent = false;
eventBus.on(MISSION_EVENTS.STARTED, () => { startedEvent = true; });

const result = loadMission('mission_canal_rompimento_comprador');
assert(result === true, 'loadMission retornou true');
assert(startedEvent, 'Evento MISSION_STARTED emitido');
assert(isMissionLoaded(), 'isMissionLoaded = true');

const current = getCurrentMission();
assert(current !== null, 'getCurrentMission não é null');
assert(current?.id === 'mission_canal_rompimento_comprador', 'ID correto');
assert(current?.title === 'Canal + Rompimento Comprador', 'Título correto');

const store = useMissionStore.getState();
assert(store.status === 'active', 'Status = active');
assert(store.startedAt > 0, 'startedAt preenchido');
assert(store.restartCount === 0, 'restartCount = 0');

// ─────────────────────────────────────────────────────────────
section('TESTE 6: restartMission');
let restartedEvent = false;
eventBus.on(MISSION_EVENTS.RESTARTED, () => { restartedEvent = true; });

restartMission();
assert(restartedEvent, 'Evento MISSION_RESTARTED emitido');
assert(useMissionStore.getState().restartCount === 1, 'restartCount = 1');
assert(useMissionStore.getState().status === 'active', 'Status continua active');

// ─────────────────────────────────────────────────────────────
section('TESTE 7: clearMission');
let clearedEvent = false;
eventBus.on(MISSION_EVENTS.CLEARED, () => { clearedEvent = true; });

clearMission();
assert(clearedEvent, 'Evento MISSION_CLEARED emitido');
assert(!isMissionLoaded(), 'isMissionLoaded = false');
assert(getCurrentMission() === null, 'getCurrentMission = null');
assert(useMissionStore.getState().status === 'cleared', 'Status = cleared');

// ─────────────────────────────────────────────────────────────
section('TESTE 8: Trocar de missão');
loadMission('mission_absorcao_topo');
assert(getCurrentMission()?.id === 'mission_absorcao_topo', 'Missão trocada');

loadMission('mission_tendencia_forte');
assert(getCurrentMission()?.id === 'mission_tendencia_forte', 'Missão trocada novamente');

// ─────────────────────────────────────────────────────────────
section('TESTE 9: loadMission inexistente');
const badResult = loadMission('missao_que_nao_existe');
assert(badResult === false, 'loadMission retorna false para ID inexistente');

// ─────────────────────────────────────────────────────────────
section('TESTE 10: Reset');
useMissionStore.getState().reset();
assert(useMissionStore.getState().currentMission === null, 'Reset limpa missão');
assert(useMissionStore.getState().status === 'idle', 'Status = idle após reset');

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL — SPRINT 11');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 SPRINT 11 APROVADA' : '⚠️ FALHAS DETECTADAS'}`);
