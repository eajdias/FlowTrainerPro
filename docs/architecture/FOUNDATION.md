# FlowTrainerPro — Foundation (estado real)

## Arquitetura de Dados (fluxo ao vivo)

```txt
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
|---|---|
| `useMarketStore` | Ticks de mercado (ladder, volume profile resumido, brokers, flowSnapshot) |
| `useBookStore` | Book (intenções) via `book:update` |
| `useTradeStore` | Execuções via `matching:execution:created` |
| `useWorkspaceStore` | Layout persistido |
| `useTrainingStore` / `useTrainingSessionStore` / `useMissionStore` | Treino, sessão, missão |
| históricos (`historical*`, `brokerFlowStore`, `marketDataSourceStore`) | Replay e projections |

## BrokerRegistry

- 44 corretoras da B3 em `src/core/marketIdentity/data/brokers.ts` (código, nome, cor primária/secundária)
- Regra de cor secundária: lote individual ≥ 250 → secundária (se definida)
- `getBroker(code)` / `getOrderColor(code, size)` — única via de cor em todo o app

## KernelMarketGenerator

- Jogadores sintéticos determinísticos (seed fixa; mesma sessão = mesmo fluxo)
- 1–5 ordens/tick por perfil; 60% cruzadas (tape) / 40% resting (profundidade)
- Book semeado com ±12 níveis; preço âncora 5069.00, tick 0.50 (WDO)

## Layout

Workspace com layouts salvos (`defaultWorkspaces.ts`): Default, Tape Reading, Scalping (+1).
Painéis docked em grade + flutuantes; posições/visibilidade persistem.

## Controles globais

Header, StatusBar e ReplayToolbar: ver `docs/product/GLOBAL_TRADING_CONTROLS.md` (fonte única).
ReplayToolbar dirige sessão + kernel + bridge; `setSpeed`, perfis e TRAINING FIFO incluídos.

## Engines no Kernel

```
SimulationKernel
  ├── MarketScenarioEngine (rotação determinística de regimes)
  ├── KernelMarketGenerator (fluxo sintético)
  ├── OrderBookEngine (projeção de leitura do matching)
  └── MatchingEngine (FIFO, fills, cancel, slippage, tempo de fila)
```

Sem `SimulationClock`/`MarketStateEngine`/players com IA separados — o clock vive no kernel
(`KERNEL_TICK_MS = 150`) e cenários de mercado são regimes, não scripts.

## Replay histórico e projections

```txt
CSV -> MarketTrade[] -> HistoricalReplayEngine
    -> historical:trade:executed
    -> projections (market:trade:observed, last-price)
    -> stores historicos
```

Nunca passa pelo `MatchingEngine`; nunca altera posição, stops, P&L, FIFO ou ordens do aluno.

## Broker Flow Analyzer

```txt
execução (live) ou MarketTrade (histórico) -> BrokerFlowAnalyzer -> brokerFlowStore
```

Métricas: volumes buy/sell/agressivos, net, RLP, market share, activity rate, persistência,
maiores lotes. Sem inferir intenção. Hook oficial: `src/store/useBrokerFlow.ts`.

## Dependências do projeto

```json
react 19, react-dom 19, zustand, uuid
typescript 6, vite 8, @vitejs/plugin-react 6, vitest 3 (+ @vitest/coverage-v8)
```

Sem React Router (hash `#/rota` + estado local). Sem Electron ativo (stubs em `electron/`).
