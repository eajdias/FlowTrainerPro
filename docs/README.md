# FlowTrainerPro Documentation

Índice da documentação. Cada tema tem **uma fonte única** — não duplicar conteúdo entre arquivos.

## Arquitetura e módulos

- `Architecture.md` — arquitetura, camadas, estrutura real de `src/` e componentes existentes
- `Modules.md` — status dos módulos (`training` ativo; `dashboard`/`academy`/`analysis` não implementados) e painéis registrados

## Arquitetura detalhada (`architecture/`)

- `FOUNDATION.md` — fundamentos
- `FLOW_ANALYSIS_ENGINE.md` — motor de análise de fluxo
- `HISTORICAL_MARKET_DATA_PIPELINE.md` / `HISTORICAL_REPLAY_ENGINE.md` / `HISTORICAL_MARKET_PROJECTIONS.md` — dados históricos e replay
- `KERNEL_BOOTSTRAP.md` — inicialização do kernel
- `MARKET_MICROSTRUCTURE.md` — microestrutura de mercado
- `RENDERING_AND_PERFORMANCE.md` — renderização e performance
- `MARKET_DATA_PROVIDER.md` — ⚠️ histórico: descreve `src/market/providers/` (removido; ver `Architecture.md`)
- `SPRINT*.md` — notas históricas das sprints 2–8 e 10

## Produto (`product/`)

- `PRODUCT_VISION.md` — visão do produto
- `PROJECT_PRINCIPLES.md` — princípios do projeto
- `SUPERDOM_TRADING_INTERACTIONS.md` — interações do SuperDOM (fonte única; inclui fila FIFO via `getOrderQueueState`)
- `TIMES_AND_TRADES.md` — painel Times & Trades
- `BROKER_FLOW_DASHBOARD.md` — dashboard de fluxo de corretoras
- `GLOBAL_TRADING_CONTROLS.md` — controles globais
- `HISTORICAL_REPLAY.md` — replay histórico
- `ATEMPORAL_CHART.md` — gráfico atemporal

## Design, padrões e roadmap

- `design/FLOWTRAINER_DESIGN_SYSTEM.md` — design system
- `design/UX_UI_MIGRATION_PLAN.md` — migração UX/UI
- `standards/FLOWTRAINER_ENGINEERING_HANDBOOK.md` — manual de engenharia e convenções (fonte única)
- `standards/TESTING_BASELINE.md` — baseline de testes
- `roadmap/ROADMAP.md` — roadmap
- `roadmap/BACKLOG.md` — backlog (fonte única dos próximos passos)
- `roadmap/SPRINT_1.md` / `SPRINT_2.md` — notas de sprint

## Domínio de mercado (raiz de `docs/`)

- `FLOWTRAINER_VISION.md` — visão
- `FLOW_MARKET_MICROSTRUCTURE.md` / `FLOW_MARKET_DYNAMICS.md` / `FLOW_MARKET_PHENOMENA.md` — mercado
- `FLOW_MARKET_SCENARIOS.md` — cenários
- `FLOW_PLAYER_LIBRARY.md` — players
- `FLOW_BROKER_COLORS.md` — cores das corretoras
