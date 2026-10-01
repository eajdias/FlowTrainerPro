/**
 * Replay latency adapter — aplica modelo de latência a trades históricos.
 *
 * Para replay realista: cada trade observado em t passa a ser "visto" em
 * t + entry + response (modelo de duas pernas do ordersim).
 * Preserva ordem cronológica via sort estável. Não muta a entrada.
 */

import type { LatencyModel } from './latencyModel.js';

export interface TimestampedTrade {
  timestamp: number;
  [key: string]: unknown;
}

const NS_PER_MS = 1_000_000;

/**
 * Desloca timestamps p/ frente conforme o modelo de latência.
 * @param trades  trades históricos ordenados (ou não — a saída sai ordenada)
 * @param model   modelo de latência (entry + response em ns)
 * @param nowNs   tempo simulado de envio (ns); default 0
 */
export function applyReplayLatency<T extends TimestampedTrade>(
  trades: readonly T[],
  model: LatencyModel,
  nowNs = 0,
): T[] {
  const shifted = trades.map((t) => {
    const sample = model.sample(nowNs);
    const shiftMs = (sample.entryNs + sample.responseNs) / NS_PER_MS;
    return { ...t, timestamp: t.timestamp + shiftMs };
  });
  return shifted
    .map((t, i) => ({ t, i }))
    .sort((a, b) => a.t.timestamp - b.t.timestamp || a.i - b.i)
    .map(({ t }) => t);
}
