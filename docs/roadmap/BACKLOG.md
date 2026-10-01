# Backlog

Fonte única do que falta fazer. Ordem = prioridade. `PROJECT_STATUS.md` e `ROADMAP.md` linkam para cá — não duplicar listas lá.

## Item 0 — Pré-requisito (concluído ✅ 2026-10-01)

- ~~Restaurar módulos `src/` ausentes que quebram build e testes~~ → criados a partir dos contratos (imports + testes como spec); nada existia no histórico para restaurar.
- Evidência: `npx tsc --noEmit` → **0 erros**; `npx vitest run` → **26/26**; `npx vite build` ok; validado no navegador (kernel RUNNING, ladder ao vivo, click→posição, 0 erros de console).

## Alta prioridade

- [x] Completar UX 3: Book e Volume Profile → `PriceBook`, `VolumeProfile` implementados
- [x] Filtros do Times & Trades + painel expandido de fila do SuperDOM → filtros lado/lote + coluna Slip; seção Fila com estados e espera média
- [x] Perfis de agressividade do mercado (lento/normal/agressivo) → tuning no gerador + seletor na toolbar
- [x] TRAINING FIFO opcional (filas menores para mais feedback durante treino) → flag no kernel + checkbox
- [x] Pressão, Resposta e Liquidez (FlowAnalysisEngine Sprint 17) → engine + feed ao vivo (baseline 120 fills) + leitura no Debug
- [x] Indicador de slippage para ordens agressoras → `slippageTicks` por fill + coluna Slip
- [x] Estatística de tempo médio de fila por nível → `getQueueTimeStats` + seção Fila

## Média prioridade

- [ ] Conectar `dashboard`, `academy` e `analysis` a dados reais
- [ ] Roteamento baseado em URL e navegação persistente
- [x] Refinar `PriceLadderPanel` e `OrderBookByBrokerPanel` com dados dinâmicos → leem `marketStore` ao vivo
- [x] UI completa de importação/replay histórico → `ReplayPlayer` (CSV→engine→projections→stores) + `ReplayInspector`
- [ ] QA completo de Replay Mode (live vs replay com mesma sequência)
- [ ] Medição automatizada de FPS/long tasks para o gráfico 8P
- [ ] Teste de cobertura
- [ ] Teste de memória prolongado (50k+ execuções)

## Baixa prioridade

- [ ] Analytics e métricas comportamentais
- [ ] Componentes de treinamento guiado para `modules/academy`
- [ ] Pipeline de `MarketDataProvider` para dados ao vivo
- [ ] Remoção de código legado (`flow:snapshot`, `LegacyFlowSnapshotAdapter`, engines antigos em `src/core/flowAnalysis/`)
- [ ] Remoção definitiva do `brokerHistoryStore` legado após migrar consumidores externos comprovados
- [ ] Biblioteca oficial de ícones para substituir rótulos compactos dos controles globais
- [ ] Warning INEFFECTIVE_DYNAMIC_IMPORT
- [ ] Limpeza de exports públicos legados

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

Verificado em disco em 2026-10-01: `tsc` 0 erros, `vitest` 26/26, `vite build` ok, loop trader validado no navegador. O que falta: **(a)** recursos de treinamento avançados (perfis de agressividade, TRAINING FIFO, slippage, tempo de fila), **(b)** filtros do Times & Trades + fila expandida, consumo do FlowAnalysis pelos painéis, **(c)** roteamento URL, QA de replay, FPS do 8P, cobertura.
