# Historical Market Data Pipeline

## Decisao arquitetural

A Fase 1 da importacao historica fica isolada do replay, do `EventBus`, do `MatchingEngine`, de React e de Zustand.

O pipeline aprovado nesta fase e:

```txt
CSV
  -> CsvTradeParser
  -> TradeNormalizer
  -> TradeValidator
  -> MarketTrade[]
  -> ImportDiagnostics
```

## Por que `matching:execution:created` nao e usado diretamente

`matching:execution:created` representa uma execucao produzida pelo `MatchingEngine` do simulador. Esse evento possui consumidores com efeitos colaterais, como `ExecutionEngine`, `TraderExecutionBridge`, verificacao de stops, stores de sessao e calculos ligados as ordens do aluno.

Uma linha de CSV historico e um negocio observado no mercado real. Ela nao e um fill de ordem do aluno e nao foi produzida pelo matching interno do simulador.

Emitir linhas historicas diretamente como `matching:execution:created` poderia:

- disparar verificacao de stops do aluno;
- atualizar contadores de sessao como se o matching interno tivesse executado;
- confundir execucao historica com fill do trader;
- forcar `RLP`, `Direto` e `Leilao` para `buy | sell`, perdendo semantica.

## Diferenca entre negocio historico e execucao do matching

- `MarketTrade`: negocio real importado de arquivo, observado historicamente, sem relacao automatica com ordens do aluno.
- `Execution`: resultado produzido pelo `MatchingEngine` interno ao cruzar ordens do simulador.

Esses contratos podem ser adaptados no futuro, mas nao sao equivalentes.

## Contrato normalizado

`MarketTrade` preserva os dados historicos sem nomes de dominio em portugues:

- `tradeId`
- `sourceLine`
- `sourceSequence`
- `chronologicalSequence`
- `asset`
- `tradeDate`
- `tradeTime`
- `timestamp`
- `price`
- `priceInTicks`
- `quantity`
- `buyerBroker`
- `sellerBroker`
- `aggressor`
- `source`
- `syntheticReplayOffsetMs` opcional futuro

O contrato e imutavel por `Object.freeze` na saida do parser.

## IDs deterministas

Como o arquivo nao possui ID unico nem milissegundos, o `tradeId` e derivado de campos estaveis:

```txt
asset | tradeDate | tradeTime | chronologicalSequence | price | quantity | buyerBroker | sellerBroker | aggressor
```

A mesma importacao deve produzir os mesmos IDs.

## Ordem temporal

O arquivo real informado vem em ordem cronologica decrescente. O parser detecta a direcao predominante dos timestamps e retorna `MarketTrade[]` em ordem crescente.

Para negocios no mesmo segundo:

- em arquivo descendente, usa `sourceSequence` decrescente como desempate;
- em arquivo ascendente, usa `sourceSequence` crescente;
- `timestamp` historico nao recebe milissegundos inventados.

Se a Fase 2 precisar de espacamento visual, ele devera usar `syntheticReplayOffsetMs` separado, sem alterar o timestamp historico original.

## Agressor

Mapeamento:

- `Comprador` -> `BUY`
- `Vendedor` -> `SELL`
- `RLP` -> `RLP`
- `Direto` -> `DIRECT`
- `Leilao` / `Leilão` -> `AUCTION`
- demais valores -> `UNKNOWN`

`RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` nao sao forcados para lado direcional.

## Diagnostico

`ImportDiagnostics` registra numeros rastreaveis:

- linhas fisicas;
- linhas vazias;
- validas e invalidas;
- warnings;
- duplicadas;
- fora de ordem;
- agressores desconhecidos;
- primeiro e ultimo timestamp;
- faixa de preco;
- quantidade total;
- corretoras unicas;
- contagem e volume por agressor;
- linhas invalidas com `sourceLine`, `reasonCode`, `message` e `rawLine` truncado com limite seguro;
- tempo de parsing.

## Fase 2 pendente

Na Fase 2 foi criado um replay historico isolado em:

```txt
src/core/marketData/replay/
```

O evento proprio oficial e:

```txt
historical:trade:executed
```

Esse evento representa `BUY`, `SELL`, `RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` sem efeitos colaterais sobre matching, ordens, posicoes ou stops do aluno.

O replay possui lifecycle `load`, `start`, `pause`, `resume`, `stop`, `reset`, `unload`, `setSpeed`, `seek` e `getState`. O estado e imutavel e registra progresso, indice atual, timestamps, velocidade, trades restantes e ultimo trade emitido.

## Replay historico

Principios:

- `MarketTrade` original nao e alterado.
- `historical:trade:executed` nao e convertido automaticamente em `matching:execution:created`.
- `RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` nao sao forcados para lado direcional.
- timestamps historicos sao preservados.
- offsets sinteticos existem apenas para espacamento de replay.
- chunks com budget evitam bloqueio da main thread.
- `MarketDataSourceGuard` impede fontes autoritativas simultaneas.

Caso algum consumidor espere `Execution`, devera existir adapter explicito apenas para leitura de mercado e somente para tipos compativeis.

Replay historico nao pode abrir posicao, fechar posicao, disparar stop ou preencher ordem do aluno sem politica homologada.

Documento especifico:

```txt
docs/architecture/HISTORICAL_REPLAY_ENGINE.md
```

## Fase 3: projections de leitura

A Fase 3 conecta o replay historico aos paineis de leitura via projections neutras:

```txt
historical:trade:executed
  -> market:trade:observed
  -> stores historicos / FlowAnalysis / last price
```

Nao ha emissao de `matching:execution:created`.

Documento especifico:

```txt
docs/architecture/HISTORICAL_MARKET_PROJECTIONS.md
```
