# Broker Flow Analysis

## Finalidade

`BrokerFlowAnalyzer` produz evidencias quantitativas sobre a atuacao das corretoras em negocios observados.

Ele nao gera recomendacao operacional, nao afirma intencao e nao interpreta corretora como uma pessoa ou como posicao real.

## Fonte

O analyzer consome:

```txt
market:trade:observed
```

Em testes, tambem pode receber `MarketTrade` por injecao explicita.

Ele nao consome `matching:execution:created` e nao depende de React, Zustand, `MatchingEngine`, `PositionStore`, ordens, stops ou P&L.

## Contratos

Snapshots principais:

- `BrokerFlowSnapshot`
- `BrokerFlowMarketSnapshot`
- `BrokerPriceConcentrationSnapshot`
- `BrokerPriceResponseSnapshot`

Evento:

```txt
broker:flow:snapshot:updated
```

## Broker Key

```txt
CODE:<code>
NAME:<normalizedName>
```

Nao ha fusao por similaridade textual.

## Formulas

```txt
aggressiveNetVolume = aggressiveBuyVolume - aggressiveSellVolume
totalNetVolume = totalBuyVolume - totalSellVolume
marketShare = (totalBuyVolume + totalSellVolume) / max(totalMarketSideVolume, 1)
aggressiveMarketShare = (aggressiveBuyVolume + aggressiveSellVolume) / max(totalDirectionalAggressiveVolume, 1)
directionalAggression = aggressiveNetVolume / max(aggressiveBuyVolume + aggressiveSellVolume, 1)
```

`directionalAggression` fica entre `-1` e `1`.

`totalNetVolume` nao representa posicao real, estoque ou intencao da corretora.

## VWAP

VWAPs sao calculados por soma ponderada:

```txt
sum(price * quantity) / sum(quantity)
```

Campos:

- `buyVWAP`
- `sellVWAP`
- `aggressiveBuyVWAP`
- `aggressiveSellVWAP`

Quando volume e zero, retorna `null`.

## Categorias

BUY:
- buyer = agressor comprador;
- seller = passivo vendedor.

SELL:
- seller = agressor vendedor;
- buyer = passivo comprador.

RLP, DIRECT, AUCTION e UNKNOWN:
- preservam buyer e seller;
- acumulam buckets proprios;
- nao alteram agressao direcional;
- nao alteram mudanca de lado.

## Janelas

Configuracao padrao:

```txt
1s, 5s, 15s, 30s, 60s, 300s, sessao completa
```

As janelas usam timestamp do trade, nao `Date.now()`.

## Persistencia

Formula:

```txt
persistenceScore =
  0.40 * directionalShare
+ 0.25 * normalizedStreak
+ 0.20 * normalizedFrequency
+ 0.15 * regularity
```

`persistenceSide` e `BUY`, `SELL` ou `NEUTRAL` conforme threshold configurado.

Persistencia nao e previsao nem sinal de compra/venda.

## Mudanca De Lado

Conta somente alternancia direcional:

```txt
BUY -> SELL
SELL -> BUY
```

Neutros entre agressões sao ignorados:

```txt
BUY -> RLP -> DIRECT -> SELL
```

conta uma mudanca.

## Concentracao Por Preco

Por corretora e preco:

- total buy/sell;
- aggressive buy/sell;
- passive buy/sell;
- trade count;
- aggressive net.

O snapshot retorna top niveis configuraveis.

## Resposta Observada Do Preco

Horizontes:

```txt
1s, 5s, 15s, 30s
```

Para BUY:

```txt
futurePrice - aggressionPrice
```

Para SELL:

```txt
aggressionPrice - futurePrice
```

Resultado em ticks.

Nome correto: resposta observada apos atuacao.

Nao afirmar causalidade.

## Broker History Legado

O painel visual foi migrado para o store oficial:

```txt
broker:flow:snapshot:updated
  -> brokerFlowStore
  -> useBrokerFlow + seletores
  -> BrokerHistoryPanel / Broker Flow Dashboard
```

`brokerHistoryStore` esta `@deprecated` para UI e nao deve ser ativado para alimentar o painel.

A integracao legado segue apenas como compatibilidade temporaria por adapter:

```txt
BrokerFlowMarketSnapshot
  -> BrokerFlowToLegacyBrokerHistoryAdapter
```

O adapter transforma contratos e nao recalcula metricas.

## Eventos Fora De Ordem

Acumulados ordenados sao esperados da projection. Se chegar trade com timestamp anterior ao ultimo processado, o analyzer ignora para proteger janelas/resposta e incrementa `outOfOrderCount`.

## Seek

Seek para tras nao deve preservar metricas futuras. Politica segura:

- resetar analyzer;
- reconstruir explicitamente ate o indice desejado;
- ou marcar estado como nao reconstruido.

## Performance

O analyzer usa acumuladores incrementais e publica snapshots consolidados. Buffers temporais usam ponteiros, evitando `Array.shift()` no caminho critico.

Testes cobrem CSV real de 39.292 trades e carga de 100.000 trades.

## Limitacoes

- Nao revela cliente final.
- Nao revela posicao real da corretora.
- Nao confirma iceberg.
- Nao mede ordens canceladas.
- Nao infere manipulacao ou intencao.
- Nao gera recomendacao operacional.
