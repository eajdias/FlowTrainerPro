# Sprint 6 — PlayerEngine Gera Ordens (Bots no Mercado)

## Objetivo
O mercado agora é gerado por **players reais** com perfis comportamentais individuais — não mais por ruído aleatório. Cada tick, 1-3 players "agem" baseados em sua personalidade, e o preço se move como consequência.

---

## Antes (Sprint 5)

```
Clock → KernelMarketGenerator.tick()
    → broker random + volume random + noise random
    → EventBus
```

## Depois (Sprint 6)

```
Clock → KernelMarketGenerator.tick()
    → selectActivePlayer() ← ponderado por agressividade
    → playerActs(player)   ← decisão baseada em perfil + fase
        → volume baseado em lotRange do BrokerProfile
        → direção baseada em bias do player + fase do mercado
        → preço move proporcional ao volume (impact)
    → EventBus (1-3 ticks por clock tick)
```

---

## O que o mercado agora possui

### Players ativos (8-12 por sessão)
Selecionados aleatoriamente do `BrokerRegistry` no início da sessão:
- BTG, XP, UBS, Goldman, Itaú, Mirae, Clear, ICAP...
- Cada um com personalidade distinta

### Comportamento por perfil

| Perfil | Comportamento |
|---|---|
| `aggressive` (BTG, Goldman, UBS) | Atua frequentemente, volumes grandes, move preço |
| `mixed` (XP, Capital, Necton) | Alterna entre agressão e passividade |
| `passive` (ICAP, BGC, Tullett) | Market maker, neutro, volumes menores |
| `distributed` (Clear, Rico, Orama) | Retail — muitos trades pequenos, segue tendência |

### Market phases (5 fases)

| Fase | Comportamento |
|---|---|
| `trend_up` | Bias comprador, players seguem a alta |
| `trend_down` | Bias vendedor, players seguem a queda |
| `sideways` | Neutro, volume disperso |
| `absorption` | Um player institucional DEFENDE um preço (absorve contra-flow) |
| `breakout` | Alta atividade, muitos players agindo simultâneamente |

### Absorção realista
Quando o mercado entra em fase `absorption`:
- Um player institucional é selecionado como "defensor"
- Ele absorve pressão contrária no nível de preço onde está
- O preço quase não se move durante a absorção
- Isso cria o padrão visual que o trader deve aprender a identificar

---

## Detalhes técnicos

### Volume por tick
Baseado no `lotRange` do `BrokerProfile`:
```
BTG:     50–1000 contratos (avg 350)
XP:      5–250 contratos (avg 50)
ICAP:    1–50 contratos (avg 10)
Goldman: 100–1200 contratos (avg 400)
```

### Price impact
O preço se move proporcionalmente ao volume:
```
impactFactor = min(volume / 200, 1.5)
priceMove = side × impactFactor × (0.15 + rand × 0.35)
```
→ BTG com 500 contratos move mais que XP com 20.

### Ticks por clock tick
- `sideways`: 1-2 ticks
- `trend`: 1-2 ticks
- `absorption`: 2-3 ticks
- `breakout`: 2-4 ticks

---

## O que o usuário vê de diferente

- **TT (Times & Trades):** negócios com corretoras que fazem sentido — BTG com lotes grandes, XP com lotes pequenos
- **BrokerHistory:** ranking mostra quem está dominando (institucional aparece no topo)
- **VolumeProfile:** concentra nos níveis onde houve absorção
- **SuperDOM:** delta reflete a direção dos players dominantes
- **Fases visíveis:** o mercado "respira" — tendência → lateralização → absorção → rompimento

---

## O que NÃO mudou

- Formato dos ticks (`MarketTick`) idêntico
- Store, painéis, operações, treinamento — tudo funciona igual
- API do hook `useFlowEngine` idêntica

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] Mercado funciona ao clicar Iniciar
- [x] TT mostra corretoras com volumes proporcionais ao perfil
- [x] Fases de absorção geram concentração de volume em um nível
- [x] Operações e treinamento funcionam
- [x] Velocidade funciona (0.5x–16x)

---

## Próximas Sprints

| Sprint | O que muda |
|---|---|
| **7** | MatchingEngine cruza ordens — preço nasce do casamento |
| **8** | KernelMarketGenerator desligado — mercado 100% por MatchingEngine |
