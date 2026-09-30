import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import {
  MARKET_DATA_PROJECTION_EVENTS,
  projectHistoricalBrokerTrade,
  type MarketProjectionResetEvent,
  type MarketTradeObservedEvent,
} from '../core/marketData/projections';
import { brokerRegistry } from '../core/marketIdentity/BrokerRegistry';

export interface HistoricalBrokerRecord {
  brokerId: number;
  name: string;
  color: string;
  buyVolume: number;
  sellVolume: number;
  netBalance: number;
  aggressionBuy: number;
  aggressionSell: number;
  aggressionNet: number;
  passiveBuy: number;
  passiveSell: number;
  passiveNet: number;
  rlpVolume: number;
  directVolume: number;
  auctionVolume: number;
  unknownVolume: number;
  avgPrice: number;
  totalVolume: number;
  tradeCount: number;
  largestTrade: number;
  firstTimestamp: number | null;
  lastActiveAt: number;
}

interface HistoricalBrokerHistoryState {
  brokers: Map<number, HistoricalBrokerRecord>;
  sorted: HistoricalBrokerRecord[];
  sessionId: string | null;
  reset: () => void;
}

export const useHistoricalBrokerHistoryStore = create<HistoricalBrokerHistoryState>((set) => ({
  brokers: new Map(),
  sorted: [],
  sessionId: null,

  reset: () => set({ brokers: new Map(), sorted: [], sessionId: null }),
}));

eventBus.on<MarketTradeObservedEvent>(MARKET_DATA_PROJECTION_EVENTS.TRADE_OBSERVED, (event) => {
  useHistoricalBrokerHistoryStore.setState((state) => {
    const map = new Map(state.brokers);
    for (const item of projectHistoricalBrokerTrade(event.trade)) {
      updateBroker(map, item.brokerCode, item.brokerName, item.kind, item.role, item.quantity, item.price, item.timestamp);
    }
    return {
      brokers: map,
      sorted: Array.from(map.values()).sort((a, b) => b.totalVolume - a.totalVolume),
      sessionId: event.sessionId,
    };
  });
});

eventBus.on<MarketProjectionResetEvent>(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, () => {
  useHistoricalBrokerHistoryStore.getState().reset();
});

function updateBroker(
  map: Map<number, HistoricalBrokerRecord>,
  brokerCode: number | null,
  brokerName: string,
  kind: ReturnType<typeof projectHistoricalBrokerTrade>[number]['kind'],
  role: ReturnType<typeof projectHistoricalBrokerTrade>[number]['role'],
  quantity: number,
  price: number,
  timestamp: number,
): void {
  const brokerId = brokerCode ?? stableBrokerId(brokerName);
  const existing = map.get(brokerId) ?? createBroker(brokerId, brokerName, quantity);
  const newTotal = existing.totalVolume + quantity;
  const avgPrice = newTotal > 0 ? (existing.avgPrice * existing.totalVolume + price * quantity) / newTotal : price;

  map.set(brokerId, {
    ...existing,
    buyVolume: existing.buyVolume + (role === 'buyer' ? quantity : 0),
    sellVolume: existing.sellVolume + (role === 'seller' ? quantity : 0),
    netBalance: existing.netBalance + (role === 'buyer' ? quantity : -quantity),
    aggressionBuy: existing.aggressionBuy + (kind === 'aggressiveBuy' ? quantity : 0),
    aggressionSell: existing.aggressionSell + (kind === 'aggressiveSell' ? quantity : 0),
    aggressionNet: existing.aggressionNet + (kind === 'aggressiveBuy' ? quantity : kind === 'aggressiveSell' ? -quantity : 0),
    passiveBuy: existing.passiveBuy + (kind === 'passiveBuy' ? quantity : 0),
    passiveSell: existing.passiveSell + (kind === 'passiveSell' ? quantity : 0),
    passiveNet: existing.passiveNet + (kind === 'passiveBuy' ? quantity : kind === 'passiveSell' ? -quantity : 0),
    rlpVolume: existing.rlpVolume + (kind === 'rlp' ? quantity : 0),
    directVolume: existing.directVolume + (kind === 'direct' ? quantity : 0),
    auctionVolume: existing.auctionVolume + (kind === 'auction' ? quantity : 0),
    unknownVolume: existing.unknownVolume + (kind === 'unknown' ? quantity : 0),
    avgPrice,
    totalVolume: newTotal,
    tradeCount: existing.tradeCount + 1,
    largestTrade: Math.max(existing.largestTrade, quantity),
    firstTimestamp: existing.firstTimestamp ?? timestamp,
    lastActiveAt: timestamp,
  });
}

function createBroker(brokerId: number, fallbackName: string, size: number): HistoricalBrokerRecord {
  const broker = brokerRegistry.getBroker(brokerId);
  return {
    brokerId,
    name: broker?.abbreviation ?? fallbackName,
    color: broker ? brokerRegistry.getOrderColor(brokerId, size) : '#8b90a0',
    buyVolume: 0,
    sellVolume: 0,
    netBalance: 0,
    aggressionBuy: 0,
    aggressionSell: 0,
    aggressionNet: 0,
    passiveBuy: 0,
    passiveSell: 0,
    passiveNet: 0,
    rlpVolume: 0,
    directVolume: 0,
    auctionVolume: 0,
    unknownVolume: 0,
    avgPrice: 0,
    totalVolume: 0,
    tradeCount: 0,
    largestTrade: 0,
    firstTimestamp: null,
    lastActiveAt: 0,
  };
}

function stableBrokerId(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }
  return -Math.abs(hash || 1);
}
