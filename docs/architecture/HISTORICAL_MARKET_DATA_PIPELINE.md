# Historical Market Data Pipeline

## Decisão arquitetural

Pipeline isolado do replay, EventBus, MatchingEngine, React e Zustand:

```
CSV → CsvTradeParser → TradeNormalizer → TradeValidator → MarketTrade[] → ImportDiagnostics
```

## Por que não usar `matching:execution:created`

Esse evento tem consumidores com efeitos colaterais (stops, posição, P&L do aluno). Uma linha de CSV histórico é um negócio observado, não um fill do aluno.

## Contrato `MarketTrade`

Imutável (`Object.freeze`), preserva dados históricos:

- `tradeId` (determinástico, derivado de campos estáveis)
- `asset`, `tradeDate`, `tradeTime`, `timestamp`
- `price`, `priceInTicks`, `quantity`
- `buyerBroker`, `sellerBroker`, `aggressor`
- `sourceLine`, `sourceSequence`, `chronologicalSequence`

## Agressor

| Valor | Mapeamento |
|-------|-----------|
| Comprador | `BUY` |
| Vendedor | `SELL` |
| RLP | `RLP` |
| Direto | `DIRECT` |
| Leilão | `AUCTION` |
| Demais | `UNKNOWN` |

`RLP`, `DIRECT`, `AUCTION`, `UNKNOWN` não são forçados para lado direcional.

## Diagnóstico

`ImportDiagnostics` registra: linhas físicas, válidas/inválidas, warnings, duplicadas, fora de ordem, agressores desconhecidos, faixa de preço, quantidade total, tempo de parsing.

## Fases

- **Fase 1:** Parser CSV (concluída)
- **Fase 2:** Replay histórico isolado (`src/core/marketData/replay/`) — concluída
- **Fase 3:** Projeções de leitura (`market:trade:observed`) — concluída
