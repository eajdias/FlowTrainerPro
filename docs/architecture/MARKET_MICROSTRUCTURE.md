# Market Microstructure

## Princípio fundamental

O FlowTrainerPro simula uma Bolsa de Valores real. Cada ferramenta possui UMA responsabilidade.

## Separação: Intenção vs Execução

| Conceito | Quem mostra |
|----------|-------------|
| **Intenção** (ordens resting) | SuperDOM |
| **Execução** (negócios realizados) | Times & Trades |
| **Histórico** (volume acumulado) | Volume Profile |

Essas três camadas NUNCA se misturam.

## Eventos

| Evento | Emitido por | Consumido por |
|--------|-------------|---------------|
| `book:update` | OrderBookEngine | bookStore → SuperDOM |
| `matching:execution:created` | MatchingEngine | trade/volume/broker/position stores, FlowAnalysis, candles, bridge |

## Fonte de verdade

| Componente | Fonte | Nunca lê de |
|------------|-------|-------------|
| SuperDOM | `bookStore` | trades do marketStore |
| Times & Trades | `tradeStore` | book |
| Volume Profile | `volumeProfileStore` | book |
| Last Price | última execução | book |

## MatchingEngine

- **FIFO price-time priority** — ordem a mercado varrendo níveis gera uma `Execution` por nível
- `slippageTicks` registra deslizamento vs toque para ordens agressoras
- `getOrderQueueState(orderId)` — posição na fila (read-only)
- `getQueueTimeStats()` — tempo médio de fila por nível

## Interação do usuário

| Ação | Resultado |
|------|-----------|
| Click na compra/venda | `placeOrder('buy'/'sell', X)` — limite |
| `Shift+click` | `buyMarket()` / `sellMarket()` — agressora |
| `✕` na ordem | `cancelOrder(id)` |
| ZERAR | `flattenPosition()` |

## Regras invioláveis

1. DOM = intenções. Nunca execuções.
2. TT = execuções. Nunca intenções.
3. VP = volume histórico. Nunca ordens vivas.
4. Preço = última execução. Nunca posição no book.
5. MatchingEngine é o ÚNICO que produz execuções.
6. UI nunca implementa regra de negócio.
7. Trader entra na mesma fila FIFO — sem tratamento especial.
8. Replay histórico nunca emite `matching:execution:created`.
