# FlowTrainerPro Documentation

Índice da documentação. Cada tema tem **uma fonte única** — não duplicar conteúdo entre arquivos.

Agentes LLM: comecem por `../AGENTS.md`. Humanos testando pela primeira vez: `../QUICKSTART.md`.

## Status e visão geral

- `../PROJECT_STATUS.md` — snapshot de status com evidências
- `../CHANGELOG.md` — histórico consolidado do projeto
- `../RESUMO_GERENCIAL.md` — apresentação gerencial (leigos)

## Arquitetura e módulos

- `Architecture.md` — arquitetura, camadas, estrutura real de `src/` e componentes existentes
- `Modules.md` — status dos módulos (training/dashboard/academy/analysis ativos) e painéis registrados

## Arquitetura detalhada (`architecture/`)

- `FOUNDATION.md` — fundamentos
- `KERNEL_BOOTSTRAP.md` — inicialização do kernel
- `MARKET_MICROSTRUCTURE.md` — microestrutura de mercado
- `RENDERING_AND_PERFORMANCE.md` — renderização e performance
- `FLOW_ANALYSIS_ENGINE.md` — motor de análise de fluxo
- `HISTORICAL_MARKET_DATA_PIPELINE.md` / `HISTORICAL_REPLAY_ENGINE.md` / `HISTORICAL_MARKET_PROJECTIONS.md` — dados históricos e replay

## Analytics (`analytics/`)

- `BROKER_FLOW_ANALYSIS.md` — análise de fluxo de corretoras

## Produto (`product/`)

- `SUPERDOM_TRADING_INTERACTIONS.md` — interações do SuperDOM (fonte única; inclui fila FIFO via `getOrderQueueState`)
- `TIMES_AND_TRADES.md` — painel Times & Trades
- `BROKER_FLOW_DASHBOARD.md` — dashboard de fluxo de corretoras
- `GLOBAL_TRADING_CONTROLS.md` — controles globais
- `HISTORICAL_REPLAY.md` — replay histórico
- `ATEMPORAL_CHART.md` — gráfico atemporal

## Design e padrões

- `design/FLOWTRAINER_DESIGN_SYSTEM.md` — design system
- `standards/FLOWTRAINER_ENGINEERING_HANDBOOK.md` — manual de engenharia e convenções (fonte única)

## Roadmap

- `roadmap/ROADMAP.md` — fases concluídas e fase atual
- `roadmap/BACKLOG.md` — backlog (fonte única dos próximos passos)
