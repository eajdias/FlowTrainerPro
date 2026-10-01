// trader/TraderExecutionBridge.ts
// STATELESS bridge entre o Universo do Trader e o Universo do Mercado.
// É a ÚNICA camada autorizada a falar com o MatchingEngine.
// Não mantém estado próprio — lê dos stores e propaga por eventos.
//
// Responsabilidades:
// 1. Escuta "trader:order:submit" → submete ao MatchingEngine
// 2. Escuta "trader:order:cancel" → cancela no MatchingEngine
// 3. Escuta "trader:stop:triggered" → submete market order ao MatchingEngine
// 4. Escuta "matching:execution:created" → verifica se envolve o trader
//    → SE SIM: atualiza PositionStore
//    → SE SIM: emite "trader:order:filled"
// 5. Escuta "matching:execution:created" → verifica triggers de stops
//    → chama TraderOrderStore.checkTriggers → emite "trader:stop:triggered" se necessário

import { eventBus } from '../core/engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../core/kernel/MatchingEngine';
import { getKernel } from '../core/kernel/SimulationKernel';
import { TRADER_EVENTS } from './TradingController';
import { useTraderOrderStore } from '../store/traderOrderStore';
import { usePositionStore } from '../store/positionStore';
import { useTrainingStore } from '../store/trainingStore';
import type { Order } from '../core/orderflow/models/Order';

const TRADER_PLAYER_ID = 'trader_user';

function traderBrokerId(): number {
  return useTraderOrderStore.getState().brokerId;
}

let initialized = false;

/**
 * Initializes the TraderExecutionBridge wiring.
 * Call ONCE on app startup (from useFlowEngine).
 * Completely stateless — just wires events.
 */
export function initTraderBridge(): void {
  if (initialized) return;
  initialized = true;

  // ════════════════════════════════════════════════════════════════════════════
  // 1. Trader submits order → Bridge sends to MatchingEngine
  // ════════════════════════════════════════════════════════════════════════════

  eventBus.on(TRADER_EVENTS.ORDER_SUBMIT, (payload: {
    id: string; side: 'buy' | 'sell'; price: number; size: number; type: 'limit' | 'market';
  }) => {
    const kernel = getKernel();
    if (!kernel.isInitialized || !kernel.isRunning) return;

    const order: Order = {
      id:            payload.id,
      playerId:      TRADER_PLAYER_ID,
      brokerId:      traderBrokerId(),
      type:          payload.type,
      side:          payload.side,
      price:         payload.type === 'market' ? 0 : payload.price,
      size:          payload.size,
      filledSize:    0,
      remainingSize: payload.size,
      status:        'pending',
      timestamp:     Date.now(),
      tick:          0,
    };

    kernel.matching.submit(order, 0, Date.now());
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Trader cancels order → Bridge removes from MatchingEngine book
  // ════════════════════════════════════════════════════════════════════════════

  eventBus.on(TRADER_EVENTS.ORDER_CANCEL, (payload: {
    id: string; price: number; side: 'buy' | 'sell';
  }) => {
    const kernel = getKernel();
    if (!kernel.isInitialized) return;

    kernel.matching.cancel(payload.id, payload.price, payload.side);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Stop triggered → Bridge submits market order
  // ════════════════════════════════════════════════════════════════════════════

  eventBus.on(TRADER_EVENTS.STOP_TRIGGERED, (payload: {
    id: string; side: 'buy' | 'sell'; size: number;
  }) => {
    const kernel = getKernel();
    if (!kernel.isInitialized || !kernel.isRunning) return;

    const order: Order = {
      id:            payload.id + '_stop_exec',
      playerId:      TRADER_PLAYER_ID,
      brokerId:      traderBrokerId(),
      type:          'market',
      side:          payload.side,
      price:         0,
      size:          payload.size,
      filledSize:    0,
      remainingSize: payload.size,
      status:        'pending',
      timestamp:     Date.now(),
      tick:          0,
    };

    kernel.matching.submit(order, 0, Date.now());
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. Execution created → check if trader is involved → update position
  // ════════════════════════════════════════════════════════════════════════════

  eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
    const isTraderAggressor = exec.aggressorPlayerId === TRADER_PLAYER_ID;
    const isTraderPassive = exec.passivePlayerId === TRADER_PLAYER_ID;

    if (!isTraderAggressor && !isTraderPassive) {
      // Not the trader's execution — but check stop triggers
      checkStopTriggers(exec.price);
      return;
    }

    // Trader is involved in this execution
    const traderSide = isTraderAggressor ? exec.side : (exec.side === 'buy' ? 'sell' : 'buy');
    const orderId = isTraderPassive ? exec.passiveOrderId : exec.aggressorOrderId;

    // Training: primeira participação do aluno na sessão (tick do kernel).
    const training = useTrainingStore.getState();
    if (training.scenario && training.traderEnteredAt === null) {
      training.recordEntry(traderSide === 'buy' ? 'long' : 'short', getKernel().getTick());
    }

    // Update PositionStore based on execution
    const pos = usePositionStore.getState();

    if (pos.side === null) {
      // FLAT → opening new position
      const posSide = traderSide === 'buy' ? 'long' as const : 'short' as const;
      usePositionStore.getState().openPosition(posSide, exec.price, exec.size);
    } else if (
      (pos.side === 'long' && traderSide === 'sell') ||
      (pos.side === 'short' && traderSide === 'buy')
    ) {
      // Closing position (opposite side)
      usePositionStore.getState().closePosition(exec.price);
    } else {
      // Scaling in (same side)
      usePositionStore.getState().openPosition(pos.side, exec.price, exec.size);
    }

    // Notify TraderOrderStore that order was filled
    eventBus.emit(TRADER_EVENTS.ORDER_FILLED, { id: orderId });

    // Mark-to-market da posição em cada execução
    usePositionStore.getState().updatePnL(exec.price);

    // Also check stop triggers (price changed)
    checkStopTriggers(exec.price);
  });
}

// ── Stop trigger check (stateless — reads from store) ─────────────────────────

function checkStopTriggers(lastPrice: number): void {
  const orders = useTraderOrderStore.getState().orders;
  const stops = orders.filter((o) => o.label === 'stop' && o.status === 'pending');

  for (const stop of stops) {
    let triggered = false;

    if (stop.side === 'sell') {
      triggered = lastPrice <= stop.price;
    } else {
      triggered = lastPrice >= stop.price;
    }

    if (triggered) {
      // Remove from store first (prevent double-trigger)
      useTraderOrderStore.getState().removeOrder(stop.id);

      // Emit trigger event → Bridge will submit market order
      eventBus.emit(TRADER_EVENTS.STOP_TRIGGERED, {
        id:   stop.id,
        side: stop.side,
        size: stop.size,
      });
    }
  }
}
