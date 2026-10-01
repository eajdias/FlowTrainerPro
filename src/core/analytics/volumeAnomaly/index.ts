/**
 * Volume Anomaly Detection
 *
 * Ported from volume-anomaly (https://github.com/tripolskypetr/volume-anomaly)
 * Zero-dependency TypeScript implementation
 *
 * Provides:
 * - Hawkes process (self-exciting point process) for burst detection
 * - CUSUM (Cumulative Sum Control Chart) for regime shift detection
 * - BOCPD (Bayesian Online Changepoint Detection) for changepoint detection
 * - VolumeAnomalyDetector: unified train/detect interface
 */

export { VolumeAnomalyDetector } from './detector.js';
export type { DetectorConfig, TrainedModels } from './detector.js';
export { severityOf, NULLQ_PCTS } from './detector.js';

export { volumeImbalance, hawkesFit, hawkesLambda, hawkesPeakLambda, hawkesExcessSeries, hawkesAnomalyScore, hawkesLogLikelihood } from './hawkes.js';
export type { HawkesFitResult } from './hawkes.js';

export { cusumFit, cusumUpdate, cusumInitState, cusumAnomalyScore, cusumBatch } from './cusum.js';
export type { CusumUpdateResult } from './cusum.js';

export { bocpdUpdate, bocpdInitState, bocpdAnomalyScore, bocpdBatch, defaultPrior } from './bocpd.js';
export type { BocpdUpdateResult } from './bocpd.js';

export type {
  HawkesParams,
  CusumParams,
  CusumState,
  NormalGammaPrior,
  NormalGammaSS,
  BocpdState,
  IAggregatedTradeData,
  Severity,
  AnomalySignal,
  DetectionResult,
} from './types.js';
