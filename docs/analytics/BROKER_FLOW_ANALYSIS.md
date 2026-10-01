# Broker Flow Analysis

## Finalidade

`BrokerFlowAnalyzer` produz evidencias quantitativas sobre a atuação das corretoras em
negócios observados. Não gera recomendação operacional, não afirma intenção nem trata
corretora como pessoa ou posição real.

## Fonte

`processTrade(trade)` com `MarketTrade` (ou adaptado de `Execution` no feed ao vivo).
Sem React/Zustand; sem `PositionStore`, ordens, stops ou P&L.

## Snapshot por corretora

`BrokerFlowSnapshot`: chave (`code:<n>` ou `name:<nome>`), nome, código, volumes
buy/sell/agressivos, net agressor, RLP buy/sell, market share, activity rate,
persistence score (fração de trades com a corretora), maiores lotes e último timestamp.

`BrokerFlowMarketSnapshot`: brokers + `processedTradeCount` + líderes
(mais ativa, maior compradora/vendedora, maiores nets) + fonte/sessão/timestamp.

Fórmulas: `aggressiveNetVolume = aggressiveBuyVolume − aggressiveSellVolume`;
`marketShare = total / total geral`.

## Categorias

`BUY`: buyer agressor / seller passivo. `SELL`: inverso. `RLP`/`DIRECT`/`AUCTION`/`UNKNOWN`:
preservam lados, acumulam buckets próprios, sem agressão direcional.

## O que não existe (ao contrário de rascunhos antigos)

Sem VWAPs por corretora, sem janelas deslizantes configuráveis, sem concentração por preço,
sem resposta observada de preço, sem contagem out-of-order, sem seek com rebuild, sem
`BrokerFlowToLegacyBrokerHistoryAdapter` e sem evento `broker:flow:snapshot:updated` —
o snapshot vai direto `analyzer → store`. `brokerHistoryStore` (vivo) e
`historicalBrokerHistoryStore` (replay) coexistem com papéis próprios.

## Limitações

- Não revela cliente final nem posição real.
- Não confirma iceberg; não mede cancelamentos.
- Não infere manipulação, intenção ou recomendação.
