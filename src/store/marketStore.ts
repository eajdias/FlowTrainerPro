// store/marketStore.ts
// Single reactive store for all live market data.
// Kernel → KernelMarketGenerator → EventBus → applyTick → panels read from here.

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../core/kernel/MatchingEngine';
import { brokerRegistry } from '../core/marketIdentity/BrokerRegistry';
import type { MarketTick } from '../market/providers/MarketDataProvider';
import type { FlowAnalysisSnapshot } from '../core/analytics/flowAnalysis';

// ── Re-export FlowTick ────────────────────────────────────────────────────────
export type FlowTick = MarketTick;

// ── Trade entry (Times & Trades) ──────────────────────────────────────────────
export interface TradeEntry {
  id:          string;
  timestamp:   number;
  price:       number;
  volume:      number;
  delta:       number;
  side:        'BUY' | 'SELL';
  brokerId:    number;
  brokerName:  string;
  brokerColor: string;
}

// ── Price level (PriceLadder / SuperDOM) ──────────────────────────────────────
export interface PriceLevel {
  price:     number;
  bidVolume: number;
  askVolume: number;
  delta:     number;
  isCurrent: boolean;
}

// ── Volume profile node ───────────────────────────────────────────────────────
export interface VolumeNode {
  price:    number;
  volume:   number;
  barWidth: number;  // 0–100 relative to max
  isPOC:    boolean;
}

// ── Broker activity (BrokerHistory panel) ─────────────────────────────────────
export interface BrokerActivity {
  brokerId:    number;
  brokerName:  string;
  color:       string;
  buyVolume:   number;
  sellVolume:  number;
  netDelta:    number;   // buy - sell
  avgPrice:    number;
  tradeCount:  number;
}

// ── Store state ───────────────────────────────────────────────────────────────
interface MarketState {
  currentPrice:    number;
  currentVolume:   number;
  currentDelta:    number;
  lastTimestamp:   number;
  cumulativeDelta: number;
  sessionVolume:   number;
  tickCount:       number;
  isRunning:       boolean;

  trades:          TradeEntry[];      // last 60
  priceLevels:     PriceLevel[];      // ±12 levels at 0.25 tick
  volumeProfile:   VolumeNode[];      // top 30 price levels by volume
  brokerActivity:  BrokerActivity[];  // sorted by |netDelta| desc

  // Sprint 3: authoritative state from Kernel's MarketStateEngine
  kernelState: {
    vwap:           number;
    trend:          'up' | 'down' | 'sideways';
    sessionTrades:  number;
    imbalance:      number;
  };

  // Sprint 16.2: snapshot oficial do FlowAnalysisEngine
  flowSnapshot: FlowAnalysisSnapshot;
}

interface MarketActions {
  applyTick:        (tick: MarketTick) => void;
  syncKernelState:  (vwap: number, trend: 'up'|'down'|'sideways', trades: number, imbalance: number) => void;
  syncFlowSnapshot: (snapshot: MarketState['flowSnapshot']) => void;
  setRunning:       (v: boolean) => void;
  reset:            () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TICK_SIZE     = 0.50;
const LADDER_LEVELS = 12;
const MAX_TRADES    = 60;
const INITIAL_PRICE = 5069.00;

// ── Internal accumulators (mutable — outside Zustand for perf) ───────────────
const volumeByPrice  = new Map<number, number>();
const ladderData     = new Map<number, { bid: number; ask: number; delta: number }>();
const brokerMap      = new Map<number, BrokerActivity>();
let   maxVolume      = 0;
let   tradeCounter   = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function snap(price: number) {
  return Math.round(price / TICK_SIZE) * TICK_SIZE;
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildLadder(center: number): PriceLevel[] {
  const c = snap(center);
  const out: PriceLevel[] = [];
  for (let i = LADDER_LEVELS; i >= -LADDER_LEVELS; i--) {
    const p    = r2(c + i * TICK_SIZE);
    const data = ladderData.get(p) ?? { bid: 0, ask: 0, delta: 0 };
    out.push({ price: p, bidVolume: data.bid, askVolume: data.ask, delta: data.delta, isCurrent: p === c });
  }
  return out;
}

function buildVolumeProfile(): VolumeNode[] {
  if (volumeByPrice.size === 0) return [];
  let pocPrice = 0;
  let pocVol   = 0;
  volumeByPrice.forEach((v, p) => { if (v > pocVol) { pocVol = v; pocPrice = p; } });

  return Array.from(volumeByPrice.entries())
    .sort(([a], [b]) => b - a)
    .slice(0, 30)
    .map(([price, volume]) => ({
      price,
      volume,
      barWidth: maxVolume > 0 ? Math.round((volume / maxVolume) * 100) : 0,
      isPOC:    price === pocPrice,
    }));
}

function buildBrokerActivity(): BrokerActivity[] {
  return Array.from(brokerMap.values())
    .sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta))
    .slice(0, 12);
}

function buildInitialLadder(): PriceLevel[] {
  const c = snap(INITIAL_PRICE);
  return Array.from({ length: LADDER_LEVELS * 2 + 1 }, (_, i) => {
    const p = r2(c + (LADDER_LEVELS - i) * TICK_SIZE);
    return { price: p, bidVolume: 0, askVolume: 0, delta: 0, isCurrent: p === c };
  });
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useMarketStore = create<MarketState & MarketActions>((set) => ({
  currentPrice:    INITIAL_PRICE,
  currentVolume:   0,
  currentDelta:    0,
  lastTimestamp:   0,
  cumulativeDelta: 0,
  sessionVolume:   0,
  tickCount:       0,
  isRunning:       false,
  trades:          [],
  priceLevels:     buildInitialLadder(),
  volumeProfile:   [],
  brokerActivity:  [],
  kernelState:     { vwap: 0, trend: 'sideways' as const, sessionTrades: 0, imbalance: 0 },
  flowSnapshot:    emptyFlowSnapshot(),

  syncKernelState: (vwap, trend, trades, imbalance) => set({
    kernelState: { vwap, trend, sessionTrades: trades, imbalance },
  }),

  syncFlowSnapshot: (snapshot) => set({ flowSnapshot: snapshot }),

  applyTick: (tick) => {
    const price  = snap(tick.price);
    const isBuy  = tick.delta >= 0;

    // Volume profile
    const pv = volumeByPrice.get(price) ?? 0;
    const nv = pv + tick.volume;
    volumeByPrice.set(price, nv);
    if (nv > maxVolume) maxVolume = nv;

    // Ladder
    const ld = ladderData.get(price) ?? { bid: 0, ask: 0, delta: 0 };
    ladderData.set(price, {
      bid:   isBuy  ? ld.bid + tick.volume : ld.bid,
      ask:   !isBuy ? ld.ask + tick.volume : ld.ask,
      delta: ld.delta + (isBuy ? tick.volume : -tick.volume),
    });

    // Broker activity
    const existing = brokerMap.get(tick.brokerId);
    if (existing) {
      brokerMap.set(tick.brokerId, {
        ...existing,
        buyVolume:  isBuy  ? existing.buyVolume  + tick.volume : existing.buyVolume,
        sellVolume: !isBuy ? existing.sellVolume + tick.volume : existing.sellVolume,
        netDelta:   existing.netDelta + (isBuy ? tick.volume : -tick.volume),
        avgPrice:   r2((existing.avgPrice * existing.tradeCount + tick.price) / (existing.tradeCount + 1)),
        tradeCount: existing.tradeCount + 1,
      });
    } else {
      brokerMap.set(tick.brokerId, {
        brokerId:   tick.brokerId,
        brokerName: tick.brokerName,
        color:      tick.brokerColor,
        buyVolume:  isBuy  ? tick.volume : 0,
        sellVolume: !isBuy ? tick.volume : 0,
        netDelta:   isBuy  ? tick.volume : -tick.volume,
        avgPrice:   tick.price,
        tradeCount: 1,
      });
    }

    // Trade entry
    const trade: TradeEntry = {
      id:          `t${++tradeCounter}`,
      timestamp:   tick.timestamp,
      price:       tick.price,
      volume:      tick.volume,
      delta:       tick.delta,
      side:        isBuy ? 'BUY' : 'SELL',
      brokerId:    tick.brokerId,
      brokerName:  tick.brokerName,
      brokerColor: tick.brokerColor,
    };

    set((s) => ({
      currentPrice:    tick.price,
      currentVolume:   tick.volume,
      currentDelta:    tick.delta,
      lastTimestamp:   tick.timestamp,
      cumulativeDelta: s.cumulativeDelta + tick.delta,
      sessionVolume:   s.sessionVolume + tick.volume,
      tickCount:       s.tickCount + 1,
      trades:          [trade, ...s.trades].slice(0, MAX_TRADES),
      priceLevels:     buildLadder(tick.price),
      volumeProfile:   buildVolumeProfile(),
      brokerActivity:  buildBrokerActivity(),
    }));
  },

  setRunning: (v) => set({ isRunning: v }),

  reset: () => {
    volumeByPrice.clear();
    ladderData.clear();
    brokerMap.clear();
    maxVolume    = 0;
    tradeCounter = 0;
    set({
      currentPrice: INITIAL_PRICE, currentVolume: 0, currentDelta: 0,
      lastTimestamp: 0, cumulativeDelta: 0, sessionVolume: 0, tickCount: 0,
      isRunning: false, trades: [], priceLevels: buildInitialLadder(),
      volumeProfile: [], brokerActivity: [],
      kernelState: { vwap: 0, trend: 'sideways' as const, sessionTrades: 0, imbalance: 0 },
      flowSnapshot: emptyFlowSnapshot(),
    });
  },
}));

function emptyFlowSnapshot(): FlowAnalysisSnapshot {
  return {
    pressure: 0,
    pressureSide: 'neutral',
    anomaly: false,
    confidence: 0,
    severity: 'none',
    sweepsPending: 0,
    continuations: 0,
    absorptions: 0,
    significantAbsorptions: 0,
    limitWalls: 0,
    liquidityPools: 0,
    lastTimestamp: 0,
    trained: false,
    tradesSeen: 0,
    detection: null,
  };
}

// ── Wire: Execution ao vivo → tick de mercado ─────────────────────────────────

eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
  const broker = brokerRegistry.getBroker(exec.aggressorBrokerId);
  const tick: MarketTick = {
    price: exec.price,
    volume: exec.size,
    delta: exec.side === 'buy' ? exec.size : -exec.size,
    timestamp: exec.timestamp,
    brokerId: exec.aggressorBrokerId,
    brokerName: broker?.name ?? `B${exec.aggressorBrokerId}`,
    brokerColor: brokerRegistry.getOrderColor(exec.aggressorBrokerId, exec.size),
  };
  useMarketStore.getState().applyTick(tick);
});
