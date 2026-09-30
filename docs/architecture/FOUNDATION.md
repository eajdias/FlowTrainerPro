# FlowTrainerPro — Foundation (atualizado Sprint 2)

## Arquitetura de Dados (Fluxo Principal)

```
SyntheticMarketProvider
  │  MarketTick { price, volume, delta, timestamp, brokerId, brokerName, brokerColor }
  ▼
FlowEngine (redistribui tick para listeners)
  │
  ▼
useMarketStore (Zustand) ← useFlowEngine hook conecta uma vez
  │
  ├── currentPrice, cumulativeDelta, sessionVolume, tickCount
  ├── trades[]          → TimesAndTrades panel
  ├── priceLevels[]     → PriceLadder + SuperDOM panels
  ├── volumeProfile[]   → VolumeProfile panel
  └── brokerActivity[]  → BrokerHistory panel
```

## Stores Zustand

| Store | Responsabilidade |
|---|---|
| `useMarketStore` | Dados live de mercado (preço, trades, book, VP, brokers) |
| `useWorkspaceStore` | Layout de painéis (posição, tamanho, visibilidade, workspace ativo) |

## BrokerRegistry

- 37 corretoras ativas da B3
- Cores primárias por grupo: Amarelo (Genial, JP, UBS), Azul claro (XP, Clear, Rico), Verde (Goldman, Citi, Merrill), Vermelho (BTG, Itaú, Bradesco)
- Regra de cor secundária: lote ≥ 250 contratos → cor secundária (se definida)
- Localização: `src/core/marketIdentity/`

## SyntheticMarketProvider

- Gera tick a cada 800ms
- Preço inicia em 5165.00 (WIN)
- Market phases: trend_up, trend_down, sideways (10-40 ticks cada)
- Volume proporcional ao tipo de corretora
- Lotes grandes: institucional/foreign 25% chance, retail 6% chance
- Broker escolhido aleatoriamente por tick (pool de 37)

## Layout de Painéis

Todos os painéis são free-floating com drag (title bar) + resize (8 handles).
Posições salvas no WorkspaceStore (Zustand).

| Painel | Dados |
|---|---|
| SuperDOM | `priceLevels` + delta |
| Times & Trades | `trades[]` com broker colorido |
| PriceLadder | `priceLevels` bid/ask |
| VolumeProfile | `volumeProfile[]` + POC/VAH/VAL |
| BrokerHistory | `brokerActivity[]` com cores reais |
| Chart8P | placeholder (Etapa 3) |
| OrderBookByBroker | placeholder |
| CandleClock | placeholder |

## Controles Globais UX 2

Header, StatusBar e ReplayToolbar formam a camada global de controle da aplicacao.

Essa camada:

- le stores existentes via seletores especificos;
- adapta estado para apresentacao;
- preserva contratos de `SimulationKernel`, `HistoricalReplayController`, `MatchingEngine`, FIFO, posicao, stops e P&L;
- nao executa regras de dominio;
- nao recria source mode;
- nao converte eventos historicos em execucao simulada.

ReplayToolbar expoe apenas handlers homologados na UI atual: `start`, `pause`, `stop`, `reset` e `setSpeed`.

## Engines no Kernel (esqueleto — sem lógica completa ainda)

```
SimulationKernel
  ├── SimulationClock
  ├── MarketStateEngine
  ├── OrderBookEngine
  ├── MatchingEngine
  ├── ExecutionEngine
  ├── TradeEngine
  ├── RiskEngine
  ├── DecisionEngine
  ├── StatisticsEngine
  ├── PlayerEngine
  └── ProceduralMarketDirector
```

Atualmente desconectados da UI — serão ativados na Etapa 2/3.

## Replay Historico e Projections

O fluxo historico aprovado e:

```
CSV -> MarketTrade[] -> HistoricalReplayController
    -> historical:trade:executed
    -> HistoricalMarketDataProjection
    -> market:trade:observed
    -> stores historicos / FlowAnalysis / paineis
```

Esse fluxo nao passa pelo `MatchingEngine` e nao altera posicao, stops, P&L, FIFO ou ordens do aluno.

## Broker Flow Analyzer

Analise objetiva por corretora:

```
market:trade:observed -> BrokerFlowAnalyzer -> broker:flow:snapshot:updated -> brokerFlowStore -> BrokerHistoryPanel
```

O analyzer calcula metricas quantitativas e rankings tecnicos, sem inferir intencao, posicao real ou recomendacao operacional. A UI usa `useBrokerFlow` e seletores de apresentacao; nao consome `matching:execution:created` para Broker Flow.

## Dependências do projeto

```json
react 19, react-dom 19, zustand, uuid
typescript 6, vite 8, @vitejs/plugin-react 6
```

Sem React Router (navegação por estado local).
Sem Electron (por enquanto — preparado para futuro).
