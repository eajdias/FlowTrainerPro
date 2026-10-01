# Architecture

Fonte única da arquitetura do FlowTrainerPro. Outros docs **linkam para cá** em vez de repetir o diagrama, a estrutura de pastas ou a lista de componentes.

## Camadas

```
UI Layer           → src/panels/, src/workspace/
State Layer        → src/store/ (Zustand)
Domain Layer       → src/core/, src/trader/, src/training/
Infrastructure     → src/services/, src/assets/
```

Regras (ver `standards/FLOWTRAINER_ENGINEERING_HANDBOOK.md`):

- Engines concentram lógica; React apenas representa estado.
- UI nunca implementa regra de negócio.

## Dois universos

- **Mercado:** clock → book (FIFO) → matching (price-time priority) → generator/scenarios → evento `matching:execution:created` → stores de mercado.
- **Trader (isolado):** `TradingController` (entrada única) → `TraderExecutionBridge` (stateless) → `MatchingEngine`; `PositionStore` atualizado só por executions; `QueueInspector` read-only.

Detalhe dos universos e da camada de treinamento (cenários, missões, avaliação, feedback, replay): ver `PROJECT_STATUS.md` §2 — mantido lá por ser snapshot de homologação, não repetido aqui.

## Estrutura real de `src/` (2026-10-01, via `git ls-files`)

```
src/
├── core/               # AppRouter.tsx, AppShell.tsx/.css, App.tsx
│   ├── engine/               # EventBus
│   ├── kernel/               # MatchingEngine, OrderBookEngine, MarketScenarioEngine, SimulationKernel, KernelMarketGenerator
│   ├── orderflow/models/     # Order
│   ├── marketData/           # types, replay, projections, import, latency/
│   ├── marketIdentity/       # BrokerRegistry + data/brokers
│   └── analytics/            # volumeAnomaly/, liquidity/, brokerFlow/, flowAnalysis/
├── trader/             # TradingController.ts, TraderExecutionBridge.ts, QueueInspector.ts
├── training/           # TrainingMissionEngine.ts, MissionLibrary.ts, MissionStore.ts, types.ts
├── panels/             # 24 tipos do registry implementados (ver Modules.md)
├── workspace/          # PanelRegistry.ts, WorkspaceStore.ts, defaultWorkspaces.ts, types.ts + Manager/Layout/DockManager
├── store/              # 14 stores (book, trade, broker*, historical*, position, traderOrder, market, ...)
├── market/providers/   # MarketDataProvider (MarketTick)
├── ui/                 # designSystem (ThemeProvider, Badge, Button)
├── services/           # SÓ index.ts (stub vazio)
├── router/             # SÓ index.ts (stub vazio, não usado — navegação é por estado em AppRouter)
└── assets/             # global.css + estáticos
```

## Componentes existentes (verificado em disco)

| Arquivo | Papel |
|---------|-------|
| `src/core/AppRouter.tsx` | Roteamento por estado entre módulos |
| `src/core/AppShell.tsx` | Layout com sidebar e área de conteúdo |
| `src/trader/TradingController.ts` | Entrada única do trader |
| `src/trader/TraderExecutionBridge.ts` | Bridge → MatchingEngine |
| `src/trader/QueueInspector.ts` | Observabilidade read-only da fila |
| `src/training/*` | Ver `Modules.md` (fonte única do módulo training) |
| `src/workspace/PanelRegistry.ts` | Registro tipo → componente de painel |
| `src/workspace/WorkspaceStore.ts` / `defaultWorkspaces.ts` | Estado e layouts do workspace |
| `src/store/*.ts` | Stores Zustand por domínio |
| `src/core/kernel/*` | Matching, book, cenário, kernel 150ms, gerador sintético |
| `src/core/marketData/*` | Tipos, replay histórico, projections, import CSV, latência |
| `src/core/analytics/*` | volumeAnomaly, liquidity, brokerFlow, flowAnalysis |
| `src/panels/*/` | 24 painéis do registry (UX 3 + treinamento + replay) |
| `src/ui/designSystem` | ThemeProvider, Badge, Button |

## Ausências conhecidas (2026-10-01: nenhuma quebrando o build)

`tsc` 0 erros. Docs que descrevem arquivos removidos (`architecture/MARKET_DATA_PROVIDER.md`, `FLOW_PLAYER_LIBRARY.md` §12) são **históricos** — não refletem o tree atual. Motores de avaliação/feedback/replay-recorder (`src/training/evaluation|feedback|replay|rules`) e `modules/academy` não existem — inspectores correspondentes exibem entradas disponíveis com nota de pendência.
