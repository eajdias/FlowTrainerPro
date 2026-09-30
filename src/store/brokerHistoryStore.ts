// store/brokerHistoryStore.ts
// @deprecated UI panels must consume brokerFlowStore, fed by BrokerFlowMarketSnapshot.
// Keep this adapter-era store only for external/legacy consumers until removal is scheduled.
// Dedicated Zustand store for Broker History.
// SOURCE OF TRUTH: TradeStore executions via "matching:execution:created".
// Consolidates executions BY BROKER.
// NEVER reads from OrderBook. NEVER reads from DOM.
// Shows only what was EXECUTED — never intentions.
//
// Tracks:
// - Volume total (compra + venda)
// - Agressão Líquida (volume quando o broker foi AGRESSOR)
// - Passivo Líquido (volume quando o broker foi PASSIVO)
// - Preço médio ponderado por volume
// - Saldo = agressão compra - agressão venda

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { MATCHING_EVENTS } from '../core/kernel/MatchingEngine';
import type { Execution } from '../core/kernel/MatchingEngine';
import { brokerRegistry } from '../core/marketIdentity/BrokerRegistry';

// ── Broker record ─────────────────────────────────────────────────────────────

export interface BrokerRecord {
  brokerId:           number;
  name:               string;
  color:              string;

  // Volume total (aggressor + passive combined)
  buyVolume:          number;    // total contracts on buy side (aggressor or passive)
  sellVolume:         number;    // total contracts on sell side (aggressor or passive)
  netBalance:         number;    // buyVolume - sellVolume

  // Agressão Líquida (only when THIS broker was the aggressor)
  aggressionBuy:      number;    // contracts this broker AGGRESSIVELY bought
  aggressionSell:     number;    // contracts this broker AGGRESSIVELY sold
  aggressionNet:      number;    // aggressionBuy - aggressionSell

  // Passivo Líquido (only when THIS broker was passive/resting)
  passiveBuy:         number;    // contracts this broker passively sold TO a buyer aggressor
  passiveSell:        number;    // contracts this broker passively bought FROM a seller aggressor
  passiveNet:         number;    // passiveBuy - passiveSell

  // Metrics
  avgPrice:           number;    // VWAP of all executions this broker was involved in
  totalVolume:        number;    // total contracts (buy + sell)
  tradeCount:         number;    // total executions involved in
  lastActiveAt:       number;    // timestamp of last execution
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface BrokerHistoryState {
  brokers: Map<number, BrokerRecord>;
  sorted:  BrokerRecord[];   // sorted by totalVolume desc for rendering
}

interface BrokerHistoryActions {
  reset: () => void;
}

function buildSorted(map: Map<number, BrokerRecord>): BrokerRecord[] {
  return Array.from(map.values())
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

export const useBrokerHistoryStore = create<BrokerHistoryState & BrokerHistoryActions>((set) => ({
  brokers: new Map(),
  sorted:  [],

  reset: () => set({ brokers: new Map(), sorted: [] }),
}));

// ── Wire: Execution → BrokerHistoryStore ──────────────────────────────────────

eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
  useBrokerHistoryStore.setState((s) => {
    const map = new Map(s.brokers);

    // AGGRESSOR broker: was aggressive on exec.side
    updateBrokerAsAggressor(map, exec.aggressorBrokerId, exec.side, exec.size, exec.price, exec.timestamp);

    // PASSIVE broker: was resting, got filled by opposite side
    const passiveSide: 'buy' | 'sell' = exec.side === 'buy' ? 'sell' : 'buy';
    updateBrokerAsPassive(map, exec.passiveBrokerId, passiveSide, exec.size, exec.price, exec.timestamp);

    return { brokers: map, sorted: buildSorted(map) };
  });
});

function getOrCreate(map: Map<number, BrokerRecord>, brokerId: number, size: number): BrokerRecord {
  const existing = map.get(brokerId);
  if (existing) return existing;

  const broker = brokerRegistry.getBroker(brokerId);
  return {
    brokerId,
    name:            broker?.abbreviation ?? `Broker ${brokerId}`,
    color:           broker ? brokerRegistry.getOrderColor(brokerId, size) : '#8b90a0',
    buyVolume:       0,
    sellVolume:      0,
    netBalance:      0,
    aggressionBuy:   0,
    aggressionSell:  0,
    aggressionNet:   0,
    passiveBuy:      0,
    passiveSell:     0,
    passiveNet:      0,
    avgPrice:        0,
    totalVolume:     0,
    tradeCount:      0,
    lastActiveAt:    0,
  };
}

function updateBrokerAsAggressor(
  map: Map<number, BrokerRecord>,
  brokerId: number,
  side: 'buy' | 'sell',
  size: number,
  price: number,
  timestamp: number,
): void {
  const rec = getOrCreate(map, brokerId, size);

  const newTotalVol = rec.totalVolume + size;
  const newAvgPrice = newTotalVol > 0
    ? (rec.avgPrice * rec.totalVolume + price * size) / newTotalVol
    : price;

  map.set(brokerId, {
    ...rec,
    buyVolume:      side === 'buy'  ? rec.buyVolume + size  : rec.buyVolume,
    sellVolume:     side === 'sell' ? rec.sellVolume + size : rec.sellVolume,
    netBalance:     rec.netBalance + (side === 'buy' ? size : -size),
    aggressionBuy:  side === 'buy'  ? rec.aggressionBuy + size  : rec.aggressionBuy,
    aggressionSell: side === 'sell' ? rec.aggressionSell + size : rec.aggressionSell,
    aggressionNet:  rec.aggressionNet + (side === 'buy' ? size : -size),
    avgPrice:       newAvgPrice,
    totalVolume:    newTotalVol,
    tradeCount:     rec.tradeCount + 1,
    lastActiveAt:   timestamp,
  });
}

function updateBrokerAsPassive(
  map: Map<number, BrokerRecord>,
  brokerId: number,
  side: 'buy' | 'sell',
  size: number,
  price: number,
  timestamp: number,
): void {
  const rec = getOrCreate(map, brokerId, size);

  const newTotalVol = rec.totalVolume + size;
  const newAvgPrice = newTotalVol > 0
    ? (rec.avgPrice * rec.totalVolume + price * size) / newTotalVol
    : price;

  // Passive: side here is the passive broker's side.
  // If a buyer aggressed, passive was selling → passiveSell++ (passive had a sell order hit)
  // We track from the passive broker's perspective.
  map.set(brokerId, {
    ...rec,
    buyVolume:    side === 'buy'  ? rec.buyVolume + size  : rec.buyVolume,
    sellVolume:   side === 'sell' ? rec.sellVolume + size : rec.sellVolume,
    netBalance:   rec.netBalance + (side === 'buy' ? size : -size),
    passiveBuy:   side === 'buy'  ? rec.passiveBuy + size  : rec.passiveBuy,
    passiveSell:  side === 'sell' ? rec.passiveSell + size : rec.passiveSell,
    passiveNet:   rec.passiveNet + (side === 'buy' ? size : -size),
    avgPrice:     newAvgPrice,
    totalVolume:  newTotalVol,
    tradeCount:   rec.tradeCount + 1,
    lastActiveAt: timestamp,
  });
}
