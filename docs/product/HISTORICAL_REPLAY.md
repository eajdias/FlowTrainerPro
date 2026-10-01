# Historical Replay

O replay histórico reproduz negócios reais importados de CSV como mercado observado.

## Cadeia real

```txt
CSV → MarketTrade[] → HistoricalReplayEngine (load/start/pause/step/seek/speed)
  → historical:trade:executed
  → projections (market:trade:observed, last-price)
  → historicalTradeStore / historicalVolumeProfileStore /
    historicalBrokerHistoryStore / historicalLastPriceStore
  → BrokerHistoryPanel, ReplayInspector (+ Times & Trades histórico: pendente)
```

O replay **não** alimenta os painéis ao vivo (SuperDOM, Book, T&T live, Volume Profile live,
gráfico 8P) e **não** executa ordens do aluno nem altera posição, stops, P&L ou FIFO.

## Categorias preservadas

`BUY`, `SELL`, `RLP`, `DIRECT`, `AUCTION`, `UNKNOWN` — as quatro últimas nunca forçadas
para lado direcional.

## UI

Painel Replay Player (arquivo CSV, transporte, velocidade, step) + painel Dados & Ativos
(importação com avisos honestos). Validação: `npm run validate:trade-csv -- <arquivo>`.
