# FlowTrainerPro Documentation

Single entry for humans: `../QUICKSTART.md`. For LLM agents: `../AGENTS.md` first.

Flat layout on purpose: one `glob docs/*.md` lists everything. Prefix groups by area.
Each topic has a single source — do not duplicate content across files.

## Start here

| File | Read when |
|------|-----------|
| `architecture.md` | layers, the two universes (Market × Trader), real `src/` tree |
| `modules.md` | Main view, sidebar, cockpit header, workspaces, panel registry |
| `../CHANGELOG.md` | project history and last verified state |

## Architecture (`arch-*`)

| File | Read when |
|------|-----------|
| `arch-foundation.md` | live data flow (kernel → matching → book) |
| `arch-kernel-bootstrap.md` | kernel startup sequence |
| `arch-market-microstructure.md` | order book, matching, microstructure rules |
| `arch-rendering-performance.md` | rendering strategy and perf budgets |
| `arch-flow-analysis.md` | flow analysis engine |
| `arch-history-pipeline.md` | historical data pipeline (API → DuckDB → JSON) |
| `arch-history-replay-engine.md` | historical replay engine and its isolation rules |
| `arch-history-projections.md` | historical market projections |

## Product (`product-*`)

| File | Read when |
|------|-----------|
| `product-superdom.md` | SuperDOM interactions (single source; includes FIFO queue via `getOrderQueueState`) |
| `product-times-trades.md` | Times & Trades panel |
| `product-broker-dashboard.md` | broker flow dashboard |
| `product-trading-controls.md` | global trading controls |
| `product-history-replay.md` | historical replay UX |
| `product-atemporal-chart.md` | atemporal range chart |

## Cross-cutting

| File | Read when |
|------|-----------|
| `analytics-broker-flow.md` | broker flow analysis |
| `design-system.md` | design tokens, components, theme |
| `engineering-handbook.md` | engineering conventions (single source) |
