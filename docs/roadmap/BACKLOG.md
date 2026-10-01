# Backlog

Fonte única do que falta fazer. Ordem = prioridade. `PROJECT_STATUS.md` e `ROADMAP.md` linkam para cá — não duplicar listas lá.

## Item 0 — Pré-requisito (bloqueia tudo)

- [ ] Restaurar módulos `src/` ausentes que quebram build e testes (lista: `docs/Architecture.md` § Ausências).
- Evidência atual (2026-10-01): `npx vitest run` → **17/18 arquivos falham** na coleta (imports de `src/core/kernel/*`, `src/core/flowAnalysis/*`, `src/panels/*/` inexistentes); só `tests/brokerFlow/brokerFlowStore.test.ts` passa (5 testes). `tsc` falha pelos mesmos imports.
- Sem isso, nenhum item abaixo é verificável.

## Alta prioridade

- [ ] Completar UX 3: Book e Volume Profile
- [ ] Filtros do Times & Trades + painel expandido de fila do SuperDOM
- [ ] Perfis de agressividade do mercado (lento/normal/agressivo)
- [ ] TRAINING FIFO opcional (filas menores para mais feedback durante treino)
- [ ] Pressão, Resposta e Liquidez (FlowAnalysisEngine Sprint 17)
- [ ] Indicador de slippage para ordens agressoras
- [ ] Estatística de tempo médio de fila por nível

## Média prioridade

- [ ] Conectar `dashboard`, `academy` e `analysis` a dados reais
- [ ] Roteamento baseado em URL e navegação persistente
- [ ] Refinar `PriceLadderPanel` e `OrderBookByBrokerPanel` com dados dinâmicos
- [ ] QA completo de Replay Mode (live vs replay com mesma sequência)
- [ ] UI completa de importação/replay histórico
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

Núcleo sólido e homologado (simulação, matching, treinamento) com suíte de testes registrada. Arquitetura bem separada entre universo do mercado e universo do trader. O que falta é principalmente: **(a)** restaurar os módulos `src/` ausentes (item 0), **(b)** polimento de UX (completar painéis), **(c)** recursos de treinamento avançados (perfis de agressividade, slippage, fila) e **(d)** integração com dados reais (`dashboard`, `academy`, `analysis` ainda não conectados).
