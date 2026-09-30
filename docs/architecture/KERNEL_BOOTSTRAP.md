# Kernel Bootstrap — Sprint 1 (Migração Controlada)

## Objetivo
Introduzir o `SimulationKernel` como o novo núcleo de orquestração da simulação **sem quebrar nada**. O fluxo atual (`SyntheticMarketProvider → FlowEngine → Store → UI`) continua funcionando exatamente como antes.

---

## Papel do Kernel

O `SimulationKernel` é o "sistema operacional" da simulação. Ele é o **único** responsável por:
- Criar e gerenciar todos os engines
- Conectar os engines via EventBus
- Controlar o ciclo de vida (start/stop/dispose)
- Prover health check (status de cada engine)

**Nenhum engine é instanciado diretamente pela UI.**

---

## Engines Registrados

| Engine | Responsabilidade |
|---|---|
| `SimulationClock` | Tick master — controla tempo |
| `MarketStateEngine` | Estado observável centralizado do mercado |
| `OrderBookEngine` | Livro de ordens FIFO (bid/ask por nível) |
| `MatchingEngine` | Cruza ordens → gera Executions |
| `ExecutionEngine` | Processa parciais → gera Fills |
| `TradeEngine` | Posição, médio, P&L, financeiro |
| `RiskEngine` | Max loss, max gain, trailing, flatten |
| `DecisionEngine` | Traduz PlayerDecision → OrderIntent |
| `StatisticsEngine` | Win rate, expectancy, payoff, score |
| `PlayerEngine` | Orquestra players e suas estratégias |
| `ProceduralMarketDirector` | Gera scripts de cenários |

---

## Ciclo de Vida

```
createKernel(config)     → instancia todos os engines
    ↓
kernel.initialize()      → wires EventBus entre engines
    ↓
kernel.start()           → SimulationClock começa a tickar
    ↓
kernel.pause()           → suspende o clock
kernel.resume()          → retoma o clock
    ↓
kernel.stop()            → para o clock, pode ser reiniciado
    ↓
kernel.reset()           → reseta todos os engines ao estado inicial
    ↓
kernel.dispose()         → destrói o kernel e limpa EventBus
```

---

## Health Check

```typescript
kernel.status()
// Retorna:
{
  kernel:           'running',
  simulationClock:  'running',
  playerEngine:     'running',
  matchingEngine:   'running',
  executionEngine:  'running',
  tradeEngine:      'running',
  riskEngine:       'running',
  statisticsEngine: 'running',
  marketState:      'running',
  orderBook:        'running',
  decisionEngine:   'running',
}
```

---

## Fluxo de Inicialização (Sprint 1)

```
Application (React)
    ↓
TrainingModule mounts
    ↓
useKernel() hook
    ↓
getKernel() → SimulationKernel instanciado
    ↓
kernel.initialize() → engines wired via EventBus
    ↓
Console: "[Kernel] Bootstrapped. Status: { ... }"
    ↓
Kernel fica em estado "ready" — NÃO gera mercado
    ↓
FlowEngine continua gerando mercado normalmente (caminho legado)
```

---

## O que NÃO muda nesta Sprint

- `SyntheticMarketProvider` continua gerando ticks
- `FlowEngine` continua distribuindo para `useMarketStore`
- Todos os painéis continuam lendo do `useMarketStore`
- Nenhum comportamento visual muda
- Nenhum painel é alterado

---

## EventBus

Instância única compartilhada por TODOS os engines:
```typescript
import { eventBus } from '../engine/EventBus';
```

Não criar múltiplas instâncias. O Kernel usa o mesmo `eventBus` que já existe.

---

## Responsabilidades por Sprint

| Sprint | O que muda |
|---|---|
| **1 (esta)** | Kernel inicializa engines. Nada muda na UI. |
| 2 | SimulationClock controla tempo da simulação |
| 3 | MarketStateEngine vira fonte oficial de estado |
| 4 | FlowEngine para de gerar, apenas distribui |
| 5 | SyntheticMarketProvider desligado |
| 6 | PlayerEngine gera ordens |
| 7 | MatchingEngine movimenta o mercado |
| 8 | Mercado existe sem dados sintéticos |

---

## Validação

A Sprint é considerada completa quando:
- [x] `kernel.start()` funciona sem erros
- [x] `kernel.stop()` funciona sem erros
- [x] `kernel.dispose()` funciona sem erros
- [x] `kernel.status()` retorna o estado de todos os engines
- [x] `npx tsc --noEmit` passa sem erros
- [x] A aplicação funciona **exatamente como antes** (mercado live, operações, treino)
- [x] Console mostra `[Kernel] Bootstrapped` ao entrar em Training
