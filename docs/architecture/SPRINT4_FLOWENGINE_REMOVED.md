# Sprint 4 — FlowEngine Removido do Pipeline

## Objetivo
O `FlowEngine` é removido do pipeline de geração de mercado. O `SyntheticMarketProvider` agora é acionado diretamente pelo clock tick do Kernel e emite ticks via EventBus. O store e o MarketStateEngine ouvem o EventBus diretamente.

---

## Antes (Sprint 3)

```
Clock tick
    → useFlowEngine subscriber
    → FlowEngine.triggerTick()
    → SyntheticMarketProvider.tick()
    → FlowEngine.onTick listeners
    → useMarketStore.applyTick() + MarketStateEngine.updateFromTick()
    → UI
```

## Depois (Sprint 4)

```
Clock tick
    → EventBus: "clock:tick"
    → SyntheticMarketProvider.tick()   ← chamado diretamente
    → EventBus: "market:tick:generated"
    ├── useMarketStore.applyTick()     ← store ouve EventBus direto
    └── MarketStateEngine.updateFromTick()
    → UI
```

---

## O que foi eliminado

| Componente | Status |
|---|---|
| `FlowEngine` class | **NÃO MAIS USADO** no pipeline. Arquivo ainda existe mas não é importado. |
| `FlowEngine.triggerTick()` | Substituído por chamada direta ao provider |
| `FlowEngine.onTick()` listeners | Substituídos por EventBus listener |
| Indireção desnecessária | Eliminada |

---

## Novo fluxo de dados

```
SimulationClock (1000ms / speed)
    │ emite "clock:tick"
    ▼
EventBus subscriber em useFlowEngine
    │ chama provider.tick()
    ▼
SyntheticMarketProvider
    │ gera MarketTick { price, volume, delta, brokerId, brokerName, brokerColor }
    │ emite "market:tick:generated" via EventBus
    ▼
EventBus subscriber em useFlowEngine
    ├── useMarketStore.applyTick(tick)  → painéis React
    └── kernel.marketState.updateFromTick(tick) → MarketStateEngine
        └── syncKernelState() → store.kernelState
```

---

## Por que isso importa

1. **Menos indireção** — o tick vai direto do provider ao store e ao kernel
2. **EventBus como coluna vertebral** — todo mundo ouve eventos, ninguém chama ninguém diretamente
3. **Preparação para Sprint 5** — quando o `SyntheticMarketProvider` for desligado, basta trocar quem emite `"market:tick:generated"` (será o PlayerEngine → MatchingEngine)
4. **FlowEngine pode ser deletado** — não é mais necessário. Mantemos o arquivo por backward compat mas ele não participa do fluxo.

---

## O que NÃO mudou

- Painéis continuam lendo do `useMarketStore`
- Formato dos ticks idêntico
- Operações (BUY/SELL/FLATTEN) funcionam
- Treinamento guiado funciona
- Velocidade funciona (0.5x a 16x)
- Nenhum componente visual alterado

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] Mercado funciona normalmente ao clicar Iniciar
- [x] Velocidade funciona
- [x] Operações funcionam
- [x] `FlowEngine` não é mais importado por nenhum código ativo
- [x] Documentação atualizada

---

## Próxima Sprint (5)

O `SyntheticMarketProvider` será desligado. Quem emitirá `"market:tick:generated"` será o pipeline Kernel: PlayerEngine → DecisionEngine → MatchingEngine → Executions → MarketState.
