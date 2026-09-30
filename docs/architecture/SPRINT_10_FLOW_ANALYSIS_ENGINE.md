# Sprint 10 — Flow Analysis Engine

## Objetivo
Criar uma nova engine que interpreta o fluxo de ordens em tempo real. Ela observa Executions e produz um diagnóstico contínuo do estado do mercado (FlowSnapshot). Ela NÃO altera preços, NÃO executa ordens — apenas observa e interpreta.

---

## Arquitetura

Dividida em dois níveis (seguindo a sugestão arquitetural):

```
MatchingEngine
    │ emite "matching:execution:created"
    ▼
FlowMetricsEngine (calcula métricas objetivas)
    │ janela deslizante de 40 executions
    │ volume, streaks, velocidade, levels consumed, impact
    ▼
FlowAnalysisEngine (interpreta métricas → FlowSnapshot)
    │ persistência, urgência, agressão, absorção, exaustão
    │ emite "flow:snapshot"
    ▼
EventBus → useFlowEngine subscriber → useMarketStore.flowSnapshot
    ▼
Painéis React (quando criados)
```

### Por que dois níveis?
- `FlowMetricsEngine` = medição objetiva (números puros)
- `FlowAnalysisEngine` = interpretação (semântica)
- Permite criar "escolas" diferentes de interpretação usando as mesmas métricas
- Facilita testes unitários (testar métricas isoladamente das interpretações)

---

## Eventos

| Evento | Payload | Emitido por |
|--------|---------|-------------|
| `flow:snapshot` | `FlowSnapshot` | `FlowAnalysisEngine` |

---

## FlowSnapshot

```typescript
interface FlowSnapshot {
  buyPersistence:    number;   // 0–1: consistência de agressões compradoras
  sellPersistence:   number;   // 0–1: consistência de agressões vendedoras
  buyUrgency:        number;   // 0–1: velocidade de consumo de liquidez compradora
  sellUrgency:       number;   // 0–1: velocidade de consumo de liquidez vendedora
  buyAggression:     number;   // 0–1: % do volume total que é compra
  sellAggression:    number;   // 0–1: % do volume total que é venda
  dominantSide:      'BUY' | 'SELL' | 'BALANCED';
  initiative:        'BUYERS' | 'SELLERS' | 'NEUTRAL';
  absorption:        boolean;  // alto volume + baixo deslocamento
  exhaustion:        boolean;  // preço tenta andar mas fluxo perde força
  controlSwitch:     boolean;  // mudança recente de domínio
  dominantBrokerId:  number | null;
  confidence:        number;   // 0–1: clareza da leitura
  metrics:           FlowMetrics; // métricas brutas para painéis avançados
}
```

---

## Como funciona: Persistência

Baseada em **streaks** — agressões consecutivas do mesmo lado.

```
BUY BUY BUY BUY BUY → buyPersistence = 5/15 = 0.33 (alta)
BUY SELL BUY SELL BUY → buyPersistence = 1/15 = 0.07 (baixa)
```

Normalizada contra `maxStreak = 15`. Cresce com continuidade, cai com alternância.

---

## Como funciona: Urgência

Combina dois fatores:
1. **Levels consumed** — quantos níveis de preço o agressor comeu (0–5 normalizado)
2. **Speed** — trades por segundo (0–8 normalizado)

```
urgency = (levelsConsumed/5) × 0.6 + (tradesPerSecond/8) × 0.4
```

Multiplicado por dominância (se o lado oposto domina, urgência é reduzida).

---

## Como funciona: Absorção

Detectada quando:
- Volume total na janela > 500 contratos
- Deslocamento de preço < 0.5 ticks

Significado: alguém está absorvendo enorme fluxo sem deixar o preço se mover.

---

## Como funciona: Exaustão

Detectada quando:
- Preço se moveu (priceChange > 0.5)
- Velocidade caiu (< 2 trades/segundo)
- Nenhum streak ativo (buyStreak < 2 E sellStreak < 2)

Significado: o preço continua tentando andar mas o fluxo perdeu intensidade.

---

## Como funciona: Mudança de Comando

Detectada quando:
- O `dominantSide` anterior era BUY e agora é SELL (ou vice-versa)
- Não conta transições de/para BALANCED

Significado: quem dominava perdeu o controle.

---

## FlowMetrics (nível objetivo)

```typescript
interface FlowMetrics {
  buyVolume, sellVolume, totalVolume
  buyCount, sellCount
  buyStreak, sellStreak
  tradesPerSecond
  priceChange, priceRange, highPrice, lowPrice
  levelsConsumedBuy, levelsConsumedSell
  avgBuyImpact, avgSellImpact
  dominantBrokerId, dominantBrokerVolume
}
```

Calculado sobre janela deslizante de 40 executions.

---

## Store

Novo campo em `useMarketStore`:

```typescript
flowSnapshot: FlowSnapshot
```

Atualizado via `syncFlowSnapshot()` chamado pelo subscriber de `"flow:snapshot"` no EventBus.

---

## O que NÃO foi alterado

- MatchingEngine: inalterado
- OrderBookEngine: inalterado
- KernelMarketGenerator: inalterado
- SimulationClock: inalterado
- Pipeline de ticks: inalterado
- Painéis: nenhum alterado (dados disponíveis mas não exibidos ainda)

---

## Validação

- [x] `npx tsc --noEmit` → zero erros
- [x] FlowMetricsEngine recebe executions via EventBus
- [x] FlowAnalysisEngine interpreta e emite "flow:snapshot"
- [x] useMarketStore.flowSnapshot atualizado em tempo real
- [x] Nenhum código existente foi removido ou alterado
- [x] Arquitetura preservada
