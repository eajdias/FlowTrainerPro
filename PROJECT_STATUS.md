# FlowTrainerPro — Project Status Report
**Atualizado:** Julho 2026 (Sprint Performance concluída)
**Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand (persist)
**Build:** `npx tsc --noEmit` ✅ sem erros
**Arquitetura:** CONGELADA — homologada com 39/39 testes
**Testes totais:** 268/268 passando

---

## 1. O QUE É O PROJETO

FlowTrainerPro é uma plataforma desktop de **treinamento de trading baseada em Order Flow** para Mini Dólar (WDO/WDOM). Simula um mercado com microestrutura real (order book FIFO, matching engine, players com perfis comportamentais das corretoras da B3).

**Ativo simulado:** Mini Dólar (WDO)
**Tick size:** 0,50
**Tick value:** R$ 5,00 por tick
**Formato de preço:** brasileiro (5.069,00)
**Fonte:** Tahoma Bold 8pt
**Clock:** 150ms por tick (~6.7 ticks/s a 1x)

---

## 2. ARQUITETURA (CONGELADA)

### Dois Universos Separados:

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
├── TradingController (ponto de entrada único)
├── TraderOrderStore (armazenamento puro)
├── TraderExecutionBridge (stateless, fala com MatchingEngine)
├── PositionStore (atualizado APENAS por executions, tickValue=5)
├── QueueInspector (read-only, posição na fila)
└── SuperDOM (overlay visual + Shift+Click agressora)
```

### Camada de Treinamento:
```
ScenarioLibrary (10 cenários)
├── TrainingMissionEngine (10 missões)
├── MissionEvaluationEngine (observa e coleta)
├── MissionRulesEngine (avalia 4 regras)
├── FeedbackEngine (gera relatório com templates)
└── ReplayRecorder + ReplayPlayer (grava e reproduz)
```

---

## 3. SPRINTS CONCLUÍDAS

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

---

## 4. CONFIGURAÇÃO DO ATIVO

| Parâmetro | Valor |
|-----------|-------|
| Ativo | Mini Dólar (WDO) |
| Tick size | 0,50 |
| Tick value | R$ 5,00 |
| Preço inicial | 5.069,00 |
| Formato | Brasileiro (5.069,50) |
| Clock interval | 150ms (≈6.7 ticks/s) |

---

## 5. INTERAÇÕES DO SUPERDOM

| Ação | Interação |
|------|-----------|
| BUY LIMIT (passiva) | Click normal na Qtd.Compra/Ord.Compra |
| SELL LIMIT (passiva) | Click normal na Qtd.Venda/Ord.Venda |
| BUY agressora (market) | **Shift + Click** em qualquer célula no ASK |
| SELL agressora (market) | **Shift + Click** em qualquer célula no BID |
| Cancelar ordem | Click no ✕ |
| Zerar posição | Botão ZERAR |

---

## 6. GRÁFICO 8P ATEMPORAL

- Candle fecha quando range (high-low) ≥ 4,00 (8 ticks)
- Candles finos (5px) com gap mínimo (1px)
- Subgráfico: Saldo de Agressão por candle
- Candle em formação: borda tracejada
- Candles fechados: fixos (nunca mudam)

---

## 7. FILA FIFO — OBSERVABILIDADE

Para ordens passivas do trader:
- Posição na fila (FIFO real)
- Volume à frente
- Progresso (% consumido)
- Status: AGUARDANDO | PARCIAL | PRÓXIMA | EXECUTADA | CANCELADA
- API: `getOrderQueueState(orderId)` (read-only)

**IMPORTANTE:** O preço tocar o nível NÃO garante execução. O volume precisa consumir toda a fila à frente.

---

## 8. PAINÉIS DISPONÍVEIS (18)

| Painel | Tipo |
|--------|------|
| SuperDOM | Interação (ordens + Shift agressora) |
| Times & Trades | HORA/QTD/PREÇO/COMPRADOR/VENDEDORA (só agressor) |
| Histórico de Corretoras | Corretora/Vol.Qtd/Média/Agressão/Passivo |
| Volume por Preço | Barras buy/sell, POC/VAH/VAL |
| Gráfico Tape Reading 8P | Candles atemporais (range 8 ticks) |
| Histórico ≥250 | Grandes agressões com cor da corretora |
| Histórico ≥25 | Agressões médias |
| Livro de Ofertas | Bid/Ask por nível |
| Histórico Operações | P&L, entrada, saída do trader |
| Editor de Cenários | Criar cenários sintéticos (UI) |
| Scenario Inspector | Técnico: fase, parâmetros |
| Mission Inspector | Técnico: missão ativa, regras |
| Evaluation Inspector | Técnico: trades, tempo, resultado |
| Feedback Inspector | Técnico: mensagens, regras |
| Replay Inspector | Técnico: frames gravados |
| Replay Player | Reprodução de sessão gravada |
| Training HUD | Status da sessão |
| Book | Livro simplificado |

---

## 9. COMO RODAR

```bash
cd FlowTrainerPro
npm install
npm run dev
# Iniciar: ▶ na toolbar
# Operar passiva: click no DOM
# Operar agressiva: Shift+Click no DOM
# Cenários: 📝 na toolbar
# Velocidade: 0.5x a 16x
```

---

## 10. PRÓXIMOS PASSOS (backlog)

### Alta prioridade
- Perfis de agressividade do mercado (lento/normal/agressivo)
- TRAINING FIFO opcional (filas menores)
- Importação CSV (dados reais B3)
- Pressão, Resposta e Liquidez (FlowAnalysis Sprint 17)

### Média prioridade
- Visualização avançada da fila (tooltip expandido)
- Indicador de slippage
- VisualUpdateScheduler (desacoplar sim/render)
- Virtualização Times & Trades

---

## 11. ARQUIVOS PRINCIPAIS

| Arquivo | Papel |
|---------|-------|
| `src/core/kernel/SimulationKernel.ts` | OS da simulação |
| `src/core/kernel/SimulationClock.ts` | Clock 150ms/tick |
| `src/core/kernel/KernelMarketGenerator.ts` | Players geram ordens |
| `src/core/kernel/MatchingEngine.ts` | FIFO matching |
| `src/core/kernel/OrderBookEngine.ts` | Livro de ordens |
| `src/core/kernel/MarketScenarioEngine.ts` | Regimes + cenários |
| `src/core/kernel/scenarios/ScenarioLibrary.ts` | 10 cenários |
| `src/trader/TradingController.ts` | Ponto entrada único |
| `src/trader/TraderExecutionBridge.ts` | Bridge → MatchingEngine |
| `src/trader/QueueInspector.ts` | Observabilidade da fila |
| `src/store/traderOrderStore.ts` | Ordens do trader |
| `src/store/positionStore.ts` | Posição + P&L (R$5/tick) |
| `src/store/bookStore.ts` | DOM (intenções) |
| `src/store/tradeStore.ts` | Execuções (TT) |
| `src/training/` | Missões + Avaliação + Feedback + Replay |
| `src/panels/SuperDOMPanel/SuperDOM.tsx` | DOM interativo |
| `src/panels/Chart8PPanel/AtemporalChart.tsx` | Gráfico 8P |
| `src/assets/global.css` | Tahoma Bold 8pt |
| `docs/product/SUPERDOM_TRADING_INTERACTIONS.md` | Doc interações |
