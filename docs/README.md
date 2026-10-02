# FlowTrainerPro Documentation

Índice da documentação. Cada tema tem **uma fonte única** — não duplicar conteúdo entre arquivos.

Agentes LLM: comecem por `../AGENTS.md`. Humanos testando pela primeira vez: `../QUICKSTART.md`.

## Status e visão geral

- `../CHANGELOG.md` — histórico consolidado do projeto (inclui estado atual verificado)
- `../RESUMO_GERENCIAL.md` — apresentação gerencial (leigos)

## Arquitetura e módulos

- `Architecture.md` — arquitetura, camadas, estrutura real de `src/` e componentes existentes
- `Modules.md` — view única Main, sidebar, header cockpit, workspaces e painéis registrados

## Arquitetura detalhada (`architecture/`)

- `architecture/FOUNDATION.md` — fundamentos
- `architecture/KERNEL_BOOTSTRAP.md` — inicialização do kernel
- `architecture/MARKET_MICROSTRUCTURE.md` — microestrutura de mercado
- `architecture/RENDERING_AND_PERFORMANCE.md` — renderização e performance
- `architecture/FLOW_ANALYSIS_ENGINE.md` — motor de análise de fluxo
- `architecture/HISTORICAL_MARKET_DATA_PIPELINE.md` / `architecture/HISTORICAL_REPLAY_ENGINE.md` / `architecture/HISTORICAL_MARKET_PROJECTIONS.md` — dados históricos e replay

## Analytics (`analytics/`)

- `analytics/BROKER_FLOW_ANALYSIS.md` — análise de fluxo de corretoras

## Produto (`product/`)

- `product/SUPERDOM_TRADING_INTERACTIONS.md` — interações do SuperDOM (fonte única; inclui fila FIFO via `getOrderQueueState`)
- `product/TIMES_AND_TRADES.md` — painel Times & Trades
- `product/BROKER_FLOW_DASHBOARD.md` — dashboard de fluxo de corretoras
- `product/GLOBAL_TRADING_CONTROLS.md` — controles globais
- `product/HISTORICAL_REPLAY.md` — replay histórico
- `product/ATEMPORAL_CHART.md` — gráfico atemporal

## Design e padrões

- `design/FLOWTRAINER_DESIGN_SYSTEM.md` — design system
- `standards/FLOWTRAINER_ENGINEERING_HANDBOOK.md` — manual de engenharia e convenções (fonte única)
