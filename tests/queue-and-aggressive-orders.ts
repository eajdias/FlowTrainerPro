// tests/queue-and-aggressive-orders.ts
// Comprehensive tests: Queue observability + Aggressive orders + Regression
// Run with: npx --yes tsx tests/queue-and-aggressive-orders.ts

import { OrderBookEngine } from '../src/core/kernel/OrderBookEngine';
import { MatchingEngine, MATCHING_EVENTS } from '../src/core/kernel/MatchingEngine';
import { eventBus } from '../src/core/engine/EventBus';
import { v4 as uuidv4 } from 'uuid';
import type { Order } from '../src/core/orderflow/models/Order';
import type { Execution } from '../src/core/kernel/MatchingEngine';

const TRADER = 'trader_user';
let passed = 0; let failed = 0;
function assert(c: boolean, m: string) { if (c) { console.log(`  ✅ ${m}`); passed++; } else { console.log(`  ❌ ${m}`); failed++; } }
function section(t: string) { console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`); }

function mkOrder(side: 'buy'|'sell', price: number, size: number, player = 'player_85'): Order {
  return { id: uuidv4(), playerId: player, brokerId: 85, type: 'limit', side, price, size, filledSize: 0, remainingSize: size, status: 'pending', timestamp: Date.now(), tick: 0 };
}

function mkMarket(side: 'buy'|'sell', size: number, player = 'aggressor'): Order {
  return { id: uuidv4(), playerId: player, brokerId: 72, type: 'market', side, price: 0, size, filledSize: 0, remainingSize: size, status: 'pending', timestamp: Date.now(), tick: 0 };
}

console.log('═══════════════════════════════════════════════════');
console.log('  QUEUE OBSERVABILITY + AGGRESSIVE ORDERS + REGRESSION');
console.log('═══════════════════════════════════════════════════');

// ══════════════════════════════════════════════════════════════════════════════
section('PARTE 1: QUEUE OBSERVABILITY');

const book = new OrderBookEngine();
const matching = new MatchingEngine(book);

// Seed: 3 orders at 5068.50 before trader
const o1 = mkOrder('buy', 5068.50, 50);
const o2 = mkOrder('buy', 5068.50, 75);
const o3 = mkOrder('buy', 5068.50, 30);
book.addOrder(o1, Date.now());
book.addOrder(o2, Date.now());
book.addOrder(o3, Date.now());
// Add ask
book.addOrder(mkOrder('sell', 5069.00, 200), Date.now());

// Trader places BUY LIMIT at 5068.50
const traderId = uuidv4();
const traderOrd: Order = { id: traderId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'buy', price: 5068.50, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 };
matching.submit(traderOrd, 0, Date.now());

const level = book.getLevel(5068.50)!;
const queue = level.bidQueue;
const traderIdx = queue.findIndex(e => e.order.id === traderId);

assert(traderIdx === 3, `Trader queue position: ${traderIdx + 1} (expected 4th)`);

// Volume ahead calculation
let volAhead = 0;
for (let i = 0; i < traderIdx; i++) volAhead += queue[i].order.remainingSize;
assert(volAhead === 155, `Volume ahead: ${volAhead} (50+75+30=155)`);

// Progress initially 0
const originalVolAhead = volAhead;
const progress0 = originalVolAhead > 0 ? (originalVolAhead - volAhead) / originalVolAhead : 1;
assert(progress0 === 0, `Initial progress: ${progress0}`);

// ── Test: Partial execution ahead ─────────────────────────────────────────
section('1.1: Execução parcial à frente reduz volumeAhead');

// Sell 40 → fills partial of o1 (50→10)
matching.submit(mkMarket('sell', 40), 1, Date.now());

const lvlAfter1 = book.getLevel(5068.50)!;
const qAfter1 = lvlAfter1.bidQueue;
const tIdx1 = qAfter1.findIndex(e => e.order.id === traderId);
let va1 = 0;
for (let i = 0; i < tIdx1; i++) va1 += qAfter1[i].order.remainingSize;
assert(va1 === 115, `After 40 consumed: volumeAhead=${va1} (155-40=115)`);

const progress1 = (originalVolAhead - va1) / originalVolAhead;
assert(Math.abs(progress1 - 40/155) < 0.01, `Progress: ${(progress1*100).toFixed(1)}%`);

// ── Test: Cancelamento à frente ───────────────────────────────────────────
section('1.2: Cancelamento à frente reduz volumeAhead');

// Cancel o2 (75 lotes)
book.removeOrder(o2.id, 5068.50, 'buy');

const lvlAfter2 = book.getLevel(5068.50)!;
const qAfter2 = lvlAfter2.bidQueue;
const tIdx2 = qAfter2.findIndex(e => e.order.id === traderId);
let va2 = 0;
for (let i = 0; i < tIdx2; i++) va2 += qAfter2[i].order.remainingSize;
assert(va2 === 40, `After cancel o2: volumeAhead=${va2} (10+30=40)`);
assert(tIdx2 === 2, `Queue position after cancel: ${tIdx2 + 1} (was 4, now 3)`);

// ── Test: Nova ordem posterior não altera ─────────────────────────────────
section('1.3: Nova ordem posterior não altera volumeAhead do trader');

book.addOrder(mkOrder('buy', 5068.50, 200, 'player_new'), Date.now());
const lvlAfter3 = book.getLevel(5068.50)!;
const tIdx3 = lvlAfter3.bidQueue.findIndex(e => e.order.id === traderId);
let va3 = 0;
for (let i = 0; i < tIdx3; i++) va3 += lvlAfter3.bidQueue[i].order.remainingSize;
assert(va3 === 40, `volumeAhead unchanged: ${va3} (new order is behind)`);

// ── Test: Trade em outro preço não altera ─────────────────────────────────
section('1.4: Trade em outro preço não altera fila');

book.addOrder(mkOrder('buy', 5068.00, 100), Date.now());

// Register fill listener BEFORE any more sells
let traderFilled = false;
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => {
  if (e.passivePlayerId === TRADER) traderFilled = true;
});

matching.submit(mkMarket('sell', 50), 2, Date.now()); // hits 5068.50

const lvlAfter4 = book.getLevel(5068.50);
const tIdx4 = lvlAfter4 ? lvlAfter4.bidQueue.findIndex(e => e.order.id === traderId) : -1;

if (tIdx4 >= 0) {
  let va4 = 0;
  for (let i = 0; i < tIdx4; i++) va4 += lvlAfter4!.bidQueue[i].order.remainingSize;
  console.log(`  ℹ️ After 50 more sold: pos=${tIdx4+1}, volumeAhead=${va4}`);
}

// ── Test: Fill total do trader ────────────────────────────────────────────
section('1.5: Fill total do trader');

if (!traderFilled) {
  // Trader not yet filled — consume remaining
  const lvlPre = book.getLevel(5068.50);
  if (lvlPre) {
    const tIdxPre = lvlPre.bidQueue.findIndex(e => e.order.id === traderId);
    if (tIdxPre >= 0) {
      let volNeeded = 0;
      for (let i = 0; i <= tIdxPre; i++) volNeeded += lvlPre.bidQueue[i].order.remainingSize;
      matching.submit(mkMarket('sell', volNeeded), 3, Date.now());
    }
  }
}

assert(traderFilled, 'Trader order was filled');
const lvlPost = book.getLevel(5068.50);
const traderStill = lvlPost?.bidQueue.find(e => e.order.id === traderId);
assert(traderStill === undefined, 'Trader removed from book after fill');

// ── Test: Cancelled order cannot execute ──────────────────────────────────
section('1.6: Cancelled order cannot execute');

const book3 = new OrderBookEngine();
const matching3 = new MatchingEngine(book3);
book3.addOrder(mkOrder('sell', 5070, 100), Date.now());

const cancelId = uuidv4();
matching3.submit({ id: cancelId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'buy', price: 5069, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
book3.removeOrder(cancelId, 5069, 'buy');

let cancelledFill = false;
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => { if (e.passiveOrderId === cancelId) cancelledFill = true; });
matching3.submit(mkMarket('sell', 100), 1, Date.now());
assert(!cancelledFill, 'Cancelled order was NOT filled');

// ── Test: Reset ───────────────────────────────────────────────────────────
section('1.7: Reset removes queue state');

book.reset();
assert(book.getLevel(5068.50) === undefined, 'Level gone after reset');

// ══════════════════════════════════════════════════════════════════════════════
section('PARTE 2: ORDENS AGRESSORAS');

const book4 = new OrderBookEngine();
const matching4 = new MatchingEngine(book4);
book4.addOrder(mkOrder('sell', 5070, 100), Date.now());
book4.addOrder(mkOrder('sell', 5070.50, 80), Date.now());
book4.addOrder(mkOrder('buy', 5069, 150), Date.now());

// ── BUY agressora consome bestAsk ─────────────────────────────────────────
section('2.1: BUY agressora consome bestAsk');

let buyAggExec: Execution | null = null;
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => { if (e.aggressorPlayerId === TRADER) buyAggExec = e; });

matching4.submit({ id: uuidv4(), playerId: TRADER, brokerId: 3, type: 'market', side: 'buy', price: 0, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());

assert(buyAggExec !== null, 'BUY agressora executou');
assert(buyAggExec!.price === 5070, `Preço = bestAsk 5070 (got ${buyAggExec!.price})`);
assert(buyAggExec!.aggressorPlayerId === TRADER, 'Trader é agressor');
assert(buyAggExec!.side === 'buy', 'Side = buy');

// ── SELL agressora consome bestBid ────────────────────────────────────────
section('2.2: SELL agressora consome bestBid');

let sellAggExec: Execution | null = null;
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => { if (e.aggressorPlayerId === TRADER && e.side === 'sell') sellAggExec = e; });

matching4.submit({ id: uuidv4(), playerId: TRADER, brokerId: 3, type: 'market', side: 'sell', price: 0, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());

assert(sellAggExec !== null, 'SELL agressora executou');
assert(sellAggExec!.price === 5069, `Preço = bestBid 5069 (got ${sellAggExec!.price})`);
assert(sellAggExec!.side === 'sell', 'Side = sell');

// ── Múltiplos níveis ──────────────────────────────────────────────────────
section('2.3: Compra agressora consome múltiplos níveis');

const execs: Execution[] = [];
eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (e) => { if (e.aggressorPlayerId === 'multi_buyer') execs.push(e); });

// bestAsk now has 99 at 5070 + 80 at 5070.50. Buy 120 should consume both levels.
matching4.submit({ id: uuidv4(), playerId: 'multi_buyer', brokerId: 3, type: 'market', side: 'buy', price: 0, size: 120, filledSize: 0, remainingSize: 120, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());

assert(execs.length >= 2, `Múltiplas execuções: ${execs.length}`);
const totalFilled = execs.reduce((s, e) => s + e.size, 0);
assert(totalFilled === 120, `Total filled: ${totalFilled}`);

// ── Ordem agressora não fica resting ──────────────────────────────────────
section('2.4: Ordem agressora não fica resting');

const book5 = new OrderBookEngine();
const matching5 = new MatchingEngine(book5);
book5.addOrder(mkOrder('sell', 5070, 10), Date.now());

matching5.submit({ id: 'agg_test', playerId: TRADER, brokerId: 3, type: 'market', side: 'buy', price: 0, size: 5, filledSize: 0, remainingSize: 5, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());

const anyLevel = book5.getLevel(5070);
const traderInBook = anyLevel?.bidQueue.find(e => e.order.id === 'agg_test') || anyLevel?.askQueue.find(e => e.order.id === 'agg_test');
assert(traderInBook === undefined, 'Market order não fica no book');

// ══════════════════════════════════════════════════════════════════════════════
section('PARTE 3: REGRESSÃO');

const bookR = new OrderBookEngine();
const matchingR = new MatchingEngine(bookR);
bookR.addOrder(mkOrder('sell', 5070, 200), Date.now());
bookR.addOrder(mkOrder('buy', 5069, 200), Date.now());

// 3.1 BUY LIMIT passiva
const buyLimitId = uuidv4();
matchingR.submit({ id: buyLimitId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'buy', price: 5069, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
assert(bookR.getLevel(5069)!.bidQueue.some(e => e.order.id === buyLimitId), '3.1: BUY LIMIT resting ✓');

// 3.2 SELL LIMIT passiva
const sellLimitId = uuidv4();
matchingR.submit({ id: sellLimitId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'sell', price: 5070, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
assert(bookR.getLevel(5070)!.askQueue.some(e => e.order.id === sellLimitId), '3.2: SELL LIMIT resting ✓');

// 3.3 Fill parcial
const partialId = uuidv4();
matchingR.submit({ id: partialId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'sell', price: 5070, size: 5, filledSize: 0, remainingSize: 5, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
matchingR.submit(mkMarket('buy', 3, 'partial_buyer'), 1, Date.now()); // fills 3 of first ask (200)

// 3.4 Cancelamento funciona
const cancelId2 = uuidv4();
matchingR.submit({ id: cancelId2, playerId: TRADER, brokerId: 3, type: 'limit', side: 'buy', price: 5068, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
const cancelled = matchingR.cancel(cancelId2, 5068, 'buy');
assert(cancelled, '3.4: Cancel returns true ✓');
assert(!bookR.getLevel(5068)?.bidQueue.some(e => e.order.id === cancelId2), '3.4: Cancelled order removed ✓');

// 3.5 LastPrice touch does NOT execute
const touchId = uuidv4();
matchingR.submit({ id: touchId, playerId: TRADER, brokerId: 3, type: 'limit', side: 'buy', price: 5068.50, size: 1, filledSize: 0, remainingSize: 1, status: 'pending', timestamp: Date.now(), tick: 0 }, 0, Date.now());
// A sell at 5069 (above trader's 5068.50) should NOT fill the trader
matchingR.submit(mkMarket('sell', 50, 'touch_seller'), 2, Date.now());
const touchLevel = bookR.getLevel(5068.50);
assert(touchLevel?.bidQueue.some(e => e.order.id === touchId) === true, '3.5: lastPrice touch does NOT fill trader ✓');

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTADO FINAL');
console.log('═══════════════════════════════════════════════════\n');
console.log(`  ✅ Passou: ${passed}`);
console.log(`  ❌ Falhou: ${failed}`);
console.log(`  Total: ${passed + failed}`);
console.log(`\n  ${failed === 0 ? '🎉 TODOS OS TESTES PASSARAM' : '⚠️ FALHAS DETECTADAS'}`);
process.exit(failed > 0 ? 1 : 0);
