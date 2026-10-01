# Flow Analysis Engine (Sprint 17 — implementação atual)

## Finalidade

O `FlowAnalysisEngine` (`src/core/analytics/flowAnalysis/`) observa execuções e publica leitura
de fluxo: **pressão, resposta e liquidez**. Não executa ordens, não altera mercado.

## Composição (portado de projetos open-source, adaptado)

- **Detecção de anomalias de volume** (`volumeAnomaly/`): processo de Hawkes (bursts),
  CUSUM (mudança de regime de imbalance) e BOCPD (changepoint bayesiano), combinados com
  calibração auto-ajustada (median/MAD). API: `train(trades)` → `detect(trades)`.
- **Liquidez** (`liquidity/`): `HeatmapEngine` (mapa de profundidade estilo Bookmap) e
  `LiquidityEngine` (limit walls, pools BSL/SSL, sweep events com reação
  `breakout_continuation` / `absorbed_reversal` / `stalled`).
- **Latência** (`marketData/latency/`): modelos Constant/Jittered/Empirical para replay realista.

## Integração ao vivo

`flowFeed.ts` (ligado no boot): treina baseline nos primeiros 120 fills, depois detecta
continuamente e publica no `marketStore.flowSnapshot`:

```txt
matching:execution:created → flowFeed → FlowAnalysisEngine → marketStore.flowSnapshot
```

Snapshot: `pressure [-1,1]`, `pressureSide`, `anomaly`, `confidence`, `severity`,
`sweepsPending/continuations/absorptions/significantAbsorptions`, `limitWalls`,
`liquidityPools`, `tradesSeen`. Consumido pela rota Analysis e pelo Debug.

## O que não faz

- Não envia ordens; não altera matching, posição, stops ou P&L.
- Não depende de React/Zustand (puro); o feed faz a ponte com os stores.
- RLP/DIRECT/AUCTION/UNKNOWN do replay histórico não entram no detector direcional
  (só `BUY`/`SELL` via adapters `fromExecution`/`fromHistorical`).
