import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import {
  MARKET_DATA_PROJECTION_EVENTS,
  type MarketDataSourceChangedEvent,
  type MarketProjectionResetEvent,
} from '../core/marketData/projections';
import type { MarketDataSourceMode } from '../core/marketData/replay';

interface MarketDataSourceState {
  sourceMode: MarketDataSourceMode;
  sessionId: string | null;
  isHistorical: boolean;
  setSource: (sourceMode: MarketDataSourceMode, sessionId?: string | null) => void;
  reset: () => void;
}

export const useMarketDataSourceStore = create<MarketDataSourceState>((set) => ({
  sourceMode: 'SYNTHETIC',
  sessionId: null,
  isHistorical: false,

  setSource: (sourceMode, sessionId = null) => set({
    sourceMode,
    sessionId,
    isHistorical: sourceMode === 'HISTORICAL_FILE',
  }),

  reset: () => set({ sourceMode: 'SYNTHETIC', sessionId: null, isHistorical: false }),
}));

eventBus.on<MarketDataSourceChangedEvent>(MARKET_DATA_PROJECTION_EVENTS.SOURCE_CHANGED, (event) => {
  useMarketDataSourceStore.getState().setSource(event.sourceMode, event.sessionId);
});

eventBus.on<MarketProjectionResetEvent>(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, (event) => {
  if (event.sourceMode === 'HISTORICAL_FILE') {
    useMarketDataSourceStore.getState().setSource('HISTORICAL_FILE', event.sessionId);
  }
});
