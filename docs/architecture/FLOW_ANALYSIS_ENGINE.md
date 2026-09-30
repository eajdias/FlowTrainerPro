# FLOW ANALYSIS ENGINE (FASE 1)

## Finalidade do modulo
O modulo `FlowAnalysisEngine` observa o fluxo de mercado e publica snapshots objetivos de leitura de fluxo.

Ele existe para suporte de treinamento e analise. Nao executa ordens, nao altera estado de mercado e nao aplica regras operacionais.

## O que observa
Eventos consumidos (contratos reais e aliases de compatibilidade):
- `book:update`
- `matching:execution:created`
- `matching:trade:executed` (legado)
- `trade:position:updated`
- `ordermanager:position:updated`
- `market:last-price:update` (quando presente)

Aliases de compatibilidade da Sprint 15 (opcionais):
- `BOOK_UPDATE`
- `TRADE_EXECUTED`
- `BROKER_HISTORY_UPDATE`
- `VOLUME_PROFILE_UPDATE`
- `LAST_PRICE_UPDATE`
- `POSITION_UPDATE`

## O que nao pode fazer
- Nao enviar ordens.
- Nao alterar `MatchingEngine`, `OrderBookEngine`, `ExecutionEngine`, `RiskEngine` ou `MarketScenarioEngine`.
- Nao alterar Store diretamente.
- Nao depender de React, Zustand ou componentes visuais.
- Nao substituir o EventBus oficial.

## Ciclo de vida
Composicao oficial no Kernel:
- Instancia unica criada em `SimulationKernel`.
- `start()` chamado no `initialize()` e novamente em `start()`/`resume()` (idempotente).
- `stop()` chamado em `pause()` e `stop()` (idempotente).
- `reset()` chamado em `kernel.reset()` sem recriar a instancia.

## Evento publicado
O engine publica continuamente:
- `flow:analysis:snapshot:updated`

Payload:
- `FlowAnalysisSnapshot`

## Estrutura do snapshot
`FlowAnalysisSnapshot` contem:
- `metrics: FlowMetricsSnapshot`
- `context: FlowContextSnapshot`
- `signals: FlowSignalSnapshot`
- `timestamp: number`

### Metrics (fase 1)
- buyerAggressorVolume
- sellerAggressorVolume
- delta
- cumulativeDelta
- tradeCount
- tradedVolume
- tradeVelocity
- tradeVelocityMovingAverage
- averageVolumePerTrade
- largestRecentAggression
- lastAggression
- lastAggressorSide
- aggressionSequence

### Context
- currentPrice
- lastTrade
- currentDelta
- currentAggressor
- tradeVelocity
- marketState
- bookSnapshot
- timestamp

### Signals (fase 1)
Todos permanecem `false`:
- isAbsorption
- isExhaustion
- isMomentum
- isPullback
- isBreakout
- isFakeBreakout
- isReversal
- isHighFrequency
- isLowLiquidity

## Politica de imutabilidade
- Snapshots sao publicados como objetos congelados (`Object.freeze`).
- Estruturas aninhadas relevantes do contexto (book levels e arrays) sao copiadas e congeladas.
- Alteracoes externas no payload original nao alteram o snapshot armazenado.

## Comportamento de reset
`reset()`:
- zera metricas e contexto;
- preserva a instancia do engine;
- publica novo snapshot zerado;
- nao recria assinaturas automaticamente (controle feito por `start()`/`stop()`).

## Integracao com Live Mode
No modo live, o engine observa os mesmos eventos de execucao e livro usados no kernel. O processamento e passivo e nao interfere no fluxo de mercado.

## Integracao com Replay Mode
No replay, o engine continua observando o EventBus oficial e opera sobre os eventos reproduzidos. A leitura permanece deterministica para a mesma sequencia de eventos.

## Integracao com Replay Historico
O replay historico nao emite `matching:execution:created`.

A integracao ocorre por adapter explicito:

```txt
historical:trade:executed
  -> market:trade:observed
  -> HistoricalFlowProjection
  -> TRADE_EXECUTED
  -> FlowAnalysisEngine
```

Somente `BUY` e `SELL` sao convertidos para `FlowTradeEvent`.

`RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` nao sao forcados para lado direcional, nao alteram delta padrao e nao ativam novos sinais.

## Limitacoes atuais
- Nao interpreta sinais operacionais.
- Nao classifica absorcao/exaustao/momentum/pullback/rompimento.
- Nao possui IA, coach, HUD ou feedback visual.
- Eventos de broker history, volume profile e last price podem nao existir em todos os fluxos; o engine funciona mesmo assim.

## Sinais ainda nao implementados
Todos os `FlowSignals` continuam `false` nesta fase.
