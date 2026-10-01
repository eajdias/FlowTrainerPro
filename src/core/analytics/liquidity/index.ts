/**
 * Liquidity Analysis
 *
 * Ported from PickleChart (https://github.com/ikarisz/PickleChart)
 * MIT License
 *
 * Provides:
 * - HeatmapEngine: Bookmap-style order book heatmap
 * - LiquidityEngine: Limit walls, BSL/SSL pools, sweep detection
 */

export { HeatmapEngine } from './heatmapEngine.js';
export type { OrderSegment } from './heatmapEngine.js';

export { LiquidityEngine } from './liquidityEngine.js';

export type {
  Candle,
  RawTrade,
  OrderBookLevel,
  OrderBookState,
  RestingLimitWall,
  LiquidityPool,
  SweptOrderEvent,
  RangeMeasurementResult,
  HeatmapPalette,
  DepthBucketEntry,
  DepthSnapshot,
} from './types.js';
