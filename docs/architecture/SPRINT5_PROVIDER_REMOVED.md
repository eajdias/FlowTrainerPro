# Sprint 5 — SyntheticMarketProvider Desligado

## Objetivo
O `SyntheticMarketProvider` é removido do pipeline ativo. Quem gera mercado agora é o `KernelMarketGenerator` — um componente interno do Kernel. O hook `useFlowEngine` não importa mais nenhum provider.

---

## Antes (Sprint 4)

```
useFlowEngine cria SyntheticMarketProvider singleton
Clock tick → useFlowEngine → provider.tick() → EventBus → Store
```

## Depois (Sprint 5)

```
Kernel.wireEventBus():
  Clock tick → KernelMarketGenerator.tick() → EventBus "market:tick:generated"
                                            → MarketStateEngine.updateFromTick()

useFlowEngine:
  EventBus "market:tick:generated" → useMarketStore.applyTick()
                                   → syncKernelState()
```

---

## O que foi criado

### `KernelMarketGenerator` (`core/kernel/KernelMarketGenerator.ts`)
- Vive inteiramente dentro do Kernel
- Usa BrokerRegistry para atribuir corretora/cor por tick
- Tem market phases (trend_up, trend_down, sideways)
- Seeded PRNG para reprodutibilidade
- Chamado por `SimulationKernel` a cada clock tick
- Emite `"market:tick:generated"` no EventBus
- Gera o mesmo formato `MarketTick` que antes

---

## O que foi removido

| Componente | Status |
|---|---|
| `SyntheticMarketProvider` no `useFlowEngine` | **REMOVIDO** — hook não importa mais |
| `FlowEngine` | Já removido na Sprint 4 |
| Provider singleton no hook | **REMOVIDO** — Kernel controla tudo |

---

## Pipeline final

```
SimulationClock (Kernel)
    │ emite "clock:tick" (1000ms / speed)
    ▼
SimulationKernel.wireEventBus
    │ chama KernelMarketGenerator.tick()
    │ chama PlayerEngine.onTick() (preparado para Sprint 6)
    ▼
KernelMarketGenerator
    │ gera MarketTick com broker real
    │ emite "market:tick:generated"
    ▼
EventBus
    ├── MarketStateEngine.updateFromTick() ← verdade autoritativa
    └── useFlowEngine subscriber
        ├── useMarketStore.applyTick()    ← painéis React
        └── syncKernelState()             ← VWAP, trend, imbalance
```

---

## O que NÃO mudou

- Formato dos ticks (`MarketTick`) idêntico
- Painéis leem do mesmo `useMarketStore`
- Operações funcionam (BUY/SELL/FLATTEN)
- Treinamento funciona
- Velocidade funciona (0.5x–16x)

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] `SyntheticMarketProvider` não é mais importado em código ativo
- [x] Mercado funciona ao clicar Iniciar
- [x] Dados vêm do `KernelMarketGenerator`
- [x] Velocidade funciona
- [x] Operações e treino funcionam

---

## Próximas Sprints

| Sprint | O que muda |
|---|---|
| **6** | PlayerEngine gera ordens a cada tick (bots entram no mercado) |
| **7** | MatchingEngine cruza ordens dos players → preço = consequência |
| **8** | KernelMarketGenerator desligado — mercado 100% por Players+Matching |
