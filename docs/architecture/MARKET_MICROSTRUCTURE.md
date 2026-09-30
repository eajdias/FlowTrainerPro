# Arquitetura de Microestrutura de Mercado — FlowTrainerPro

**Documento definitivo. Toda implementação futura DEVE respeitar estas regras.**

---

## Princípio Fundamental

> O FlowTrainerPro simula uma Bolsa de Valores real.
> Cada ferramenta possui UMA responsabilidade.
> Nenhuma ferramenta deve duplicar a função de outra.

---

## 1. Separação Absoluta: INTENÇÃO vs EXECUÇÃO

| Conceito | Significado | Quem mostra |
|----------|-------------|-------------|
| **Intenção** | "Estou disposto a comprar/vender aqui" | SuperDOM |
| **Execução** | "Um negócio foi realizado" | Times & Trades |
| **Histórico** | "Quanto volume já passou neste preço" | Volume Profile |

Essas três camadas NUNCA se misturam.

---

## 2. Responsabilidade de Cada Painel

### SuperDOM (Livro de Ofertas)
- Mostra APENAS ordens limitadas resting no OrderBook
- **Fonte de dados:** `OrderBookEngine.getBookSnapshot()`
- **Evento que atualiza:** `BOOK_UPDATE`
- **NÃO mostra:** execuções, trades, volume histórico
- **Comportamento:** vive constantemente (ordens aparecem, desaparecem, mudam de tamanho)
- **Interação futura:** click = enviar ordem limitada ou a mercado

### Times & Trades
- Mostra APENAS negócios executados (cada linha = uma Execution)
- **Fonte de dados:** evento `TRADE_EXECUTED`
- **NÃO mostra:** ordens resting, intenções, book
- **Cada linha:** timestamp, preço, quantidade, corretora compradora, corretora vendedora, lado agressor

### Volume Profile (VV)
- Mostra volume HISTÓRICO acumulado por preço
- **Fonte de dados:** acumula a partir de `TRADE_EXECUTED`
- **NÃO mostra:** ordens vivas, intenções
- **Cálculos:** POC, VAH, VAL, ZIM

### Broker History
- Mostra atividade agregada por corretora
- **Fonte de dados:** agrupa `TRADE_EXECUTED` por brokerId
- **NÃO mostra:** ordens resting

### ZIM (Zona de Intensa Negociação)
- Derivada EXCLUSIVAMENTE do Volume Profile
- Surge quando há concentração de volume executado
- **NÃO depende do Book** — depende apenas de execuções

---

## 3. Dois Tipos de Eventos (separação obrigatória)

### `BOOK_UPDATE`
Representa mudanças nas **intenções** (ordens resting):
- Nova ordem limitada adicionada
- Ordem cancelada
- Ordem modificada (tamanho ou preço)
- Ordem consumida parcialmente (após execução)
- Reposicionamento, spoofing, layering

**Quem escuta:** SuperDOM (e somente ele para visualização de book)

### `TRADE_EXECUTED`
Representa um **negócio realizado**:
- Preço de execução
- Quantidade executada
- Corretora agressora (quem enviou a mercado)
- Corretora passiva (quem tinha a ordem resting)
- Lado agressor (compra ou venda)
- Timestamp

**Quem escuta:**
- Times & Trades
- Broker History
- Volume Profile
- Last Price
- Estatísticas
- FlowAnalysisEngine

---

## 4. Fonte de Verdade por Componente

| Componente | Fonte de verdade | Nunca lê de |
|------------|-----------------|-------------|
| SuperDOM | `OrderBookEngine` (book levels) | MarketStore trades |
| Times & Trades | Evento `TRADE_EXECUTED` | OrderBookEngine |
| Volume Profile | Acumulador de `TRADE_EXECUTED` | OrderBookEngine |
| Broker History | Agrupamento de `TRADE_EXECUTED` | OrderBookEngine |
| Last Price | Último `TRADE_EXECUTED.price` | OrderBookEngine |
| FlowAnalysis | `TRADE_EXECUTED` + `BOOK_UPDATE` | MarketStore |

---

## 5. Como o Preço se Move

O preço **NÃO sobe porque alguém colocou ordem grande**.
O preço **sobe quando alguém AGRIDE todas as ofertas de um nível**.

```
Exemplo:
5070.50 → 80 contratos resting (ask)
5071.00 → 150 contratos resting (ask)
5071.50 → 220 contratos resting (ask)

Comprador envia ordem de mercado: 500 contratos

MatchingEngine processa:
  Nível 5070.50: executa 80 → nível zerado
  Nível 5071.00: executa 150 → nível zerado
  Nível 5071.50: executa 220 → nível zerado
  Nível 5072.00: executa 50 → nível reduzido

Resultado:
  Last Price = 5072.00
  Book perdeu 3 níveis inteiros
  4 Executions geradas (uma por nível)
  Times & Trades mostra 4 linhas
  Volume Profile acumula em cada preço
```

---

## 6. OrderBookEngine — Fonte de Verdade do DOM

```typescript
interface BookSnapshot {
  levels: BookLevel[];  // sorted by price desc
  bestBid: number;
  bestAsk: number;
  spread: number;
}

interface BookLevel {
  price: number;
  side: 'bid' | 'ask';
  totalSize: number;       // soma de todas as ordens neste nível
  orderCount: number;      // quantas ordens existem
  orders: RestingOrder[];  // FIFO queue
}

interface RestingOrder {
  orderId: string;
  brokerId: number;
  size: number;
  timestamp: number;       // quando entrou na fila
  queuePosition: number;
}
```

O SuperDOM renderiza APENAS este snapshot.
Ele NUNCA mantém estado próprio de ordens.

---

## 7. Fluxo Completo (Arquitetura Definitiva)

```
┌─────────────────────────────────────────────────────────┐
│                    PLAYERS                                │
│  (decidem colocar ordens limitadas ou a mercado)         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              ORDER BOOK ENGINE                            │
│  Recebe ordens limitadas → adiciona na fila FIFO         │
│  Emite: BOOK_UPDATE                                      │
│  ↓                                                       │
│  SuperDOM lê BookSnapshot (renderiza intenções)          │
└────────────────────────┬────────────────────────────────┘
                         │ (ordem de mercado chega)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              MATCHING ENGINE                              │
│  Cruza ordem de mercado contra book (FIFO)               │
│  Remove/reduz ordens passivas do book                    │
│  Produz: Execution(s)                                    │
│  Emite: TRADE_EXECUTED (por cada execução)               │
│  Emite: BOOK_UPDATE (book mudou)                         │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┬──────────────┐
          ▼              ▼              ▼              ▼
    Times & Trades  Volume Profile  Broker History  Last Price
    (lista negócios) (acumula vol)  (agrupa broker) (atualiza)
```

---

## 8. Comportamento do Book (DOM Vivo)

Mesmo SEM execuções, o book muda constantemente:

| Evento | O que acontece | Gera negócio? |
|--------|---------------|---------------|
| Nova ordem limitada | Nível ganha volume | NÃO |
| Cancelamento | Nível perde volume | NÃO |
| Reposicionamento | Nível A perde, nível B ganha | NÃO |
| Spoofing | Ordem grande aparece e desaparece | NÃO |
| Layering | Múltiplas ordens escalonadas surgem | NÃO |
| HFT refresh | Ordens cancelam e reaparecem rápido | NÃO |
| Ordem a mercado | Book PERDE liquidez + execução | SIM |

O SuperDOM deve refletir TODAS essas mudanças em tempo real.

---

## 9. Interação do Usuário (futuro próximo)

O trader operará EXCLUSIVAMENTE pelo SuperDOM:

| Ação | Resultado |
|------|-----------|
| Click na coluna Compra em preço X | Ordem limitada de COMPRA em X |
| Click na coluna Venda em preço X | Ordem limitada de VENDA em X |
| Hotkey + click | Ordem a MERCADO |
| Arrastar ordem existente | Cancela antiga + cria nova (perde fila) |
| Click direito em ordem | Cancela |
| Double-click na coluna Compra | Cancela todas as compras |

Quando o trader envia uma ordem:
1. Se for limitada → entra no book → aparece no DOM
2. Se for a mercado → MatchingEngine cruza → gera Execution
3. O trader está na mesma fila FIFO que os bots

---

## 10. Regras Invioláveis

1. **DOM = intenções. Nunca execuções.**
2. **TT = execuções. Nunca intenções.**
3. **VP = volume histórico. Nunca ordens vivas.**
4. **Preço = último TRADE_EXECUTED. Nunca posição no book.**
5. **O book vive sem execuções. Execuções dependem do book.**
6. **MatchingEngine é o ÚNICO que produz execuções.**
7. **OrderBookEngine é a ÚNICA fonte do DOM.**
8. **Nenhum painel mantém estado próprio de ordens.**
9. **Todos os painéis escutam eventos — nunca chamam engines diretamente.**
10. **O trader é um player na fila FIFO — sem tratamento especial.**

---

## 11. Eventos EventBus (definitivo)

```typescript
// Book mudou (intenções)
'book:update' → { levels: BookLevel[], bestBid, bestAsk, spread }

// Negócio executado
'trade:executed' → { 
  executionId, timestamp, price, size,
  aggressorBrokerId, passiveBrokerId,
  aggressorSide: 'buy' | 'sell'
}

// Preço atualizado (derivado de trade:executed)
'price:updated' → { lastPrice, previousPrice }
```

---

*Este documento é a referência máxima de arquitetura do FlowTrainerPro.
Toda implementação passada, presente e futura deve estar alinhada com ele.
Qualquer código que viole estes princípios deve ser refatorado.*
