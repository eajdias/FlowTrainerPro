# FlowTrainerPro

FlowTrainerPro e uma plataforma de treinamento de Order Flow com React, TypeScript, Vite e engines de simulacao isoladas da interface.

## Estado atual

- Workspace React/Vite funcionando.
- Paineis principais renderizados via workspace.
- Kernel de simulacao com clock, book, matching, execucao, risco, cenarios e analise de fluxo.
- Importacao historica de CSV para `MarketTrade[]`.
- Replay historico seguro em `src/core/marketData/replay/`.
- Projections historicas em `src/core/marketData/projections/`.
- Broker Flow Analyzer em `src/core/analytics/brokerFlow/`.
- Design System oficial em `src/ui/designSystem/`.

## Replay historico

O evento oficial de negocio historico e:

```txt
historical:trade:executed
```

Ele representa mercado observado e nao execucao do simulador. Por padrao, o replay historico nao altera posicao, stops, P&L, FIFO ou ordens do aluno, e nao emite `matching:execution:created`.

Documentacao:

- `docs/architecture/HISTORICAL_MARKET_DATA_PIPELINE.md`
- `docs/architecture/HISTORICAL_REPLAY_ENGINE.md`
- `docs/architecture/HISTORICAL_MARKET_PROJECTIONS.md`
- `docs/analytics/BROKER_FLOW_ANALYSIS.md`
- `docs/product/BROKER_FLOW_DASHBOARD.md`
- `docs/product/GLOBAL_TRADING_CONTROLS.md`
- `docs/product/SUPERDOM_TRADING_INTERACTIONS.md`
- `docs/product/TIMES_AND_TRADES.md`
- `docs/design/FLOWTRAINER_DESIGN_SYSTEM.md`
- `docs/design/UX_UI_MIGRATION_PLAN.md`

## Comandos

```bash
npm run dev
npm run build
npm test
npm run validate:trade-csv -- data/imports/WDOFUT_F_0_Trade_13-07-2026.csv
```

## Controles globais

A Fase UX 2 reorganiza Header, StatusBar e ReplayToolbar como controles globais. Esses controles usam vocabulario unico para source mode, sessao e replay, e nao alteram engines, matching, FIFO, posicao, stops ou P&L.

## Paineis de mercado UX 3

A Fase UX 3 parcial moderniza SuperDOM e Times & Trades. A mudanca e visual/ergonomica: preserva handlers homologados, FIFO, MatchingEngine, ordens, posicao, stops e P&L.
