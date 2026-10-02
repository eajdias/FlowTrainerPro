# SuperDOM Trading Interactions

## O que é

O SuperDOM é a principal ferramenta de interação do trader. Mostra o livro de ofertas (DOM) e permite operar com cliques.

## Interações

| Ação | Resultado |
|------|-----------|
| Click no preço de compra (bid) | `placeOrder('buy', X)` — ordem limitada |
| Click no preço de venda (ask) | `placeOrder('sell', X)` — ordem limitada |
| `Shift+click` | `buyMarket()` / `sellMarket()` — ordem agressora |
| `✕` na ordem | `cancelOrder(id)` |
| ZERAR | `flattenPosition()` |

## Fila FIFO

- `getOrderQueueState(orderId)` — posição 1-based, volume à frente, progresso, status
- `MatchingEngine.getQueueTimeStats()` — tempo médio de fila por nível
- Preço tocar o nível ≠ execução

## Regras

1. DOM mostra apenas intenções (ordens resting), nunca execuções
2. Trader entra na mesma fila FIFO — sem tratamento especial
3. UI nunca implementa regra de negócio
4. Filas exibidas na UI vêm de API read-only autoritativa
