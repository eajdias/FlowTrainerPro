# Sprint 2 — SimulationClock Assume o Tempo

## Objetivo
O `SimulationClock` do Kernel passa a ser o único tick master da simulação. O `SyntheticMarketProvider` deixa de usar `setInterval` próprio e gera dados apenas quando o clock manda.

---

## Antes (Sprint 1)

```
SyntheticMarketProvider (setInterval 800ms)
    → FlowEngine → Store → UI

SimulationKernel (engines em "ready", não faz nada)
```

## Depois (Sprint 2)

```
SimulationClock (tick master — 1000ms / speed)
    → EventBus: CLOCK_EVENTS.TICK
    → useFlowEngine subscriber
    → FlowEngine.triggerTick()
    → SyntheticMarketProvider.tick() (gera um tick sob demanda)
    → FlowEngine listeners
    → useMarketStore.applyTick()
    → UI painéis

SimulationKernel controla: start, pause, resume, speed
```

---

## O que mudou

| Componente | Antes | Depois |
|---|---|---|
| `SyntheticMarketProvider` | `setInterval` próprio | Modo "clock-driven" — `.tick()` chamado externamente |
| `FlowEngine` | Diz ao provider `start()`/`stop()` | Modo clock-driven — `triggerTick()` chamado pelo clock |
| `useFlowEngine.start()` | `provider.start()` | `kernel.start()` → clock ticks → provider |
| `useFlowEngine.pause()` | `provider.stop()` | `kernel.pause()` → clock para → ticks param |
| **Botões de velocidade** | Visual only | Funcional — `kernel.setSpeed(0.5/1/2/4/8/16)` |
| **UI / painéis** | Sem mudança | Sem mudança |

---

## Controle de velocidade

```
0.5x → intervalo de 2000ms entre ticks
1x   → intervalo de 1000ms
2x   → intervalo de 500ms
4x   → intervalo de 250ms
8x   → intervalo de 125ms
16x  → intervalo de ~63ms
```

O clock é baseado em `setTimeout` recursivo. A velocidade pode ser alterada em runtime sem interromper a simulação.

---

## O que NÃO mudou

- Os painéis continuam lendo do `useMarketStore`
- O formato dos ticks (`MarketTick`) é idêntico
- As operações (BUY/SELL/FLATTEN) continuam funcionando
- O treinamento guiado continua funcionando
- Nenhum componente visual foi alterado

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] Clicar "▶ Iniciar" inicia o mercado via SimulationClock
- [x] Clicar "⏸" pausa o mercado (clock para de tickar)
- [x] Botões de velocidade (0.5x a 16x) alteram a cadência dos ticks
- [x] Reset funciona
- [x] Operações e treinamento continuam normais

---

## Próxima Sprint (3)

O `MarketStateEngine` do Kernel passará a ser a fonte oficial de estado do mercado, substituindo gradualmente os acumuladores internos do `useMarketStore`.
