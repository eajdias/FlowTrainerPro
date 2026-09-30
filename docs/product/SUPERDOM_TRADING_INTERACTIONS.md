# SuperDOM Trading Interactions

## Objetivo

O SuperDOM e a ferramenta operacional de leitura do book. A Fase UX 3 moderniza somente apresentacao, densidade e feedback visual.

Nao foram alterados:

- `MatchingEngine`;
- FIFO;
- `TradingController`;
- `OrderManager`;
- `TraderExecutionBridge`;
- `PositionStore`;
- stops;
- P&L;
- regras de clique.

## Colunas

Estrutura visual atual:

| Coluna | Significado |
|---|---|
| `Ord.C` | Ordens de compra do aluno no preço. |
| `Qtd.C` | Quantidade compradora disponível no book. |
| `Preço` | Nível de preço. |
| `Qtd.V` | Quantidade vendedora disponível no book. |
| `Ord.V` | Ordens de venda do aluno no preço. |
| `R$` | Resultado estimado por variação do preço atual. |

Todos os números usam `tabular-nums`.

## Interações Preservadas

| Ação | Interação | Handler |
|---|---|---|
| BUY LIMIT | Clique normal em área de compra | `placeOrder('buy', price)` |
| SELL LIMIT | Clique normal em área de venda | `placeOrder('sell', price)` |
| BUY agressora | `Shift + clique` em área de compra | `buyMarket()` |
| SELL agressora | `Shift + clique` em área de venda | `sellMarket()` |
| Cancelar ordem | Botão `X` no overlay da ordem | `cancelOrder(orderId)` |
| Zerar posição | Botão `ZERAR` quando posicionado | `flattenPosition()` |

## Fila

A fila e lida por API read-only:

- `getOrderQueueState(orderId)`;
- posição;
- volume à frente;
- progresso;
- quantidade restante;
- status.

Formato compacto:

```txt
#4 | 327 ahead | 55% | rem 1
```

Quando a fila não esta disponível, o overlay mostra `Fila indisponível`.

## Hierarquia Visual

Prioridade:

1. preço atual;
2. best bid e best ask;
3. ordens do aluno;
4. liquidez;
5. fila;
6. informações auxiliares.

Best bid e best ask usam bordas discretas. Last price usa marcador `LAST`. Barras de liquidez usam fundos translúcidos e não ocultam os números.

## Estados

- `BUY LIMIT`;
- `SELL LIMIT`;
- `GAIN`;
- `STOP`;
- `PARCIAL`;
- fila indisponível;
- book vazio.

Estado vazio:

```txt
Book indisponível para a fonte atual.
```

## Performance

A view foi separada em `SuperDOMView`, com linhas memoizadas em `DomRow`. A normalização visual de ordens por preço usa `useMemo`.

O painel continua assinando apenas stores existentes:

- `bookStore`;
- `positionStore`;
- `traderOrderStore`.

## Limitações

- Não ha virtualização porque o número de níveis visíveis ainda e pequeno.
- Auto-center e uma indicação visual; a regra de centralização do book não foi alterada.
- Estados `cancelada` e `executada` não persistem no overlay porque o store atual remove ordens preenchidas/canceladas.
