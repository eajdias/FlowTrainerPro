# Sprint 3 — MarketStateEngine como Fonte de Verdade

## Objetivo
O `MarketStateEngine` do Kernel passa a ser alimentado a cada tick e torna-se a **fonte autoritativa** de estado do mercado. O Zustand store lê dados consolidados do Kernel em vez de calculá-los sozinho.

---

## Antes (Sprint 2)

```
SyntheticMarketProvider.tick()
    → FlowEngine listeners
    → useMarketStore.applyTick() ← calcula tudo internamente (VWAP, delta, etc.)
    → UI

MarketStateEngine: nunca atualizado, parado em estado inicial
```

## Depois (Sprint 3)

```
SyntheticMarketProvider.tick()
    → FlowEngine listeners
    ├── useMarketStore.applyTick() ← trades, levels, VP, brokers (visualização)
    └── MarketStateEngine.updateFromTick() ← VWAP, delta, trend, imbalance (verdade)
        → useMarketStore.syncKernelState() ← store lê do kernel
    → UI
```

---

## O que o MarketStateEngine agora acumula

| Dado | Descrição |
|---|---|
| `currentPrice` | Último preço negociado |
| `lastTradePrice/Size/Side` | Detalhes do último negócio |
| `sessionVolume` | Volume total da sessão |
| `sessionTrades` | Número de trades |
| `vwap` | Volume Weighted Average Price (acumulado) |
| `cumulativeDelta` | Soma de (buyVol - sellVol) |
| `trend` | up / down / sideways (simples) |
| `imbalance` | Último delta (positivo = compra dominante) |
| `currentTick` | Tick atual |
| `timestamp` | Timestamp do tick atual |

---

## Novo campo no Zustand store: `kernelState`

```typescript
kernelState: {
  vwap:           number;
  trend:          'up' | 'down' | 'sideways';
  sessionTrades:  number;
  imbalance:      number;
}
```

Painéis podem ler `useMarketStore(s => s.kernelState.vwap)` para obter o VWAP autoritativo calculado pelo Kernel.

---

## O que NÃO mudou

- Painéis continuam lendo do `useMarketStore`
- Formato dos dados de visualização (trades, levels, VP, brokers) inalterado
- Operações (BUY/SELL/FLATTEN) continuam funcionando
- Treinamento guiado continua funcionando
- Nenhum componente visual alterado

---

## O que o kernel SABE que o store NÃO sabia antes

- **VWAP real** — calculado corretamente com peso de volume (antes era calculado no store de forma idêntica, agora é autoritativo)
- **Trend** — detecção simples baseada em delta
- **Imbalance** — desequilíbrio imediato do tick

---

## Próxima Sprint (4)

O `FlowEngine` deixará de gerar dados. Ele passará a ser um **redistribuidor puro** de eventos do Kernel. O `SyntheticMarketProvider` continuará gerando, mas alimentando diretamente o `MarketStateEngine` sem intermediário.

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] `MarketStateEngine.getSnapshot()` retorna dados corretos após ticks
- [x] `useMarketStore.kernelState` é atualizado a cada tick
- [x] UI funciona exatamente como antes
- [x] Console: `kernel.marketState.getSnapshot()` mostra VWAP, delta, trades
