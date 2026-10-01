// core/marketData/types.ts
// MarketTrade: negocio real importado, observado historicamente.
// Imutavel por Object.freeze na saida do parser. Nunca vira Execution.

export type AggressorType = 'BUY' | 'SELL' | 'RLP' | 'DIRECT' | 'AUCTION' | 'UNKNOWN';

export interface MarketBroker {
  code: number | null;
  name: string;
  raw: string;
}

export interface MarketTrade {
  tradeId: string;
  sourceLine: number;
  sourceSequence: number;
  chronologicalSequence: number;
  asset: string;
  tradeDate: string;
  tradeTime: string;
  timestamp: number;
  price: number;
  priceInTicks: number;
  quantity: number;
  buyerBroker: MarketBroker;
  sellerBroker: MarketBroker;
  aggressor: AggressorType;
  source: 'csv' | 'live';
  syntheticReplayOffsetMs?: number;
}
