# FlowTrainerPro Documentation

## Visão Geral
FlowTrainerPro é uma plataforma de treinamento de trading Order Flow construída com React 19, TypeScript e Vite. O objetivo é simular um mercado realista com corretoras identificadas por cor, order flow e treino progressivo.

## Estado Atual — Sprint 2 (Etapa 1 concluída)

### O que funciona:
- **Mercado sintético live** — SyntheticMarketProvider gera ticks a cada 800ms com broker, cor e volume
- **9 painéis visuais** — todos arrastáveis e redimensionáveis (8 handles)
- **5 workspaces** — Default, Tape Reading, Scalping, DOM Puro, Replay
- **Dados live nos painéis:**
  - Times & Trades: stream de negócios com corretora colorida
  - PriceLadder: bid/ask por nível de preço atualizado por tick
  - VolumeProfile: acumulado por preço com POC e Value Area
  - BrokerHistory: ranking de corretoras por volume e delta
  - SuperDOM: ladder live com delta por nível
- **Toolbar funcional** — Play/Pause/Reset + botões de velocidade + contador de ticks
- **BrokerRegistry** — 37 corretoras reais da B3 com cores e perfis comportamentais
- **Zustand store separado** — WorkspaceStore (layout) | MarketStore (dados de mercado)
- **Build TypeScript limpa** — `npx tsc --noEmit` passa sem erros

### Próximos passos (Etapa 2 — Operação):
- SuperDOM interativo: click → OrderIntent → OrderManager → posição + PnL
- Painel de posições abertas/fechadas
- Stop/Gain visual no SuperDOM
- Flatten funcional

### Backlog (Etapa 3 — Treinamento):
- Training Engine com cenários (Absorção, Rompimento, etc.)
- Missões progressivas com pontuação
- Feedback ao final de cada sessão
- IA coach

## Arquitetura

```
SyntheticMarketProvider (ticks com broker)
        ↓
    FlowEngine (redistribui)
        ↓
 useMarketStore (Zustand)
        ↓
  ┌─────────────────────────────────────┐
  │ SuperDOM · TT · PriceLadder · VV    │
  │ BrokerHistory · Chart8P · etc.      │
  └─────────────────────────────────────┘
```

## Estrutura de pastas
- `src/core/` — kernel, engines, market identity, strategies
- `src/modules/` — training, academy, dashboard, analysis
- `src/panels/` — componentes visuais dos painéis
- `src/workspace/` — WorkspaceManager, Store, PanelRegistry
- `src/store/` — Zustand stores (marketStore)
- `src/market/` — MarketDataProvider, SyntheticMarketProvider
- `src/shared/` — hooks, components, types, constants
- `docs/` — product, architecture, roadmap, standards

## Arquiteturas específicas
- `docs/architecture/FLOW_ANALYSIS_ENGINE.md` — ciclo de vida, contratos e imutabilidade do FlowAnalysisEngine (Sprint 16)

## Dependências
- react 19, react-dom 19
- zustand, uuid
- typescript 6, vite 8, @vitejs/plugin-react 6
