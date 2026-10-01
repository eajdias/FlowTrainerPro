// core/analytics/brokerFlow/types.ts
// Evidencias quantitativas por corretora — nunca intencao ou causalidade.
// RLP/DIRECT/AUCTION/UNKNOWN separados de agressao direcional.

import type { MarketDataSourceMode } from '../../marketData/replay';

export interface BrokerFlowSnapshot {
  brokerKey: string;
  brokerName: string;
  brokerCode: number | null;
  totalBuyVolume: number;
  totalSellVolume: number;
  aggressiveBuyVolume: number;
  aggressiveSellVolume: number;
  aggressiveNetVolume: number;
  rlpBuyVolume: number;
  rlpSellVolume: number;
  marketShare: number;
  activityRate: number;
  persistenceScore: number;
  largestBuyTrade: number;
  largestSellTrade: number;
  largestAggressiveBuy: number;
  largestAggressiveSell: number;
  lastActivityTimestamp: number | null;
}

export interface BrokerFlowMarketSnapshot {
  brokers: BrokerFlowSnapshot[];
  processedTradeCount: number;
  mostActiveBroker: string | null;
  mostAggressiveBuyer: string | null;
  mostAggressiveSeller: string | null;
  largestPositiveAggressiveNet: string | null;
  largestNegativeAggressiveNet: string | null;
  sourceMode: MarketDataSourceMode | null;
  sessionId: string | null;
  timestamp: number;
}
