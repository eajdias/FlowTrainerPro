# FlowTrainerPro — Project Status Report
**Atualizado:** Julho 2026 (Sprint 17 concluída)
**Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand (persist)
**Build:** `npx tsc --noEmit` ✅ sem erros
**Arquitetura:** CONGELADA — homologada com 39/39 testes

---

## 1. O QUE É O PROJETO

FlowTrainerPro é uma plataforma desktop de **treinamento de trading baseada em Order Flow** para Mini Dólar (WDO/WDOM). Simula um mercado com microestrutura real (order book FIFO, matching engine, players com perfis comportamentais das corretoras da B3) para que o trader aprenda a ler fluxo de ordens.

**Ativo simulado:** Mini Dólar (WDO)
**Tick size:** 0,50 (meio ponto)
**Tick value:** R$ 5,00 por tick
**Formato de preço:** brasileiro (5.069,00)

---

## 2. ARQUITETURA (CONGELADA)

### Dois Universos Separados:

```
UNIVERSO DO MERCADO (não alterar)
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
├── PositionStore (atualizado APENAS por executions)
└── SuperDOM (overlay visual)
```

### Camada de Treinamento:
```
ScenarioLibrary (10 cenários)
├── TrainingMissionEngine (controle de missões)
├── MissionEvaluationEngine (observa e coleta dados)
├── MissionRulesEngine (avalia regras)
├── FeedbackEngine (gera relatório)
└── ReplayRecorder + ReplayPlayer (grava e reproduz)
```

---

## 3. SPRINTS CONCLUÍDAS

| Sprint | Descrição | Testes |
|--------|-----------|--------|
| 1-8 | Kernel Migration (8 sprints) | ✅ |
| 9 | Scenario Library Integration | 87/87 ✅ |
| 10 | Scenario Inspector | ✅ |
| 11 | Training Mission Engine | 57/57 ✅ |
| 13 | Mission Evaluation Engine | 21/21 ✅ |
| 14 | Mission Rules Engine | 16/16 ✅ |
| 15 | Feedback Engine | 21/21 ✅ |
| 16 | Replay Recorder | 20/20 ✅ |
| 17 | Replay Player | 16/16 ✅ |
| — | Trader Layer Homologation | 39/39 ✅ |

---

## 4. CONFIGURAÇÃO DO ATIVO

| Parâmetro | Valor |
|-----------|-------|
| Ativo | Mini Dólar (WDO) |
| Tick size | 0,50 |
| Tick value | R$ 5,00 |
| Preço inicial | 5.069,00 |
| Formato | Brasileiro (5.069,50) |
| Fonte | Tahoma Bold 8pt |

---

## 5. PAINÉIS DISPONÍVEIS

| Painel | Tipo |
|--------|------|
| SuperDOM | Interação (ordens do trader) |
| Times & Trades | 5 colunas: HORA/QTD/PREÇO/COMPRADOR/VENDEDORA (só agressor) |
| Histórico de Corretoras | Corretora/Vol.Qtd/Média/Agressão/Passivo |
| Volume por Preço | Barras buy/sell, POC/VAH/VAL |
| Gráfico Tape Reading 8P | Candles atemporais (range 8 ticks) |
| Histórico ≥250 | Grandes agressões com cor da corretora |
| Histórico ≥25 | Agressões médias |
| Livro de Ofertas | Bid/Ask por nível |
| Histórico Operações | P&L, entrada, saída do trader |
| Editor de Cenários | Criar cenários sintéticos (UI) |
| Scenario Inspector | Técnico: fase, parâmetros, regime |
| Mission Inspector | Técnico: missão ativa, regras, dicas |
| Evaluation Inspector | Técnico: trades, tempo, resultado |
| Feedback Inspector | Técnico: mensagens, regras passed/failed |
| Replay Inspector | Técnico: frames gravados |
| Replay Player | Reprodução de sessão gravada |
| Training HUD | Status da sessão |

---

## 6. BIBLIOTECA DE CENÁRIOS (10)

| ID | Nome | Dificuldade |
|----|------|-------------|
| canal_rompimento_comprador | Canal + Rompimento Comprador | Beginner |
| canal_rompimento_vendedor | Canal + Rompimento Vendedor | Beginner |
| tendencia_forte | Tendência Forte | Beginner |
| lateralizacao | Lateralização | Beginner |
| pullback_rompimento | Pullback após Rompimento | Intermediate |
| absorcao_topo | Absorção no Topo | Intermediate |
| absorcao_fundo | Absorção no Fundo | Intermediate |
| exaustao | Exaustão | Intermediate |
| falso_rompimento | Falso Rompimento | Advanced |
| reversao | Reversão | Advanced |

---

## 7. BIBLIOTECA DE MISSÕES (10)

Cada missão aponta para um cenário e define:
- Objetivo didático
- Regras (maxTrades, timeLimit, posição encerrada)
- Dicas para o aluno
- Target/Stop points

---

## 8. PIPELINE COMPLETO

```
SimulationClock → KernelMarketGenerator → OrderBook → MatchingEngine
    ↓                                                       ↓
MarketScenarioEngine                              "execution:created"
    ↓                                                       ↓
Regime params → players behavior            ┌───────────────┼───────────────┐
                                            ↓               ↓               ↓
                                      tradeStore      bookStore      brokerHistoryStore
                                            ↓               ↓
                                      TT Panel        SuperDOM
                                            ↓
                                   TraderExecutionBridge
                                            ↓
                                      PositionStore
```

---

## 9. COMO RODAR

```bash
cd FlowTrainerPro
npm install
npm run dev
# Iniciar simulação: ▶ na toolbar
# Operar: click no DOM (Qtd.Compra = buy, Qtd.Venda = sell)
# Cenários: 📝 na toolbar
# Velocidade: 0.5x a 16x
```

---

## 10. ARQUIVOS PRINCIPAIS

| Arquivo | Papel |
|---------|-------|
| `src/core/kernel/SimulationKernel.ts` | OS da simulação |
| `src/core/kernel/KernelMarketGenerator.ts` | Players geram ordens |
| `src/core/kernel/MatchingEngine.ts` | FIFO matching |
| `src/core/kernel/OrderBookEngine.ts` | Livro de ordens |
| `src/core/kernel/MarketScenarioEngine.ts` | Regimes + cenários scripted |
| `src/core/kernel/scenarios/ScenarioLibrary.ts` | 10 cenários |
| `src/trader/TradingController.ts` | Ponto entrada único do trader |
| `src/trader/TraderExecutionBridge.ts` | Bridge stateless → MatchingEngine |
| `src/store/traderOrderStore.ts` | Ordens do trader (puro) |
| `src/store/positionStore.ts` | Posição + P&L (tickValue=5) |
| `src/store/bookStore.ts` | DOM (intenções) |
| `src/store/tradeStore.ts` | Execuções (TT) |
| `src/store/brokerHistoryStore.ts` | Broker history |
| `src/store/volumeProfileStore.ts` | Volume por preço |
| `src/training/MissionLibrary.ts` | 10 missões |
| `src/training/TrainingMissionEngine.ts` | Controle missões |
| `src/training/evaluation/` | Avaliação |
| `src/training/rules/` | Regras |
| `src/training/feedback/` | Feedback |
| `src/training/replay/` | Gravação + reprodução |
| `src/panels/SuperDOMPanel/SuperDOM.tsx` | DOM interativo |
| `src/panels/TimesTradesPanel/TimesAndTrades.tsx` | TT (só agressor) |
| `src/panels/Chart8PPanel/AtemporalChart.tsx` | Gráfico 8P |
| `src/workspace/WorkspaceStore.ts` | Layout persist |
| `src/shared/hooks/useFlowEngine.ts` | Bridge kernel → UI |
| `src/assets/global.css` | Tahoma Bold 8pt |
