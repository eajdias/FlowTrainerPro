// core/marketData/projections.ts
// Projections neutras de leitura: replay historico -> paineis.
// historical:trade:executed -> market:trade:observed -> stores historicos.
// Sem matching:execution:created, sem Zustand no core.

import { eventBus } from '../engine/EventBus';
import { HISTORICAL_REPLAY_EVENTS, type HistoricalTradeExecutedEvent } from './replay';
import type { AggressorType, MarketTrade } from './types';
import type { MarketDataSourceMode } from './replay';

export const MARKET_DATA_PROJECTION_EVENTS = {
  TRADE_OBSERVED: 'market:trade:observed',
  PROJECTION_RESET: 'market:projection:reset',
  SOURCE_CHANGED: 'market:source:changed',
  LAST_PRICE_UPDATED: 'market:last-price:updated',
} as const;

export interface MarketTradeObservedEvent {
  trade: MarketTrade;
  sequence: number;
  sessionId: string;
}

export interface MarketProjectionResetEvent {
  sourceMode?: MarketDataSourceMode;
  sessionId?: string | null;
}

export interface MarketDataSourceChangedEvent {
  sourceMode: MarketDataSourceMode;
  sessionId: string | null;
}

export interface MarketLastPriceUpdatedEvent {
  price: number;
  timestamp: number;
  sessionId: string;
  sourceMode: MarketDataSourceMode;
}

// ─── Volume projection ────────────────────────────────────────────────────────

export interface HistoricalVolumeProjection {
  price: number;
  quantity: number;
  buyAggressorVolume: number;
  sellAggressorVolume: number;
  neutralVolume: number;
  rlpVolume: number;
  directVolume: number;
  auctionVolume: number;
}

/** Decompoe o trade por agressor sem forcar RLP/DIRECT/AUCTION/UNKNOWN p/ lado. */
export function projectHistoricalVolumeProfile(event: MarketTradeObservedEvent): HistoricalVolumeProjection {
  const { trade } = event;
  const out: HistoricalVolumeProjection = {
    price: trade.price,
    quantity: trade.quantity,
    buyAggressorVolume: 0,
    sellAggressorVolume: 0,
    neutralVolume: 0,
    rlpVolume: 0,
    directVolume: 0,
    auctionVolume: 0,
  };
  switch (trade.aggressor) {
    case 'BUY': out.buyAggressorVolume = trade.quantity; break;
    case 'SELL': out.sellAggressorVolume = trade.quantity; break;
    case 'RLP': out.rlpVolume = trade.quantity; break;
    case 'DIRECT': out.directVolume = trade.quantity; break;
    case 'AUCTION': out.auctionVolume = trade.quantity; break;
    default: out.neutralVolume = trade.quantity; break;
  }
  return out;
}

// ─── Broker projection ──────────────────────────────────────────────────────

export type HistoricalBrokerKind =
  | 'aggressiveBuy'
  | 'aggressiveSell'
  | 'passiveBuy'
  | 'passiveSell'
  | 'rlp'
  | 'direct'
  | 'auction'
  | 'unknown';

export type HistoricalBrokerRole = 'buyer' | 'seller';

export interface HistoricalBrokerProjection {
  brokerCode: number | null;
  brokerName: string;
  kind: HistoricalBrokerKind;
  role: HistoricalBrokerRole;
  quantity: number;
  price: number;
  timestamp: number;
}

function directionalKind(aggressor: AggressorType, role: HistoricalBrokerRole): HistoricalBrokerKind {
  if (aggressor === 'BUY') return role === 'buyer' ? 'aggressiveBuy' : 'passiveSell';
  if (aggressor === 'SELL') return role === 'seller' ? 'aggressiveSell' : 'passiveBuy';
  if (aggressor === 'RLP') return 'rlp';
  if (aggressor === 'DIRECT') return 'direct';
  if (aggressor === 'AUCTION') return 'auction';
  return 'unknown';
}

/** Emite um item por lado (comprador + vendedor) preservando a semantica do agressor. */
export function projectHistoricalBrokerTrade(trade: MarketTrade): HistoricalBrokerProjection[] {
  const base = { quantity: trade.quantity, price: trade.price, timestamp: trade.timestamp };
  return [
    {
      brokerCode: trade.buyerBroker.code,
      brokerName: trade.buyerBroker.name || trade.buyerBroker.raw,
      kind: directionalKind(trade.aggressor, 'buyer'),
      role: 'buyer',
      ...base,
    },
    {
      brokerCode: trade.sellerBroker.code,
      brokerName: trade.sellerBroker.name || trade.sellerBroker.raw,
      kind: directionalKind(trade.aggressor, 'seller'),
      role: 'seller',
      ...base,
    },
  ];
}

// ─── Wiring replay -> projections ─────────────────────────────────────────────

let projectionWired = false;

/**
 * Liga o replay as projections uma unica vez no boot.
 * Idempotente.
 */
export function initHistoricalMarketDataProjection(): void {
  if (projectionWired) return;
  projectionWired = true;

  eventBus.on<HistoricalTradeExecutedEvent>(HISTORICAL_REPLAY_EVENTS.TRADE_EXECUTED, (event) => {
    const observed: MarketTradeObservedEvent = {
      trade: event.trade,
      sequence: event.sequence,
      sessionId: event.sessionId,
    };
    eventBus.emit(MARKET_DATA_PROJECTION_EVENTS.TRADE_OBSERVED, observed);
    eventBus.emit<MarketLastPriceUpdatedEvent>(MARKET_DATA_PROJECTION_EVENTS.LAST_PRICE_UPDATED, {
      price: event.trade.price,
      timestamp: event.trade.timestamp,
      sessionId: event.sessionId,
      sourceMode: 'HISTORICAL_FILE',
    });
  });
}
