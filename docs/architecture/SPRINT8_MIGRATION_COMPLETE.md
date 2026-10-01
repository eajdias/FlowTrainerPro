# Sprint 8 — Migração Completa

> ⚠️ DOCUMENTO HISTÓRICO — narrativa de migração de outro tree (FlowEngine, SyntheticMarketProvider, players com IA). Mantido como contexto; o estado real vive em `docs/Architecture.md`, `docs/roadmap/BACKLOG.md` e nos testes.
## Status: ✅ CONCLUÍDA

A migração de 8 sprints está finalizada. O FlowTrainerPro agora possui um mercado que funciona como uma bolsa de valores real.

---

## Pipeline Final (definitivo)

```
SimulationClock (1000ms / speed)
    │ emite "clock:tick"
    ▼
SimulationKernel.wireEventBus()
    │ chama KernelMarketGenerator.tick()
    ▼
KernelMarketGenerator
    │ 8-12 players ativos (BrokerRegistry profiles)
    │ selectActivePlayer() → ponderado por agressividade
    │ playerActs()
    │   → cria Order (market ou limit)
    │   → submete ao MatchingEngine
    ▼
MatchingEngine (FIFO price-time priority)
    │ cruza ordem contra resting orders no Book
    │ produz Execution { price, size, aggressorBrokerId, ... }
    ▼
OrderBookEngine
    │ mantém filas FIFO por nível de preço
    │ bid queues + ask queues
    │ replenish automático por players passivos
    ▼
Execution → MarketTick → EventBus "market:tick:generated"
    ├── MarketStateEngine.updateFromTick() ← verdade autoritativa
    └── useFlowEngine subscriber
        ├── useMarketStore.applyTick() → painéis React
        └── syncKernelState() → VWAP, trend, imbalance
    ▼
UI (SuperDOM, TT, VolumeProfile, BrokerHistory, PriceLadder)
```

---

## O que o preço É agora

O preço **não é mais gerado**. Ele é a **consequência** do casamento de ordens:

```
BTG (brokerId: 85) quer comprar 200 contratos a mercado
    → MatchingEngine busca melhor ask (5165.25)
    → Encontra UBS (brokerId: 8) com 150 resting
    → Execution: BTG compra 150 de UBS a 5165.25
    → MarketTick { price: 5165.25, volume: 150, side: buy, broker: BTG }
    → TT mostra: "BTG 150 BUY 5165.25" em amarelo
    → Preço atual = 5165.25
```

---

## Componentes legados (podem ser removidos)

| Arquivo | Status |
|---|---|
| `src/modules/scenarios/FlowEngine.ts` | **MORTO** — não importado por ninguém ativo |
| `src/market/providers/SyntheticMarketProvider.ts` | **MORTO** — substituído por KernelMarketGenerator |
| `src/core/market/SyntheticMarketProvider.ts` | **MORTO** — versão original antiga |
| `src/core/market/engine/MarketEngine.ts` | **MORTO** — substituído pelo pipeline Kernel |

Estes arquivos não são importados por nenhum código ativo. Podem ser deletados a qualquer momento sem impacto.

---

## Resumo da migração (8 sprints)

| Sprint | O que mudou |
|---|---|
| 1 | Kernel bootstrapped — engines instanciados |
| 2 | SimulationClock assume o controle do tempo |
| 3 | MarketStateEngine alimentado por tick (fonte autoritativa) |
| 4 | FlowEngine removido do pipeline (EventBus é a espinha) |
| 5 | SyntheticMarketProvider eliminado — KernelMarketGenerator assume |
| 6 | Players com perfis reais geram atividade (8-12 bots) |
| 7 | MatchingEngine implementado FIFO — preço nasce do casamento |
| 8 | Limpeza final — comentários, docs, validação |

---

## Resultado

O FlowTrainerPro agora é um **motor de simulação de microestrutura de mercado**, não mais um gerador de dados sintéticos. O preço, o volume, o delta, o TT e o book são todos consequência do mesmo mecanismo central: ordens colocadas por players identificados sendo casadas pelo MatchingEngine.

Isso permite:
- Cenários onde BTG defende um nível → o preço realmente para ali
- Cenários de rompimento → MatchingEngine consome toda a liquidez do level
- Cenários de absorção → players passivos absorvem sem que o preço se mova
- O trader (usuário) entrando na mesma fila FIFO que os bots
- Tudo sem precisar "scripttar" o preço — o comportamento emerge do sistema

---

## Próximos passos (pós-migração)

1. **Conectar OrderManager do trader ao MatchingEngine** — ordens do usuário entram na fila real
2. **Cenários com Market Director** — configura quais players estão ativos e com qual bias
3. **Difficulty Engine** — ajusta agressividade e ruído conforme evolução do aluno
4. **Gráfico 8P Atemporal** — derivado das Executions do MatchingEngine
5. **Replay de sessão** — reproduzir executions anteriores com mesmo seed
