/**
 * Flow Analysis — Pressão, Resposta e Liquidez (Sprint 17)
 *
 * Facade isolada sobre os módulos portados. Sem EventBus/kernel.
 */

export { FlowAnalysisEngine, fromExecution, fromHistorical } from './FlowAnalysisEngine.js';
export { getFlowEngine, initFlowAnalysis } from './flowFeed.js';
export type {
  FlowTrade,
  FlowPressureSide,
  FlowAnalysisSignal,
  FlowAnalysisSnapshot,
} from './FlowAnalysisEngine.js';
export { MIN_TRAIN_TRADES } from './FlowAnalysisEngine.js';
