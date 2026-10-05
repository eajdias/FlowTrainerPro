# Historical Market Projections

## Objetivo

Transforma `historical:trade:executed` em dados de leitura de mercado para UI e análise, sem passar pelo `MatchingEngine`.

```
historical:trade:executed → HistoricalMarketDataProjection → market:trade:observed → stores históricos / FlowAnalysis / last price
```

## Eventos

- `market:trade:observed` — mercado observado (não é execução do simulador)
- `market:last-price:update` — último preço observado
- `market:projection:reset` — limpa dados históricos
- `market:source:changed` — mudança de fonte

## Stores históricos

`useHistoricalTradeStore`, `useHistoricalBrokerHistoryStore`, `useHistoricalLastPriceStore`, `useMarketDataSourceStore`

## Categorias

`BUY`, `SELL`, `RLP`, `DIRECT`, `AUCTION`, `UNKNOWN` — tipos neutros não entram no delta direcional.

## Source mode

`useMarketDataSourceStore.setSource(mode)`: `SYNTHETIC`, `SCENARIO`, `HISTORICAL_FILE` (com guarda contra troca destrutiva com sessão rodando). (Modo ao vivo não faz parte do escopo.)

Ao entrar em `HISTORICAL_FILE`: kernel pausa clock sintético, limpa scenario, reseta FlowAnalysis.

## Reset

Limpa: T&T histórico, Volume Profile histórico, Broker History histórico, last price histórico.

Não limpa: layout, preferências, posição, ordens do aluno, P&L.

## Performance

Core processa todos os trades. UI usa listas visuais limitadas. Teste de carga: 10k/100k trades + CSV real de 39.292 trades validado.
