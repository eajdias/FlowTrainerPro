// core/marketData/candles/candleFeed.ts
// Liga o RangeCandleEngine as execucoes ao vivo (uma vez no boot).

import { eventBus } from '../../engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../../kernel/MatchingEngine';
import { RangeCandleEngine, type RangeCandle } from './RangeCandleEngine';

let engine: RangeCandleEngine | null = null;
let wired = false;

export function getCandleEngine(): RangeCandleEngine {
  if (!engine) engine = new RangeCandleEngine();
  return engine;
}

export function initCandleFeed(): void {
  if (wired) return;
  wired = true;
  eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
    getCandleEngine().onTrade({
      price: exec.price,
      quantity: exec.size,
      aggressorSide: exec.side,
      timestamp: exec.timestamp,
    });
  });
}

export type { RangeCandle };
