// core/kernel/MarketScenarioEngine.ts
// Regimes deterministicos p/ o gerador sintetico.
// Perfis de agressividade (lento/normal/agressivo) entram em item proprio.

import { eventBus } from '../engine/EventBus';

export const SCENARIO_EVENTS = {
  REGIME_CHANGED: 'scenario:regime:changed',
} as const;

export type MarketRegime = 'range' | 'trend-up' | 'trend-down' | 'volatile';

export interface RegimeChangedEvent {
  regime: MarketRegime;
  tick: number;
}

const ROTATION: MarketRegime[] = ['range', 'trend-up', 'volatile', 'range', 'trend-down'];
const TICKS_PER_REGIME = 40;

export class MarketScenarioEngine {
  private regime: MarketRegime = 'range';

  getRegime(): MarketRegime {
    return this.regime;
  }

  onTick(tick: number): void {
    const next = ROTATION[Math.floor(tick / TICKS_PER_REGIME) % ROTATION.length]!;
    if (next !== this.regime) {
      this.regime = next;
      eventBus.emit<RegimeChangedEvent>(SCENARIO_EVENTS.REGIME_CHANGED, { regime: next, tick });
    }
  }

  reset(): void {
    this.regime = 'range';
  }
}
