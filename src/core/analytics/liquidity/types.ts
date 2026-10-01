/**
 * Liquidity Analysis Types
 *
 * Ported from PickleChart (https://github.com/ikarisz/PickleChart)
 * MIT License
 */

export interface Candle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RawTrade {
  time: number; // Unix milliseconds
  price: number;
  qty: number;
  side: 'buy' | 'sell';
}

export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface OrderBookState {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number;
  bestAsk: number;
  timestamp: number;
  maxBidQty?: number;
  maxAskQty?: number;
}

export interface RestingLimitWall {
  price: number;
  volume: number;
  notional: number;
  side: 'buy' | 'sell';
  distance: number;
  distancePercent: number;
  percentageOfBook: number;
  isSignificant: boolean;
}

export interface LiquidityPool {
  id: string;
  price: number;
  type: 'BSL' | 'SSL';
  description: string;
  time: number;
  estimatedVolume: number;
  isSwept: boolean;
  sweptAtTime?: number;
  sweptVolume?: number;
  sweptVolumeSource?: 'trades' | 'candle';
  distance: number;
}

export interface SweptOrderEvent {
  id: string;
  time: number;
  price: number;
  type: 'limit_sell_swept' | 'limit_buy_swept' | 'bsl_swept' | 'ssl_swept';
  volume: number;
  notional: number;
  aggressorSide: 'buy' | 'sell';
  reaction: 'pending' | 'breakout_continuation' | 'absorbed_reversal' | 'stalled';
  initialRestingVolume?: number;
  highAfterSweep?: number;
  lowAfterSweep?: number;
  significant?: boolean;
  significanceTags?: string[];
}

export interface RangeMeasurementResult {
  minPrice: number;
  maxPrice: number;
  priceSpan: number;
  pointSpan: number;
  totalRestingBuy: number;
  totalRestingSell: number;
  restingBuyCount: number;
  restingSellCount: number;
  pools: LiquidityPool[];
  totalFilledVolume: number;
  buyFillVolume: number;
  sellFillVolume: number;
  netDelta: number;
  recentSweeps: SweptOrderEvent[];
}

export type HeatmapPalette = 'inferno' | 'cyberpunk' | 'magma';

export interface DepthBucketEntry {
  price: number;
  volume: number;
  filledVolume?: number;
  buyFillVolume?: number;
  sellFillVolume?: number;
}

export interface DepthSnapshot {
  timestamp: number;
  entries: DepthBucketEntry[];
  bestBid: number;
  bestAsk: number;
}
