# Kernel Bootstrap

## Papel do Kernel

O `SimulationKernel` é o "sistema operacional" da simulação. Ele é o **único** responsável por:
- Criar e gerenciar matching, book, cenário e gerador
- Conectar tudo via EventBus (`src/core/engine/EventBus.ts`)
- Controlar o ciclo de vida (boot/start/pause/resume/stop) e velocidade
- Avanço manual por `step()` (testes e stepping)

**Nenhum engine é instanciado diretamente pela UI** (acesso via `getKernel()`).

## Ciclo de vida

```txt
getKernel() / createKernel() → boot()       (semeia book, refresh inicial)
  → start()    → clock 150ms/speed → pause() → resume() → stop()
  → disposeKernel()
setSpeed() / setProfile() / setTrainingFifo() a qualquer momento
```

Cada tick: `scenario.onTick → generator.onTick → book.refresh → kernel:tick`.

## Eventos emitidos/consumidos

- `matching:execution:created` (MatchingEngine → stores, bridge, FlowAnalysis, broker flow, candles)
- `book:update` (OrderBookEngine → bookStore)
- `scenario:regime:changed` (MarketScenarioEngine → trainingSessionStore)
- `kernel:tick` (kernel → sessões de treino)

## Validação

- `kernel.start()` / `stop()` sem erros; determinismo (mesma seed = mesmos fills)
- `npx tsc --noEmit` zero erros; `tests/kernel/` verde
- Mercado vivo no navegador: ladder, tape e HUD avançando; 0 erros de console
