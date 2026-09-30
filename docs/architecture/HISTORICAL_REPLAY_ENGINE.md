# Historical Replay Engine

## Objetivo

O `HistoricalReplayEngine` transforma `MarketTrade[]` importados em eventos de mercado historico observados, sem passar pelo `MatchingEngine`.

O contrato principal e:

```txt
historical:trade:executed
```

Esse evento representa um negocio real observado no arquivo historico. Ele nao representa fill do aluno, execucao do simulador, ordem enviada ao book ou resultado de FIFO interno.

## Arquivos

```txt
src/core/marketData/replay/
  HistoricalReplayController.ts
  HistoricalReplayClock.ts
  HistoricalTradeReplaySource.ts
  HistoricalReplayEvents.ts
  HistoricalReplayErrors.ts
  HistoricalReplayTypes.ts
  MarketDataSourceGuard.ts
  index.ts
```

## Evento principal

```ts
interface HistoricalTradeExecutedEvent {
  readonly trade: MarketTrade;
  readonly replaySessionId: string;
  readonly sequence: number;
  readonly historicalTimestamp: number;
  readonly emittedAtMonotonicTime: number;
  readonly speed: 0.5 | 1 | 2 | 4 | 8 | 16;
}
```

O payload e congelado antes da publicacao. O `MarketTrade` original nao e alterado.

## Eventos de lifecycle

```txt
historical:replay:loaded
historical:replay:started
historical:replay:paused
historical:replay:resumed
historical:replay:stopped
historical:replay:reset
historical:replay:completed
historical:replay:state:updated
historical:replay:error
historical:trade:executed
```

## Estados

```txt
IDLE -> LOADED -> PLAYING -> PAUSED -> PLAYING -> COMPLETED
              \-> STOPPED -> PLAYING
              \-> ERROR

LOADED/PLAYING/PAUSED/STOPPED/COMPLETED -> reset -> LOADED
qualquer estado com lista carregada -> unload -> IDLE
```

`stop()` preserva o indice atual. `reset()` volta para o indice zero e preserva a lista carregada. `unload()` remove trades e sessao.

## Snapshot de estado

O controller expoe snapshot imutavel com:

- `status`
- `replaySessionId`
- `currentIndex`
- `totalTrades`
- `remainingTrades`
- `progress`
- `speed`
- `currentTimestamp`
- `firstTimestamp`
- `lastTimestamp`
- `elapsedHistoricalMs`
- `lastEmittedTradeId`
- `error`

`progress` e sempre limitado entre `0` e `1`, sem `NaN` ou `Infinity`.

## Politica temporal

Para timestamps diferentes:

```txt
delayBase = timestampAtual - timestampAnterior
delayReplay = delayBase / speed
```

Para negocios no mesmo segundo, o engine preserva `chronologicalSequence` e usa:

1. `syntheticReplayOffsetMs`, se existir;
2. distribuicao deterministica dentro do segundo, quando nao existir.

Esses offsets sao apenas espacamento de replay. Eles nao sao milissegundos reais da bolsa e nao substituem o timestamp historico.

## Scheduler

O `HistoricalReplayClock` separa tempo monotono, timer e cancelamento. O controller processa negocios em chunks com `maxTradesPerCycle`, cedendo a thread entre lotes. Isso evita loops sincronicos longos durante bursts com muitos negocios no mesmo instante.

## Velocidades

Velocidades oficiais:

```txt
0.5x, 1x, 2x, 4x, 8x, 16x
```

Mudancas de velocidade durante `PLAYING` afetam somente os proximos delays. O indice atual nao e reiniciado, nenhum trade e repetido e nenhum trade e pulado.

## Source mode

`MarketDataSourceGuard` define exclusividade para:

```txt
SYNTHETIC
SCENARIO
HISTORICAL_FILE
LIVE_FUTURE
```

Nesta fase, o guard impede duas fontes autoritativas simultaneas e dois replay controllers ativos ao mesmo tempo. O ponto de composicao com `SimulationKernel` fica documentado para etapa futura: ao entrar em `HISTORICAL_FILE`, o kernel deve pausar o gerador sintetico/cenario antes de iniciar a fonte historica.

## Seek

`seek()` reposiciona sem reconstruir silenciosamente eventos passados. Sao aceitos:

- indice;
- percentual;
- timestamp.

Nenhum `historical:trade:executed` retroativo e emitido durante seek.

## Isolamento

O replay historico nao:

- emite `matching:execution:created`;
- chama `MatchingEngine.submit`;
- altera FIFO;
- abre ou fecha posicao do aluno;
- dispara stops;
- atualiza P&L;
- gera `trader:order:filled`;
- passa pelo `TraderExecutionBridge`;
- forca `RLP`, `DIRECT`, `AUCTION` ou `UNKNOWN` para lado direcional.

## Erros

Erros tipados cobrem:

- lista vazia;
- ordem cronologica invalida;
- velocidade invalida;
- seek invalido;
- transicao de estado invalida;
- conflito de source mode;
- falha de scheduler;
- trade invalido em runtime.

Falhas cancelam timers ativos quando necessario.

## Limitacoes atuais

- `SimulationKernel.setMarketDataSource(mode)` integra o source mode e bloqueia emissao simultanea quando `HISTORICAL_FILE` esta ativo.
- Volume Profile, Broker History, grafico e FlowAnalysis consomem replay historico por projections neutras.
- Nao ha adapter global automatico de `MarketTrade` para `Execution`.
- Nao ha UI completa de importacao nesta fase.
