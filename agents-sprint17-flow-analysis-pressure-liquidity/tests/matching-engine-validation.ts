// tests/matching-engine-validation.ts
// Sprint 2 Validation — Automated tests for MatchingEngine + OrderBookEngine
// Run with: npx tsx tests/matching-engine-validation.ts

import { OrderBookEngine } from '../src/core/kernel/OrderBookEngine';
import { MatchingEngine } from '../src/core/kernel/MatchingEngine';
import { v4 as uuidv4 } from 'uuid';
import type { Order } from '../src/core/orderflow/models/Order';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createOrder(side: 'buy' | 'sell', price: number, size: number, type: 'limit' | 'market' = 'limit'): Order {
  return {
    id: uuidv4(),
    playerId: 'test_player',
    brokerId: 85, // BTG
    type,
    side,
    price: type === 'market' ? 0 : price,
    size,
    filledSize: 0,
    remainingSize: size,
    status: 'pending',
    timestamp: Date.now(),
    tick: 0,
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FALHOU: ${message}`);
    failed++;
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════');
console.log('  SPRINT 2 — VALIDAÇÃO DO MATCHING ENGINE');
console.log('═══════════════════════════════════════════════════\n');

const book = new OrderBookEngine();
const matching = new MatchingEngine(book);

// Populate initial book
console.log('📋 SETUP: Populando book inicial...\n');

// ASKS (sells)
const ask1 = createOrder('sell', 5071.00, 50);
const ask2 = createOrder('sell', 5071.50, 80);
const ask3 = createOrder('sell', 5072.00, 100);
book.addOrder(ask1, Date.now());
book.addOrder(ask2, Date.now());
book.addOrder(ask3, Date.now());

// BIDS (buys)
const bid1 = createOrder('buy', 5070.50, 120);
const bid2 = createOrder('buy', 5070.00, 150);
const bid3 = createOrder('buy', 5069.50, 200);
book.addOrder(bid1, Date.now());
book.addOrder(bid2, Date.now());
book.addOrder(bid3, Date.now());

console.log('  Book inicial:');
console.log('  ASKS: 5072.00(100) | 5071.50(80) | 5071.00(50)');
console.log('  BIDS: 5070.50(120) | 5070.00(150) | 5069.50(200)');
console.log('  Best Ask: 5071.00 | Best Bid: 5070.50 | Spread: 0.50\n');

// Verify setup
assert(book.getBestAsk() === 5071.00, 'Best Ask = 5071.00');
assert(book.getBestBid() === 5070.50, 'Best Bid = 5070.50');
assert(book.getLevel(5071.00)?.totalAsk === 50, 'Ask @ 5071.00 = 50 contratos');
assert(book.getLevel(5070.50)?.totalBid === 120, 'Bid @ 5070.50 = 120 contratos');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE 1: Compra a mercado de 30 contratos');
console.log('  Expectativa: consome parte do melhor ask (5071.00)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const marketBuy30 = createOrder('buy', 0, 30, 'market');
const execs1 = matching.submit(marketBuy30, 1, Date.now());

assert(execs1.length === 1, '1 execução gerada');
assert(execs1[0].price === 5071.00, 'Execução @ 5071.00');
assert(execs1[0].size === 30, 'Tamanho executado = 30');
assert(execs1[0].side === 'buy', 'Lado agressor = buy');
assert(book.getLevel(5071.00)?.totalAsk === 20, 'Ask restante @ 5071.00 = 20 (50-30)');
assert(book.getBestAsk() === 5071.00, 'Best Ask permanece 5071.00');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE 2: Compra a mercado de 200 contratos');
console.log('  Expectativa: consome múltiplos níveis (20+80+100)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const marketBuy200 = createOrder('buy', 0, 200, 'market');
const execs2 = matching.submit(marketBuy200, 2, Date.now());

console.log(`  Execuções geradas: ${execs2.length}`);
execs2.forEach((e, i) => console.log(`    Exec ${i+1}: ${e.size} @ ${e.price}`));

// Restava 20 @ 5071.00, 80 @ 5071.50, 100 @ 5072.00 = 200 total
// 200 contratos devem consumir TUDO
assert(execs2.length >= 2, 'Múltiplas execuções geradas (2+)');
assert(execs2[0].price === 5071.00, '1ª execução @ 5071.00 (restavam 20)');
assert(execs2[0].size === 20, '1ª execução = 20 contratos');

if (execs2.length >= 2) {
  assert(execs2[1].price === 5071.50, '2ª execução @ 5071.50');
  assert(execs2[1].size === 80, '2ª execução = 80 contratos');
}
if (execs2.length >= 3) {
  assert(execs2[2].price === 5072.00, '3ª execução @ 5072.00');
  assert(execs2[2].size === 100, '3ª execução = 100 contratos');
}

// Last price should be the last execution price
const lastExecPrice = execs2[execs2.length - 1]?.price ?? 0;
assert(lastExecPrice === 5072.00, 'Last Price = 5072.00 (última execução)');

// Book asks should be empty now
assert(book.getBestAsk() === 0, 'Best Ask = 0 (book ask vazio)');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE 3: Venda a mercado de 100 contratos');
console.log('  Expectativa: consome bid @ 5070.50 (120 disponíveis)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const marketSell100 = createOrder('sell', 0, 100, 'market');
const execs3 = matching.submit(marketSell100, 3, Date.now());

assert(execs3.length === 1, '1 execução gerada');
assert(execs3[0].price === 5070.50, 'Execução @ 5070.50 (best bid)');
assert(execs3[0].size === 100, 'Tamanho = 100');
assert(execs3[0].side === 'sell', 'Lado agressor = sell');
assert(book.getLevel(5070.50)?.totalBid === 20, 'Bid restante @ 5070.50 = 20 (120-100)');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE 4: Cancelamento de ordens');
console.log('  Expectativa: book atualiza imediatamente');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Cancel the remaining bid at 5070.50 (20 left)
const cancelResult = book.removeOrder(bid1.id, 5070.50, 'buy');
assert(cancelResult === true, 'Cancelamento retornou true');

// After cancel, best bid should be 5070.00
assert(book.getBestBid() === 5070.00, 'Best Bid = 5070.00 (após cancelamento do 5070.50)');
assert(book.getLevel(5070.50)?.totalBid === 0 || !book.getLevel(5070.50), 'Nível 5070.50 vazio ou removido');

// Cancel non-existent order
const cancelFail = book.removeOrder('fake-id', 5070.00, 'buy');
assert(cancelFail === false, 'Cancelamento de ordem inexistente retorna false');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE 5: Adição de novas ordens limitadas (FIFO)');
console.log('  Expectativa: respeitam prioridade');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Add two sell orders at same price — first should have priority
const newAsk1 = createOrder('sell', 5073.00, 60);
const newAsk2 = createOrder('sell', 5073.00, 40);
book.addOrder(newAsk1, Date.now());
book.addOrder(newAsk2, Date.now() + 1); // 1ms later

const level5073 = book.getLevel(5073.00);
assert(level5073 !== undefined, 'Nível 5073.00 existe');
assert(level5073!.totalAsk === 100, 'Total ask @ 5073.00 = 100 (60+40)');
assert(level5073!.askQueue.length === 2, '2 ordens na fila');
assert(level5073!.askQueue[0].order.id === newAsk1.id, 'Primeira ordem = newAsk1 (FIFO)');
assert(level5073!.askQueue[1].order.id === newAsk2.id, 'Segunda ordem = newAsk2 (FIFO)');

// Now buy 70 — should fill all of newAsk1 (60) and partial of newAsk2 (10)
const marketBuy70 = createOrder('buy', 0, 70, 'market');
const execs5 = matching.submit(marketBuy70, 5, Date.now());

assert(execs5.length === 2, '2 execuções (60 + 10)');
assert(execs5[0].size === 60, '1ª execução = 60 (newAsk1 completa)');
assert(execs5[1].size === 10, '2ª execução = 10 (newAsk2 parcial)');

const level5073After = book.getLevel(5073.00);
assert(level5073After!.totalAsk === 30, 'Restam 30 @ 5073.00 (40-10)');
assert(level5073After!.askQueue.length === 1, 'Apenas 1 ordem na fila (newAsk1 removida)');
assert(level5073After!.askQueue[0].order.id === newAsk2.id, 'Ordem restante = newAsk2');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  TESTE EXTRA: Book vazio — sistema estável');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Try to buy when no asks exist (asks are empty after test 2)
const emptyBook = new OrderBookEngine();
const emptyMatching = new MatchingEngine(emptyBook);
// Only add bids, no asks
emptyBook.addOrder(createOrder('buy', 5060.00, 100), Date.now());

const marketBuyEmpty = createOrder('buy', 0, 50, 'market');
const execsEmpty = emptyMatching.submit(marketBuyEmpty, 10, Date.now());

assert(execsEmpty.length === 0, 'Zero execuções quando book ask está vazio');
assert(emptyBook.getBestBid() === 5060.00, 'Best Bid permanece intacto');
// System should not crash

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 MATCHING ENGINE APROVADO PARA SPRINT 3' : '⚠️ FALHAS DETECTADAS — corrigir antes de prosseguir'}`);
console.log('');
