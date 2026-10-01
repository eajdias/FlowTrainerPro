// core/analytics/flowAnalysis/flowFeed.ts
// Liga o FlowAnalysisEngine as execucoes ao vivo (uma vez no boot).
// Treina o baseline nos primeiros 120 fills; depois detecta continuamente.

import { eventBus } from '../../engine/EventBus';
import { MATCHING_EVENTS, type Execution } from '../../kernel/MatchingEngine';
import { FlowAnalysisEngine, fromExecution, type FlowTrade } from './FlowAnalysisEngine';
import { useMarketStore } from '../../../store/marketStore';

const BASELINE_TRADES = 120;

let engine: FlowAnalysisEngine | null = null;
let baseline: FlowTrade[] = [];
let wired = false;

export function getFlowEngine(): FlowAnalysisEngine {
  if (!engine) engine = new FlowAnalysisEngine();
  return engine;
}

export function initFlowAnalysis(): void {
  if (wired) return;
  wired = true;
  eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
    const eng = getFlowEngine();
    const trade = fromExecution({
      timestamp: exec.timestamp,
      price: exec.price,
      size: exec.size,
      side: exec.side,
    });
    if (!eng.isTrained()) {
      baseline.push(trade);
      if (baseline.length >= BASELINE_TRADES) {
        eng.trainBaseline(baseline);
        baseline = [];
      }
      return;
    }
    eng.onTrade(trade);
    useMarketStore.getState().syncFlowSnapshot(eng.snapshot());
  });
}
