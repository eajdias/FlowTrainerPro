# Backlog

Fonte única do que falta fazer. Ordem = prioridade. `PROJECT_STATUS.md` e `ROADMAP.md` linkam para cá — não duplicar listas lá.

## Item 0 — Pré-requisito (concluído ✅ 2026-10-01)

- ~~Restaurar módulos `src/` ausentes que quebram build e testes~~ → criados a partir dos contratos (imports + testes como spec); nada existia no histórico para restaurar.
- Evidência: `npx tsc --noEmit` → **0 erros**; `npx vitest run` → **42/42**; `npx vite build` ok; validado no navegador (kernel RUNNING, ladder e candles ao vivo, click→posição, fluxo/brokers ao vivo, 0 erros de console).

## Alta prioridade

- [x] Completar UX 3: Book e Volume Profile → `PriceBook`, `VolumeProfile` implementados
- [x] Filtros do Times & Trades + painel expandido de fila do SuperDOM → filtros lado/lote + coluna Slip; seção Fila com estados e espera média
- [x] Perfis de agressividade do mercado (lento/normal/agressivo) → tuning no gerador + seletor na toolbar
- [x] TRAINING FIFO opcional (filas menores para mais feedback durante treino) → flag no kernel + checkbox
- [x] Pressão, Resposta e Liquidez (FlowAnalysisEngine Sprint 17) → engine + feed ao vivo (baseline 120 fills) + leitura no Debug
- [x] Indicador de slippage para ordens agressoras → `slippageTicks` por fill + coluna Slip
- [x] Estatística de tempo médio de fila por nível → `getQueueTimeStats` + seção Fila

## Média prioridade

- [x] Conectar `dashboard`, `academy` e `analysis` a dados reais → rotas com stores reais (sessão, missões, fluxo, rankings)
- [x] Roteamento baseado em URL e navegação persistente → hash `#/rota` + workspace persistido
- [x] Refinar `PriceLadderPanel` e `OrderBookByBrokerPanel` com dados dinâmicos → leem `marketStore` ao vivo
- [x] UI completa de importação/replay histórico → `ReplayPlayer` (CSV→engine→projections→stores) + `ReplayInspector`
- [x] QA completo de Replay Mode (live vs replay com mesma sequência) → `tests/replayQA` (determinismo + cadeia replay→stores)
- [x] Medição automatizada de FPS/long tasks para o gráfico 8P → contador longtask no Debug (PerformanceObserver)
- [x] Teste de cobertura → `@vitest/coverage-v8`: EventBus 100%, kernel 88%, volumeAnomaly 83%, marketData 67%
- [x] Teste de memória prolongado (50k+ execuções) → 50k fills em ~18ms / 23MB heap

## Baixa prioridade

- [x] Analytics e métricas comportamentais → rota Analysis (pressão, absorções, rankings) + Debug
- [x] Componentes de treinamento guiado para `modules/academy` → rota Academy (regras, dicas, objetivos por missão; `src/modules` nunca existiu — academy vive na rota)
- [ ] Pipeline de `MarketDataProvider` para dados ao vivo → ADIADO: exige credenciais de corretora/dados (bloqueio externo, não código)
- [x] Remoção de código legado (`flow:snapshot`, `LegacyFlowSnapshotAdapter`, engines antigos) → verificado: zero referências em `src/`
- [ ] Biblioteca oficial de ícones para substituir rótulos compactos dos controles globais → ADIADO: rótulos texto funcionam; cosmético
- [x] Warning INEFFECTIVE_DYNAMIC_IMPORT → verificado: `vite build` sem warnings
- [x] Limpeza de exports públicos legados → barrels conferem com registry/consumidores; `tsc` 0 erros
- [x] `brokerHistoryStore` legado → mantido com justificativa: atende book vivo por corretora; rankings vivem no `brokerFlowStore`

## Concluídos ✅

- ~~Integrar `SuperDOMPanel` com engine de ordens/execution~~ → TradingController + TraderExecutionBridge
- ~~Persistir configurações e layout do workspace~~ → WorkspaceStore com persist
- ~~Missões, cenários e avaliações~~ → MissionLibrary + EvaluationEngine + RulesEngine
- ~~Avaliação do trader~~ → FeedbackEngine
- ~~`TradeReplayEngine`~~ → ReplayRecorder + ReplayPlayer
- ~~Fase UX 2 estrutural~~ → Header, StatusBar e ReplayToolbar globais
- ~~Fase UX 3 parcial~~ → SuperDOM e Times & Trades modernizados sem alterar core
- ~~Gráfico 8P atemporal~~ → janela deslizante e auto-follow
- ~~Importação CSV~~ → parser, engine e projections de leitura (Fases 1–3)

## Decisões pendentes — importação histórica

- Contrato oficial de `historical:trade:executed`: definido.
- Interação com ordens do aluno: isolado por padrão, sem fill automático.
- Adapter para consumidores que esperam `Execution`: pendente.
- Stops durante replay histórico: protegidos, sem disparo por evento histórico.
- Fill das ordens do aluno contra negócios históricos: pendente, exige homologação futura.

## Resumo do estado

Verificado em disco em 2026-10-01: `tsc` 0 erros, `vitest` 42/42, `vite build` ok, loop trader + fluxo/brokers/candles ao vivo validados no navegador (0 erros de console). Backlog: alta 100%, média 100%, baixa completa exceto 2 adiados com motivo (live provider: bloqueio externo; ícones: cosmético).
