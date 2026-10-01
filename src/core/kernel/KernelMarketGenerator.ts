// core/kernel/KernelMarketGenerator.ts
// Fluxo sintetico honesto: players ficticios com vies por regime.
// Gera tape (crossing) + profundidade (resting). Perfis de agressividade:
// item de roadmap — aqui, intensidade constante documentada.

import type { MatchingEngine } from './MatchingEngine';
import type { MarketScenarioEngine } from './MarketScenarioEngine';
import type { Order } from '../orderflow/models/Order';

const TICK_SIZE = 0.5;
const ANCHOR_PRICE = 5069.0;
const BROKERS = [3, 114, 85, 308, 39];

export type AggressivenessProfile = 'slow' | 'normal' | 'aggressive';

interface ProfileTuning {
  minOrders: number;
  maxOrders: number;
  minSize: number;
  maxSize: number;
  crossProbability: number;
}

const PROFILES: Record<AggressivenessProfile, ProfileTuning> = {
  slow: { minOrders: 1, maxOrders: 1, minSize: 1, maxSize: 3, crossProbability: 0.4 },
  normal: { minOrders: 1, maxOrders: 3, minSize: 1, maxSize: 10, crossProbability: 0.6 },
  aggressive: { minOrders: 2, maxOrders: 5, minSize: 1, maxSize: 15, crossProbability: 0.75 },
};

let orderCounter = 0;

function snap(price: number): number {
  return Math.round(price / TICK_SIZE) * TICK_SIZE;
}

export class KernelMarketGenerator {
  private seed = 123456789;
  private readonly matching: MatchingEngine;
  private readonly scenario: MarketScenarioEngine;
  private profile: AggressivenessProfile = 'normal';
  /** TRAINING FIFO: filas menores (seed 1-3, descansos 1-2) p/ mais feedback. */
  private trainingFifo = false;

  constructor(matching: MatchingEngine, scenario: MarketScenarioEngine) {
    this.matching = matching;
    this.scenario = scenario;
  }

  setProfile(profile: AggressivenessProfile): void {
    this.profile = profile;
  }

  setTrainingFifo(enabled: boolean): void {
    this.trainingFifo = enabled;
  }

  /** PRNG deterministico (mulberry32) — replay da sessao gera o mesmo fluxo. */
  private rand(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  seedBook(): void {
    const seedMax = this.trainingFifo ? 3 : 20;
    for (let i = 1; i <= 12; i++) {
      const size = 1 + Math.floor(this.rand() * seedMax);
      this.rest('buy', snap(ANCHOR_PRICE - i * TICK_SIZE), size, 3);
      this.rest('sell', snap(ANCHOR_PRICE + i * TICK_SIZE), size, 114);
    }
  }

  onTick(tick: number, now: number): void {
    const regime = this.scenario.getRegime();
    const mid = this.mid() ?? ANCHOR_PRICE;
    const tuning = PROFILES[this.profile];
    const span = tuning.maxOrders - tuning.minOrders + 1;
    const orders = tuning.minOrders + Math.floor(this.rand() * span);

    for (let i = 0; i < orders; i++) {
      const side = this.pickSide(regime);
      const broker = BROKERS[Math.floor(this.rand() * BROKERS.length)]!;
      const sizeSpan = tuning.maxSize - tuning.minSize + 1;
      const size = this.trainingFifo
        ? 1 + Math.floor(this.rand() * 2)
        : tuning.minSize + Math.floor(this.rand() * sizeSpan);
      const cross = this.rand() < tuning.crossProbability;

      if (cross) {
        const price = side === 'buy' ? snap(mid + TICK_SIZE) : snap(mid - TICK_SIZE);
        this.submit(side, price, size, broker, tick, now);
      } else {
        const offset = (1 + Math.floor(this.rand() * (regime === 'volatile' ? 6 : 3))) * TICK_SIZE;
        const price = side === 'buy' ? snap(mid - offset) : snap(mid + offset);
        this.rest(side, price, size, broker, tick, now);
      }
    }
  }

  private pickSide(regime: string): 'buy' | 'sell' {
    const r = this.rand();
    if (regime === 'trend-up') return r < 0.65 ? 'buy' : 'sell';
    if (regime === 'trend-down') return r < 0.65 ? 'sell' : 'buy';
    return r < 0.5 ? 'buy' : 'sell';
  }

  private mid(): number | null {
    const { bids, asks } = this.matching.getBookLevels(1);
    const bb = bids[0]?.price;
    const ba = asks[0]?.price;
    if (bb === undefined || ba === undefined) return null;
    return (bb + ba) / 2;
  }

  private rest(side: 'buy' | 'sell', price: number, size: number, broker: number, tick = 0, now = Date.now()): void {
    this.submit(side, price, size, broker, tick, now, true);
  }

  private submit(
    side: 'buy' | 'sell',
    price: number,
    size: number,
    broker: number,
    tick: number,
    now: number,
    forceRest = false,
  ): void {
    orderCounter += 1;
    const order: Order = {
      id: `syn-${orderCounter}`,
      playerId: `synth-${broker}`,
      brokerId: broker,
      type: 'limit',
      side,
      price,
      size,
      filledSize: 0,
      remainingSize: size,
      status: 'pending',
      timestamp: now,
      tick,
    };
    if (forceRest && this.matching.wouldMatch(side, price)) {
      const { bids, asks } = this.matching.getBookLevels(1);
      const away = side === 'buy' ? (bids[0]?.price ?? price - TICK_SIZE) : (asks[0]?.price ?? price + TICK_SIZE);
      order.price = snap(side === 'buy' ? Math.min(price, away) : Math.max(price, away));
    }
    this.matching.submit(order, tick, now);
  }

  reset(): void {
    this.seed = 123456789;
  }
}
