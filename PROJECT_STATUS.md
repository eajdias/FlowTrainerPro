# FlowTrainerPro — Project Status Report

**Atualizado:** Outubro 2026
**Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand (+ Electron)
**Build:** ✅ `npx tsc --noEmit` → 0 erros; `npx vite build` ok (2026-10-01)
**Testes:** ✅ `npx vitest run` → 43/43 (kernel 12 + flowAnalysis 18 + replayQA 3 + brokerFlowLive 1 + candles 4 + training 2 + wiring 2 + trader 1). Loop trader + fluxo/brokers ao vivo validados no navegador (0 erros de console).

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

Histórico de homologações do tree de julho/2026 (motores da época, fora deste tree):

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

Reconstrução outubro/2026 (neste tree, ver commits):

| Fase | Descrição | Evidência |
|--------|-----------|--------|
| Fundação | EventBus, designSystem, marketData, brokerRegistry, brokerFlow | tsc 0, scripts ok |
| Kernel | Matching FIFO, book, cenário, kernel 150ms, gerador | 8 testes ✅ |
| Painéis | 24 tipos do registry + workspace managers | browser validado ✅ |
| Analytics | FlowAnalysis (Hawkes/CUSUM/BOCPD), liquidity, latency | 18 testes ✅ |

## 4. Problemas conhecidos (resolvidos em 2026-10-01)

Os imports quebrados (§ anterior) foram criados a partir dos contratos: `tsc` 0 erros. Histórico preservado acima para auditoria.

## 5. Próximos passos

Fonte única: `docs/roadmap/BACKLOG.md`. Não duplicar a lista aqui.
