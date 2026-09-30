import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import {
  MARKET_DATA_PROJECTION_EVENTS,
  type MarketProjectionResetEvent,
  type MarketTradeObservedEvent,
} from '../core/marketData/projections';
import type { AggressorType } from '../core/marketData/types';

export interface HistoricalTradeRecord {
  tradeId: string;
  timestamp: number;
  tradeTime: string;
  price: number;
  quantity: number;
  aggressor: AggressorType;
  buyerBrokerCode: number | null;
  buyerBrokerName: string;
  sellerBrokerCode: number | null;
  sellerBrokerName: string;
  sequence: number;
}

interface HistoricalTradeState {
  trades: HistoricalTradeRecord[];
  totalTrades: number;
  lastPrice: number;
  lastTimestamp: number | null;
  sessionId: string | null;
  reset: () => void;
}

const MAX_VISIBLE_TRADES = 500;

export const useHistoricalTradeStore = create<HistoricalTradeState>((set) => ({
  trades: [],
  totalTrades: 0,
  lastPrice: 0,
  lastTimestamp: null,
  sessionId: null,

  reset: () => set({ trades: [], totalTrades: 0, lastPrice: 0, lastTimestamp: null, sessionId: null }),
}));

eventBus.on<MarketTradeObservedEvent>(MARKET_DATA_PROJECTION_EVENTS.TRADE_OBSERVED, (event) => {
  const { trade } = event;
  const record: HistoricalTradeRecord = {
    tradeId: trade.tradeId,
    timestamp: trade.timestamp,
    tradeTime: trade.tradeTime,
    price: trade.price,
    quantity: trade.quantity,
    aggressor: trade.aggressor,
    buyerBrokerCode: trade.buyerBroker.code,
    buyerBrokerName: trade.buyerBroker.name || trade.buyerBroker.raw,
    sellerBrokerCode: trade.sellerBroker.code,
    sellerBrokerName: trade.sellerBroker.name || trade.sellerBroker.raw,
    sequence: event.sequence,
  };

  useHistoricalTradeStore.setState((state) => ({
    trades: [record, ...state.trades].slice(0, MAX_VISIBLE_TRADES),
    totalTrades: state.totalTrades + 1,
    lastPrice: trade.price,
    lastTimestamp: trade.timestamp,
    sessionId: event.sessionId,
  }));
});

eventBus.on<MarketProjectionResetEvent>(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, () => {
  useHistoricalTradeStore.getState().reset();
});
