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
│   └── analytics/volumeAnomaly/  # bocpd, cusum, hawkes, types (+ detector/index untracked)
├── trader/             # TradingController.ts, TraderExecutionBridge.ts, QueueInspector.ts
├── training/           # TrainingMissionEngine.ts, MissionLibrary.ts, MissionStore.ts, types.ts
├── panels/             # SÓ index.ts (barrel) — subdirs dos painéis AUSENTES (ver § Ausências)
├── workspace/          # PanelRegistry.ts, WorkspaceStore.ts, defaultWorkspaces.ts, types.ts
├── store/              # 14 stores (book, trade, broker*, historical*, position, traderOrder, market, ...)
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

## Ausências conhecidas (quebram o build)

- `src/panels/*/`: `PanelRegistry.ts` e `panels/index.ts` importam ~20 painéis (`SuperDOM`, `TimesAndTrades`, `PriceLadder`, `AtemporalChart`, inspectors, etc.) — **nenhum subdir existe**. Só `src/panels/index.ts` está commitado.
- `src/workspace/WorkspaceManager/`, `LayoutManager/`, `DockManager/`: importados por `src/workspace/index.ts` — **não existem**.
- `src/ui/designSystem`: importado por `src/App.tsx` e `src/core/AppShell.tsx` (`ThemeProvider`, `Badge`, `Button`) — **não existe** (`src/ui/` foi removido por estar vazio).
- `src/core/kernel/` (`SimulationKernel`, `SimulationClock`, `MatchingEngine`, `OrderBookEngine`, `MarketScenarioEngine`): citados em docs antigos — **não existem** no tree atual.
- `src/core/marketData/`, `src/core/marketIdentity/`, `src/market/`: citados em docs antigos — **não existem** (só dirs vazios locais `marketData/latency`, `analytics/liquidity`).
- `src/modules/`: citado em docs antigos — **não existe** (removido; o módulo `training` real vive em `src/training/`).

Docs que descrevem arquivos removidos (`architecture/MARKET_DATA_PROVIDER.md`, `FLOW_PLAYER_LIBRARY.md` §12) são **históricos** — não refletem o tree atual.
