# Foundation

## Arquitetura de dados (fluxo ao vivo)

```
SimulationKernel (clock 150ms)
  ├─ MarketScenarioEngine (regimes: range | trend-up | trend-down | volatile)
  ├─ KernelMarketGenerator (ordens sintéticas: perfis slow/normal/aggressive, TRAINING FIFO)
  ├─ MatchingEngine (FIFO price-time → matching:execution:created)
  └─ OrderBookEngine (snapshot → book:update)
       ├─ bookStore / tradeStore / volumeProfileStore / brokerHistoryStore
       ├─ positionStore (via TraderExecutionBridge) / traderOrderStore
       ├─ marketStore (priceLevels, brokerActivity, flowSnapshot)
       ├─ FlowAnalysisEngine (pressão/resposta/liquidez) / BrokerFlowAnalyzer
       └─ RangeCandleEngine (candles 8P: range ≥ 8.00)
```

## Stores Zustand

| Store | Responsabilidade |
|-------|------------------|
| `useMarketStore` | Ticks de mercado (ladder, volume profile, brokers, flowSnapshot) |
| `useBookStore` | Book (intenções) via `book:update` |
| `useTradeStore` | Execuções via `matching:execution:created` |
| `useWorkspaceStore` | Layout persistido |
| `useTrainingStore` / `useTrainingSessionStore` / `useMissionStore` | Treino, sessão, missão |
| `historical*`, `brokerFlowStore`, `marketDataSourceStore` | Replay e projections |

## BrokerRegistry

- 44 corretoras da B3 em `src/core/marketIdentity/data/brokers.ts`
- Regra de cor secundária: lote individual ≥ 250 → secundária (se definida)
- `getBroker(code)` / `getOrderColor(code, size)` — única via de cor em todo o app

## KernelMarketGenerator

- Jogadores sintéticos determinísticos (seed fixa; mesma sessão = mesmo fluxo)
- 1–5 ordens/tick por perfil; 60% cruzadas (tape) / 40% resting (profundidade)
- Book semeado com ±12 níveis; preço âncora 5069.00, tick 0.50 (WDO)

## Layout

Workspace com layouts salvos (`defaultWorkspaces.ts`): Default, Tape Reading, Scalping (+1). Painéis docked em grade + flutuantes; posições/visibilidade persistem.

## Replay histórico

```
CSV → MarketTrade[] → HistoricalReplayEngine → historical:trade:executed → projections → stores históricos
```

Nunca passa pelo `MatchingEngine`; nunca altera posição, stops, P&L, FIFO ou ordens do aluno.

## Dependências

`react 19`, `react-dom 19`, `zustand`, `uuid`, `typescript 6`, `vite 8`, `@vitejs/plugin-react 6`, `vitest 3` (+ `@vitest/coverage-v8`)

Sem React Router (hash `#/rota` + estado local). Sem Electron ativo (stubs em `electron/`).
