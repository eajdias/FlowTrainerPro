# Architecture

## Camadas

```
UI Layer           → src/panels/, src/workspace/
State Layer        → src/store/ (Zustand)
Domain Layer       → src/core/, src/trader/, src/training/
Infrastructure     → src/services/, src/assets/
```

## Dois universos

- **Mercado:** clock → book (FIFO) → matching (price-time priority) → generator/scenarios → evento `matching:execution:created` → stores de mercado.
- **Trader (isolado):** `TradingController` (entrada única) → `TraderExecutionBridge` (stateless) → `MatchingEngine`; `PositionStore` atualizado só por executions; `QueueInspector` read-only.

## Estrutura real de `src/`

```
src/
├── core/               # AppRouter, AppShell, App, engine/, kernel/, orderflow/, marketData/, marketIdentity/, analytics/
├── trader/             # TradingController, TraderExecutionBridge, QueueInspector
├── training/           # TrainingMissionEngine, MissionLibrary, MissionStore, types
├── panels/             # 24 tipos do registry
├── workspace/          # PanelRegistry, WorkspaceStore, defaultWorkspaces, Manager/Layout/DockManager
├── store/              # 14 stores
├── market/providers/   # MarketDataProvider (MarketTick)
├── ui/                 # designSystem
├── services/           # SÓ index.ts (stub vazio)
├── router/             # SÓ index.ts (stub vazio, não usado)
└── assets/             # global.css + estáticos
```

## Regras

- Engines concentram lógica; React apenas representa estado.
- UI nunca implementa regra de negócio.

## Ausências conhecidas

`tsc` 0 erros. Motores de avaliação/feedback/replay-recorder (`src/training/evaluation|feedback|replay|rules`) e `modules/academy` não existem — inspectores correspondentes exibem entradas disponíveis com nota de pendência.
