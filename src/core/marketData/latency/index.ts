/**
 * Latency Models
 *
 * Ported from ordersim (https://github.com/tradingexpert/ordersim)
 * MIT License
 *
 * Provides:
 * - ConstantLatency: Fixed two-leg latency
 * - JitteredLatency: Uniform jitter around a fixed baseline
 * - EmpiricalPlayback: Replay observed latency samples in order
 * - EmpiricalBootstrap: Sample observed latency rows with replacement
 */

export { ConstantLatency, JitteredLatency, EmpiricalPlayback, EmpiricalBootstrap, defaultLatencyModel } from './latencyModel.js';
export type { LatencySample, LatencyMeasurement, LatencyModel } from './latencyModel.js';
export { applyReplayLatency } from './replayLatencyAdapter.js';
export type { TimestampedTrade } from './replayLatencyAdapter.js';
