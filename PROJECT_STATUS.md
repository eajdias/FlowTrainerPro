# FlowTrainerPro — Project Status Report

**Atualizado:** Outubro 2026
**Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand (+ Electron)
**Build:** ⚠️ Quebrado — imports para arquivos inexistentes (ver § Problemas conhecidos)
**Testes:** 268/268 passando (último registro: julho 2026)

Arquitetura, módulos e backlog têm fonte única — este arquivo é só o snapshot de status e **linka** para elas.

## 1. O que é

Plataforma desktop de treinamento de trading baseada em Order Flow para Mini Dólar (WDO/WDOM). Simula mercado com microestrutura real (book FIFO, matching, players com perfis das corretoras da B3).

| Parâmetro | Valor |
|-----------|-------|
| Ativo | Mini Dólar (WDO) |
| Tick size / value | 0,50 / R$ 5,00 por tick |
| Preço inicial | 5.069,00 (formato brasileiro) |
| Clock | 150ms por tick (~6.7 ticks/s a 1x) |

## 2. Universos (snapshot homologado)

```
UNIVERSO DO MERCADO (não alterar)
├── SimulationClock (150ms/tick)
├── OrderBookEngine (FIFO)
├── MatchingEngine (price-time priority)
├── KernelMarketGenerator (players geram ordens)
├── MarketScenarioEngine (regimes + cenários scripted)
├── EventBus "matching:execution:created"
└── Stores: bookStore, tradeStore, brokerHistoryStore, volumeProfileStore

UNIVERSO DO TRADER (isolado)
├── TradingController (entrada única)
├── TraderOrderStore (armazenamento puro)
├── TraderExecutionBridge (stateless → MatchingEngine)
├── PositionStore (só por executions, tickValue=5)
├── QueueInspector (read-only)
└── SuperDOM (overlay + Shift+Click agressora)
```

Camada de treinamento: `ScenarioLibrary` (10 cenários) → missões (10) → avaliação → regras (4) → feedback → replay (recorder + player).

Interações do SuperDOM e semântica da fila FIFO: ver `docs/product/SUPERDOM_TRADING_INTERACTIONS.md` (fonte única — não duplicado aqui).

## 3. Sprints concluídas

| Sprint | Descrição | Testes |
|--------|-----------|--------|
| 1-8 | Kernel Migration | ✅ |
| 9 | Scenario Library Integration | 87/87 ✅ |
| 10 | Scenario Inspector | ✅ |
| 11 | Training Mission Engine | 57/57 ✅ |
| 13 | Mission Evaluation Engine | 21/21 ✅ |
| 14 | Mission Rules Engine | 16/16 ✅ |
| 15 | Feedback Engine | 21/21 ✅ |
| 16 | Replay Recorder | 20/20 ✅ |
| 17 | Replay Player | 16/16 ✅ |
| — | Trader Layer Homologation | 39/39 ✅ |
| — | Queue + Aggressive Orders | 27/27 ✅ |
| — | Passive Fill Diagnostic | 17/17 ✅ |
| — | Performance (Clock 150ms) | ✅ |

## 4. Problemas conhecidos

Build (`tsc`) falha por imports para arquivos não commitados (detalhe: `docs/Architecture.md` § Ausências):

- `src/panels/*/` (20+ painéis importados pelo registry; só o barrel `index.ts` existe)
- `src/workspace/WorkspaceManager/`, `LayoutManager/`, `DockManager/`
- `src/ui/designSystem` (`ThemeProvider`, `Badge`, `Button` usados em `App.tsx`/`AppShell.tsx`)
- `src/core/kernel/` (SimulationKernel, MatchingEngine, etc. citados em docs antigos)

## 5. Próximos passos

Fonte única: `docs/roadmap/BACKLOG.md`. Não duplicar a lista aqui. Item zero antes de qualquer feature: corrigir os imports quebrados (§4).
