# Historical Replay Engine

## Objetivo

Transforma `MarketTrade[]` importados em eventos de mercado histórico observados, sem passar pelo `MatchingEngine`.

**Evento principal:** `historical:trade:executed`

## Arquivos

```
src/core/marketData/replay/
  HistoricalReplayController.ts
  HistoricalReplayClock.ts
  HistoricalTradeReplaySource.ts
  HistoricalReplayEvents.ts
  HistoricalReplayErrors.ts
  HistoricalReplayTypes.ts
  MarketDataSourceGuard.ts
```

## Eventos de lifecycle

`loaded` → `started` → `paused` → `resumed` → `stopped` → `completed` → `reset` → `error`

## Estados

```
IDLE → LOADED → PLAYING → PAUSED → PLAYING → COMPLETED
                  ↘ STOPPED → PLAYING
                  ↘ ERROR
```

## Política temporal

- `delayReplay = (timestampAtual - timestampAnterior) / speed`
- Negócios no mesmo segundo: usa `syntheticReplayOffsetMs` ou distribuição determinística
- Offsets são apenas espacamento de replay, não substituem timestamp histórico

## Velocidades

`0.5x`, `1x`, `2x`, `4x`, `8x`, `16x` — mudança em runtime não reinicia o índice.

## Source mode

`MarketDataSourceGuard` define exclusividade: `SYNTHETIC`, `SCENARIO`, `HISTORICAL_FILE`. (Modo ao vivo não faz parte do escopo — projeto 100% histórico/simulado.)

## Seek

Aceita: índice, percentual, timestamp. Não emite eventos retroativos.

## Isolamento (NÃO fazer)

- Não emite `matching:execution:created`
- Não chama `MatchingEngine.submit`
- Não altera FIFO, posição, stops, P&L
- Não gera `trader:order:filled`
- Não força RLP/DIRECT/AUCTION/UNKNOWN para lado direcional
