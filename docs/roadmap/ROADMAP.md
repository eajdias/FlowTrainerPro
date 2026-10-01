# Roadmap

Fases concluídas + fase atual. A lista do que falta fazer vive em `BACKLOG.md` (fonte única) — não duplicar aqui.

## Concluído

- **Sprint 1 — Foundation:** base React + TypeScript + Vite, workspace de treinamento, painéis, semântica de candles, `tsc` limpo na época.
- **Sprint 2 — Mercado vivo e operação:** painéis com dados live, SuperDOM interativo (TradingController + bridge), persistência do workspace.
- **Sprints 9–17 + homologações:** Scenario Library, Training Missions, Evaluation, Rules, Feedback, Replay Recorder/Player, Trader Layer, Queue + agressoras, Performance (clock 150ms).
- **Importação histórica (Fases 1–3):** parser CSV, replay engine, projections de leitura.
- **Broker Flow:** analyzer + `brokerFlowStore` (rankings, filtros, detalhe de corretora).
- **UX 1 / UX 2 / UX 3 (parcial):** design system + App Shell; Header/StatusBar/ReplayToolbar globais; SuperDOM e Times & Trades modernizados.
- **Gráfico 8P atemporal:** janela deslizante, auto-follow, drag histórico, zoom com viewport preservado.

Detalhe por sprint: `SPRINT_1.md`, `SPRINT_2.md`, `docs/architecture/SPRINT*.md`.

## Fase atual — Restauração + UX 3 + treinamento avançado

1. **Item 0 (bloqueante):** restaurar módulos `src/` ausentes — sem isso build e testes não passam.
2. **Depois:** executar `BACKLOG.md` na ordem de prioridade (alta → média → baixa).

Notas históricas em `SPRINT_1.md`/`SPRINT_2.md` descrevem o plano original das sprints (ex.: citam `SyntheticMarketProvider` e engines que não existem mais no tree) — valem como contexto, não como estado atual.
