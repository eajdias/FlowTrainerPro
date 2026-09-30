import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import {
  MARKET_DATA_PROJECTION_EVENTS,
  type MarketLastPriceUpdatedEvent,
  type MarketProjectionResetEvent,
} from '../core/marketData/projections';

interface HistoricalLastPriceState {
  price: number;
  timestamp: number | null;
  sessionId: string | null;
  reset: () => void;
}

export const useHistoricalLastPriceStore = create<HistoricalLastPriceState>((set) => ({
  price: 0,
  timestamp: null,
  sessionId: null,

  reset: () => set({ price: 0, timestamp: null, sessionId: null }),
}));

eventBus.on<MarketLastPriceUpdatedEvent>(MARKET_DATA_PROJECTION_EVENTS.LAST_PRICE_UPDATED, (event) => {
  if (event.sourceMode !== 'HISTORICAL_FILE') return;
  useHistoricalLastPriceStore.setState({
    price: event.price,
    timestamp: event.timestamp,
    sessionId: event.sessionId,
  });
});

eventBus.on<MarketProjectionResetEvent>(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, () => {
  useHistoricalLastPriceStore.getState().reset();
});
