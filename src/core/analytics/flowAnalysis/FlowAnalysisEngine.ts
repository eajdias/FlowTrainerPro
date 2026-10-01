/**
 * FlowAnalysisEngine — Pressão, Resposta e Liquidez (Sprint 17)
 *
 * Facade sobre os módulos portados:
 * - volumeAnomaly (Hawkes + CUSUM + BOCPD) → anomalia / pressão
 * - liquidityEngine (walls, pools, sweeps) → resposta / liquidez
 * - heatmapEngine (depth snapshots) → base visual p/ Book / Volume Profile
 *
 * Propositalmente isolado: consome FlowTrade[] puro, sem EventBus/kernel.
 * Adapters convertem Execution (live) e MarketTrade (histórico) p/ FlowTrade.
 */

import { VolumeAnomalyDetector } from '../volumeAnomaly/index.js';
import type { DetectionResult, IAggregatedTradeData } from '../volumeAnomaly/index.js';
import { LiquidityEngine } from '../liquidity/index.js';
import type { RawTrade } from '../liquidity/index.js';
import { HeatmapEngine } from '../liquidity/heatmapEngine.js';
import type { DepthSnapshot } from '../liquidity/index.js';
import { volumeImbalance } from '../volumeAnomaly/hawkes.js';

// ─── Public contract ──────────────────────────────────────────────────────────

export interface FlowTrade {
  /** Unix ms */
  timestamp: number;
  price: number;
  qty: number;
  aggressorSide: 'buy' | 'sell';
}

export type FlowPressureSide = 'buy' | 'sell' | 'neutral';

export interface FlowAnalysisSignal {
  /** [-1, +1] janela recente: +1 = só compra, -1 = só venda */
  pressure: number;
  pressureSide: FlowPressureSide;
  anomaly: boolean;
  confidence: number;
  severity: DetectionResult['severity'];
  /** sweeps pendentes/contínuos/absorvidos na janela */
  sweepsPending: number;
  continuations: number;
  absorptions: number;
  significantAbsorptions: number;
  limitWalls: number;
  liquidityPools: number;
  lastTimestamp: number;
}

export interface FlowAnalysisSnapshot extends FlowAnalysisSignal {
  trained: boolean;
  tradesSeen: number;
  detection: DetectionResult | null;
}

const PRESSURE_WINDOW = 50;
const DETECT_WINDOW = 200;
const MIN_TRAIN_TRADES = 50;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class FlowAnalysisEngine {
  private detector = new VolumeAnomalyDetector();
  private liquidity = new LiquidityEngine(0.5);
  private heatmap = new HeatmapEngine(0.5, 1000);
  private recent: FlowTrade[] = [];
  private trained = false;
  private tradesSeen = 0;
  private lastDetection: DetectionResult | null = null;

  trainBaseline(trades: FlowTrade[]): void {
    const agg = trades.map(toAggregated);
    this.detector.train(agg);
    this.trained = true;
  }

  isTrained(): boolean {
    return this.trained;
  }

  onTrade(trade: FlowTrade): FlowAnalysisSignal {
    this.tradesSeen += 1;
    this.recent.push(trade);
    if (this.recent.length > DETECT_WINDOW) this.recent.shift();

    const raw: RawTrade = {
      time: trade.timestamp,
      price: trade.price,
      qty: trade.qty,
      side: trade.aggressorSide,
    };
    this.liquidity.processTrade(raw);
    this.heatmap.handleTradeMatch(raw);

    const pressure = volumeImbalance(
      this.recent.slice(-PRESSURE_WINDOW).map(toAggregated),
    );

    let detection: DetectionResult | null = null;
    if (this.trained && this.recent.length >= PRESSURE_WINDOW) {
      detection = this.detector.detect(this.recent.map(toAggregated));
      this.lastDetection = detection;
    }

    return this.buildSignal(pressure, detection, trade.timestamp);
  }

  snapshot(): FlowAnalysisSnapshot {
    const pressure = volumeImbalance(
      this.recent.slice(-PRESSURE_WINDOW).map(toAggregated),
    );
    return {
      ...this.buildSignal(pressure, this.lastDetection, this.recent.at(-1)?.timestamp ?? 0),
      trained: this.trained,
      tradesSeen: this.tradesSeen,
      detection: this.lastDetection,
    };
  }

  getHeatmapSnapshots(): DepthSnapshot[] {
    return this.heatmap.getSnapshots();
  }

  reset(): void {
    this.recent = [];
    this.trained = false;
    this.tradesSeen = 0;
    this.lastDetection = null;
    this.detector = new VolumeAnomalyDetector();
    this.liquidity = new LiquidityEngine(0.5);
    this.heatmap = new HeatmapEngine(0.5, 1000);
  }

  private buildSignal(
    pressure: number,
    detection: DetectionResult | null,
    lastTimestamp: number,
  ): FlowAnalysisSignal {
    const sweeps = this.liquidity.getSweptEvents();
    let continuations = 0;
    let absorptions = 0;
    let significantAbsorptions = 0;
    let pending = 0;
    for (const s of sweeps) {
      if (s.reaction === 'pending') pending += 1;
      else if (s.reaction === 'breakout_continuation') continuations += 1;
      else if (s.reaction === 'absorbed_reversal') {
        absorptions += 1;
        if (s.significant) significantAbsorptions += 1;
      }
    }
    return {
      pressure,
      pressureSide: pressure > 0.2 ? 'buy' : pressure < -0.2 ? 'sell' : 'neutral',
      anomaly: detection?.anomaly ?? false,
      confidence: detection?.confidence ?? 0,
      severity: detection?.severity ?? 'none',
      sweepsPending: pending,
      continuations,
      absorptions,
      significantAbsorptions,
      limitWalls: this.liquidity.getLimitWalls().length,
      liquidityPools: this.liquidity.getLiquidityPools().length,
      lastTimestamp,
    };
  }
}

// ─── Adapters (live Execution / histórico MarketTrade → FlowTrade) ────────────

interface ExecutionLike {
  timestamp: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

interface HistoricalTradeLike {
  timestamp: number;
  price: number;
  quantity: number;
  aggressor: 'BUY' | 'SELL' | 'buy' | 'sell' | 'buyer' | 'seller' | 'NONE' | 'none' | string;
}

function toAggregated(t: FlowTrade): IAggregatedTradeData {
  return {
    timestamp: t.timestamp,
    qty: t.qty,
    // isBuyerMaker=true → agressor vendeu (bateu no bid)
    isBuyerMaker: t.aggressorSide === 'sell',
  };
}

/** Live kernel Execution → FlowTrade (sem importar o kernel ausente). */
export function fromExecution(exec: ExecutionLike): FlowTrade {
  return {
    timestamp: exec.timestamp,
    price: exec.price,
    qty: exec.size,
    aggressorSide: exec.side,
  };
}

/** Projeção histórica (historical:trade:executed) → FlowTrade. */
export function fromHistorical(trade: HistoricalTradeLike): FlowTrade {
  const a = String(trade.aggressor).toLowerCase();
  const aggressorSide: 'buy' | 'sell' = a.startsWith('buy') ? 'buy' : 'sell';
  return {
    timestamp: trade.timestamp,
    price: trade.price,
    qty: trade.quantity,
    aggressorSide,
  };
}

export { MIN_TRAIN_TRADES };
