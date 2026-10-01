# Arquitetura de Microestrutura de Mercado — FlowTrainerPro

## Princípio Fundamental

> O FlowTrainerPro simula uma Bolsa de Valores real.
> Cada ferramenta possui UMA responsabilidade.
> Nenhuma ferramenta deve duplicar a função de outra.

## 1. Separação Absoluta: INTENÇÃO vs EXECUÇÃO

| Conceito | Significado | Quem mostra |
|----------|-------------|-------------|
| **Intenção** | "Estou disposto a comprar/vender aqui" | SuperDOM |
| **Execução** | "Um negócio foi realizado" | Times & Trades |
| **Histórico** | "Quanto volume já passou neste preço" | Volume Profile |

Essas três camadas NUNCA se misturam.

## 2. Responsabilidade de Cada Painel

### SuperDOM (Livro de Ofertas)
- Mostra APENAS ordens limitadas resting no book
- **Fonte de dados:** `bookStore` (via `book:update` do `OrderBookEngine`)
- **NÃO mostra:** execuções, trades, volume histórico
- **Interação:** clique = limite, `Shift+clique` = agressora; `✕` cancela; ZERAR zera posição

### Times & Trades
- Mostra APENAS negócios executados (cada linha = uma `Execution`)
- **Fonte de dados:** `tradeStore` (via `matching:execution:created`)
- Colunas: Hora/Qtd/Preço/Comprador/Vendedora/Slip + filtros de lado e lote

### Volume Profile
- Mostra volume HISTÓRICO acumulado por preço: POC, VAH, VAL, ZIM
- **Fonte de dados:** `volumeProfileStore` (só execuções)

### Broker History
- Atividade agregada por corretora; painel histórico lê `historicalBrokerHistoryStore`,
  painel ao vivo (`OrderBookByBrokerPanel`) lê `marketStore.brokerActivity`

### ZIM (Zona de Intensa Negociação)
- Derivada EXCLUSIVAMENTE do Volume Profile (volume ≥ 2× média)

## 3. Dois Eventos (separação obrigatória)

### `book:update`
Mudanças nas **intenções** (ordens resting). Quem escuta: `bookStore` → SuperDOM.

### `matching:execution:created`
Um **negócio realizado**: preço, quantidade, corretoras agressora/passiva (+ playerIds),
lado agressor, `slippageTicks`, timestamp. Quem escuta: trade/volume/broker/position stores,
FlowAnalysis, broker flow, candles, bridge (stops + P&L a mercado).

## 4. Fonte de Verdade por Componente

| Componente | Fonte de verdade | Nunca lê de |
|------------|-----------------|-------------|
| SuperDOM | `bookStore` (níveis do book) | trades do marketStore |
| Times & Trades | `tradeStore` (execuções) | book |
| Volume Profile | `volumeProfileStore` | book |
| Last Price | última execução | book |
| FlowAnalysis | execuções (feed) | stores |

## 5. Como o Preço se Move

O preço **sobe quando alguém AGRIDE todas as ofertas de um nível**.
Ordem a mercado varrendo níveis gera uma `Execution` por nível preenchido;
`slippageTicks` registra o deslizamento vs toque para ordens agressoras.

## 6. OrderBookEngine — Fonte de Leitura do DOM

Projeção sobre o `MatchingEngine` (dono único das filas FIFO):

```typescript
interface BookSnapshot {
  bids: BookLevelView[];  // preço desc
  asks: BookLevelView[];  // preço asc
  bestBid: number;
  bestAsk: number;
  spread: number;
}

interface BookLevelView {
  price: number;
  size: number;       // soma resting no nível
  orderCount: number;
}
```

Posição na fila: `getOrderQueueState(orderId)` (read-only) → posição 1-based,
volume à frente, progresso, status. Tempo médio de fila por nível:
`MatchingEngine.getQueueTimeStats()`.

## 7. Fluxo Completo

```txt
KernelMarketGenerator (ordens sintéticas) + TraderExecutionBridge (ordens do aluno)
  → MatchingEngine (FIFO: cruza agressora, descansa limite, cancela)
  → matching:execution:created → stores/painéis
  → OrderBookEngine.refresh() → book:update → SuperDOM
```

## 8. Comportamento do Book (DOM Vivo)

Sem execuções o book muda por resting/cancelamentos do gerador; com execuções,
níveis são consumidos em prioridade preço-tempo. O SuperDOM reflete o snapshot.

## 9. Interação do Usuário

| Ação | Resultado |
|------|-----------|
| Click na compra em preço X | `placeOrder('buy', X)` — limite |
| Click na venda em preço X | `placeOrder('sell', X)` — limite |
| `Shift+click` | `buyMarket()` / `sellMarket()` — agressora |
| `✕` na ordem | `cancelOrder(id)` |
| ZERAR | `flattenPosition()` |

Arrastar ordens, click direito e double-click para cancelar tudo: **não implementados**.

## 10. Regras Invioláveis

1. **DOM = intenções. Nunca execuções.**
2. **TT = execuções. Nunca intenções.**
3. **VP = volume histórico. Nunca ordens vivas.**
4. **Preço = última execução. Nunca posição no book.**
5. **MatchingEngine é o ÚNICO que produz execuções.**
6. **UI nunca implementa regra de negócio; engines concentram lógica.**
7. **O trader entra na mesma fila FIFO — sem tratamento especial** (só a corretora é selecionável).
8. **Replay histórico nunca emite `matching:execution:created`.**
