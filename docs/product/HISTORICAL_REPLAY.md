# Historical Replay

O replay histórico reproduz negócios reais importados (via pipeline API → DuckDB → JSON ou CSV validado por script) como mercado observado.

## Cadeia real

```txt
MarketTrade[] → HistoricalReplayEngine, `src/core/marketData/replay.ts`
  (load/start/pause/step/seek/speed)
  → historical:trade:executed
  → projections (market:trade:observed, last-price)
  → historicalTradeStore / historicalBrokerHistoryStore / historicalLastPriceStore
  → BrokerHistoryPanel, ReplayInspector (+ Times & Trades histórico: pendente)
```

O replay **não** alimenta os painéis ao vivo (SuperDOM, Book, T&T live, Volume Profile live,
gráfico 8P) e **não** executa ordens do aluno nem altera posição, stops, P&L ou FIFO.

## Categorias preservadas

`BUY`, `SELL`, `RLP`, `DIRECT`, `AUCTION`, `UNKNOWN` — as quatro últimas nunca forçadas
para lado direcional.

## UI

Sem painel próprio: o replay histórico é consumido pelos painéis de leitura quando a fonte ativa é histórica. Novos dados entram pelo pipeline (`npm run materials`, `npm run materials:wdo`); validação de CSV avulso: `npm run validate:trade-csv -- <arquivo>`.
