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
├── core/          # AppRouter (view única Main), AppShell (cockpit), App,
│                  # SessionControls.tsx, sessionActions.ts,
│                  # engine/, kernel/, orderflow/, marketData/, marketIdentity/, analytics/
├── trader/        # TradingController, TraderExecutionBridge, QueueInspector
├── training/      # TrainingMissionEngine, MissionLibrary, MissionStore, types
├── panels/        # 19 tipos do registry (ver Modules.md)
├── workspace/     # PanelRegistry, WorkspaceStore, defaultWorkspaces,
│                  # Manager/Layout (DeskLayout fluido em linhas × colunas)
├── store/         # 17 arquivos (market, book, trade, position, training, históricos, ...)
├── market/providers/ # MarketDataProvider (MarketTick)
├── ui/            # designSystem (ThemeProvider, Button, Badge, Tooltip, Skeleton, Icon)
└── assets/        # global.css, theme.css, panels.css
```

## Regras

- Engines concentram lógica; React apenas representa estado.
- UI nunca implementa regra de negócio.

## Ausências conhecidas

`tsc` 0 erros. Sem React Router (view única, sem rotas). Sem Electron ativo. Motores de avaliação/feedback/replay-recorder (`src/training/evaluation|feedback|replay|rules`) e `modules/academy` não existem — inspectores correspondentes exibem entradas disponíveis com nota de pendência.
