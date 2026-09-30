# Backlog

## Itens Concluídos ✅
- ~~Integrar `SuperDOMPanel` com engine de ordens/execution~~ → TradingController + TraderExecutionBridge
- ~~Persistir configurações e layout do workspace~~ → WorkspaceStore com persist
- ~~Criar suporte a missões, cenários e avaliações~~ → MissionLibrary + EvaluationEngine + RulesEngine
- ~~Sistema de avaliação do trader~~ → FeedbackEngine
- ~~Completar `TradeReplayEngine`~~ → ReplayRecorder + ReplayPlayer
- ~~Fase UX 2 estrutural: Header, StatusBar e ReplayToolbar~~ → controles globais documentados
- ~~Fase UX 3 parcial: SuperDOM e Times & Trades~~ → ergonomia profissional sem alterar core
- ~~Grafico 8P Atemporal: janela deslizante e auto-follow~~ → viewport visual separado do historico logico

## Próxima Sprint (não iniciada)
- Completar UX 3: Book e Volume Profile
- Filtros do Times & Trades e painel expandido de fila do SuperDOM
- Medicao automatizada de FPS/long tasks para o grafico 8P
- Perfis de agressividade do mercado sintético (lento/normal/agressivo)
- TRAINING FIFO opcional (filas menores para mais feedback durante treino)
- Pressão, Resposta e Liquidez (FlowAnalysisEngine Sprint 17)

## Backlog — Alta Prioridade
- Importação de CSV (dados reais da B3 para replay) — Fases 1, 2 e 3 concluídas para parser, engine e projections de leitura
- Estatística de tempo médio de fila por nível
- Indicador de slippage para ordens agressoras
- Visualização avançada da fila no SuperDOM (tooltip expandido ou painel dedicado)
- Remoção futura de `flow:snapshot` (evento legado)
- Remoção futura de `LegacyFlowSnapshotAdapter`
- Exclusão futura dos engines legados em `src/core/flowAnalysis/`

## Backlog — Média Prioridade
- Conectar `dashboard`, `academy` e `analysis` a dados reais
- Implementar roteamento baseado em URL e navegação persistente
- Refinar `PriceLadderPanel` e `OrderBookByBrokerPanel` com dados dinâmicos
- QA completo de Replay Mode (live vs replay com mesma sequência)
- UI completa de importação/replay histórico
- Remoção definitiva do `brokerHistoryStore` legado apos migrar consumidores externos comprovados
- Instalar/definir biblioteca oficial de icones para substituir rotulos compactos dos controles globais
- Teste de cobertura
- Teste de memória prolongado (50k+ execuções)
- Migração de qualquer consumidor externo do contrato legado

## Backlog — Baixa Prioridade
- Adicionar analytics e métricas comportamentais
- Implementar componentes de treinamento guiado para `modules/academy`
- Desenvolver pipeline de `MarketDataProvider` para dados ao vivo
- Warning INEFFECTIVE_DYNAMIC_IMPORT
- Limpeza de exports públicos legados

## Decisões Pendentes — Fase 2 Importação Histórica
- Contrato oficial de `historical:trade:executed`: definido.
- Política de interação com ordens do aluno: isolado por padrão, sem fill automático.
- Adapter explícito para consumidores que esperam `Execution`: pendente para fase posterior.
- Política de stops durante replay histórico: stops protegidos, sem disparo por evento histórico.
- Política de fill das ordens do aluno contra negócios históricos: pendente, exige homologação futura.
