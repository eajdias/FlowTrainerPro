/**
 * Volume Anomaly Detection Types
 *
 * Ported from volume-anomaly (https://github.com/tripolskypetr/volume-anomaly)
 * Zero-dependency TypeScript implementation
 */

export interface HawkesParams {
  mu: number;
  alpha: number;
  beta: number;
}

export interface CusumParams {
  mu0: number;
  std0: number;
  k: number;
  h: number;
}

export interface CusumState {
  sPos: number;
  sNeg: number;
  n: number;
}

export interface NormalGammaPrior {
  mu0: number;
  kappa0: number;
  alpha0: number;
  beta0: number;
}

export interface NormalGammaSS {
  n: number;
  mean: number;
  m2: number;
}

export interface BocpdState {
  logProbs: number[];
  suffStats: NormalGammaSS[];
  t: number;
  minRl: number;
}

export interface IAggregatedTradeData {
  timestamp: number; // Unix milliseconds
  qty: number;
  isBuyerMaker: boolean;
}

export type Severity = 'none' | 'notable' | 'strong' | 'extreme';

export interface AnomalySignal {
  kind: string;
  score: number;
  meta: Record<string, unknown>;
}

export interface DetectionResult {
  anomaly: boolean;
  confidence: number;
  severity: Severity;
  scores: {
    hawkes: number;
    cusum: number;
    bocpd: number;
  };
  stats: {
    zRate: number;
    zVol: number;
    zRateSlow: number;
    zVolSlow: number;
    lambdaRatio: number;
    zRates: number[];
    zVols: number[];
    horizonsSec: number[];
    zExcess: number;
  };
  signals: AnomalySignal[];
  imbalance: number;
  burstImbalance: number;
  moveScore: number;
  peakTs: number;
  hawkesLambda: number;
  cusumStat: number;
  runLength: number;
}
