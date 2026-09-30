# Historical Market Projections

## Objetivo

As projections transformam `historical:trade:executed` em dados de leitura de mercado para UI e analise, sem passar pelo `MatchingEngine`.

Fluxo oficial:

```txt
historical:trade:executed
  -> HistoricalMarketDataProjection
  -> market:trade:observed
  -> stores historicos / FlowAnalysis / last price
```

## Eventos

```txt
market:trade:observed
market:last-price:update
market:projection:reset
market:source:changed
```

`market:trade:observed` representa mercado observado. Ele nao representa execucao do simulador e nao deve ser consumido por `MatchingEngine`, `TraderExecutionBridge`, `RiskEngine`, `PositionStore`, stop logic ou P&L.

## Stores

Stores historicos separados:

- `useHistoricalTradeStore`
- `useHistoricalVolumeProfileStore`
- `useHistoricalBrokerHistoryStore`
- `useHistoricalLastPriceStore`
- `useMarketDataSourceStore`

Os stores de execution continuam separados:

- `useTradeStore`
- `useVolumeProfileStore`
- `useBrokerHistoryStore`
- `useBookStore`

Os paineis escolhem dados historicos apenas quando `sourceMode = HISTORICAL_FILE`.

## Broker Flow Analyzer

`market:trade:observed` tambem alimenta o `BrokerFlowAnalyzer`, fonte oficial das metricas avancadas por corretora.

O dashboard visual usa o fluxo oficial:

```txt
BrokerFlowAnalyzer
  -> broker:flow:snapshot:updated
  -> brokerFlowStore
  -> BrokerHistoryPanel
```

O Broker History legado permanece apenas como compatibilidade temporaria por adapter:

```txt
BrokerFlowMarketSnapshot
  -> BrokerFlowToLegacyBrokerHistoryAdapter
```

O adapter apenas transforma contratos e nao recalcula metricas.

## Times & Trades

Recebe todos os `MarketTrade` projetados. O estado logico conta todos os trades; a lista visual e limitada para performance.

Categorias:

- `BUY`: agressao compradora.
- `SELL`: agressao vendedora.
- `RLP`: categoria propria.
- `DIRECT`: categoria propria.
- `AUCTION`: categoria especial.
- `UNKNOWN`: neutro/desconhecido.

## Volume Profile

Atualizacao incremental por preco:

- `totalVolume`
- `buyVolume`
- `sellVolume`
- `neutralVolume`
- `rlpVolume`
- `directVolume`
- `auctionVolume`
- `unknownVolume`
- `tradeCount`
- `delta`

`delta = buyVolume - sellVolume`.

`RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` nao entram no delta direcional padrao.

## Broker History

Para cada trade:

- buyer recebe volume de compra total;
- seller recebe volume de venda total;
- BUY cria agressao compradora no buyer e passivo vendedor no seller;
- SELL cria agressao vendedora no seller e passivo comprador no buyer;
- RLP/DIRECT/AUCTION/UNKNOWN preservam buyer e seller em categorias proprias.

Nao se interpreta corretora como trader individual nem como posicao liquida real.

## Last Price

`market:last-price:update` atualiza o ultimo preco observado de mercado historico.

Nao atualiza:

- preco medio da posicao;
- fill price;
- stop price;
- P&L.

## Grafico Atemporal

O grafico 8P reutiliza a regra atemporal de 8 pontos. Ele recebe trades historicos como pontos de leitura:

- `price`
- `quantity`
- `aggressor`
- `timestamp`
- `sequence`

Tipos neutros atualizam preco e range, mas nao alteram delta direcional do candle.

O fechamento do candle depende exclusivamente de `high - low >= 8,00 pontos`. Para WDO, `tickSize = 0,50`, logo 8 pontos equivalem a 16 ticks. Timestamp, velocidade do replay, quantidade de trades e volume nao fecham candle.

## FlowAnalysis

`HistoricalFlowProjection` converte somente BUY e SELL para `FlowTradeEvent`.

Tipos neutros:

- nao sao forcados para compra/venda;
- nao alteram delta direcional;
- nao ativam sinais;
- podem continuar auditaveis nos stores historicos.

Todos os FlowSignals permanecem `false`.

## Source Mode

`SimulationKernel.setMarketDataSource(mode)` integra:

```txt
SYNTHETIC
SCENARIO
HISTORICAL_FILE
LIVE_FUTURE
```

Ao entrar em `HISTORICAL_FILE`, o kernel pausa o clock sintetico, limpa scenario script, reseta FlowAnalysis e usa `MarketDataSourceGuard` para impedir fonte simultanea.

## Reset

`market:projection:reset` limpa:

- Times & Trades historico;
- Volume Profile historico;
- Broker History historico;
- last price historico;
- buffers visuais historicos.

Nao limpa:

- layout;
- preferencias;
- posicao;
- ordens do aluno;
- P&L.

## Performance

O core processa todos os trades. A UI usa listas visuais limitadas e projections incrementais para evitar renderizacao por estruturas gigantes.

O teste de carga cobre 10.000 e 100.000 trades. O CSV real de 39.292 trades tambem e validado.

## Limitacoes

- Nao ha importador visual completo nesta fase.
- Volume Profile ainda recalcula exibicao do conjunto de niveis a cada evento, mas usa acumulador incremental e o CSV real permanece validado.
- A pausa automatica do replay historico via toolbar dedicada ainda deve ser desenhada em camada de produto futura.
