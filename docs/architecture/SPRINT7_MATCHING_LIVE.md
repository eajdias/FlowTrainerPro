# Sprint 7 — MatchingEngine Movimenta o Mercado

> ⚠️ DOCUMENTO HISTÓRICO — narrativa de migração de outro tree (FlowEngine, SyntheticMarketProvider, players com IA). Mantido como contexto; o estado real vive em `docs/Architecture.md`, `docs/roadmap/BACKLOG.md` e nos testes.
## Objetivo
O preço agora é **consequência** do casamento de ordens, não de cálculo direto. Players colocam ordens no `OrderBookEngine`. O `MatchingEngine` cruza essas ordens (FIFO price-time priority). Executions produzem os MarketTicks que alimentam a UI.

---

## Antes (Sprint 6)

```
Player decide → KernelMarketGenerator calcula preço diretamente → emite tick
(preço era "inventado")
```

## Depois (Sprint 7)

```
Player decide → cria Order (market ou limit)
    → MatchingEngine.submit(order)
    → cruza contra resting orders no Book (FIFO)
    → Execution{ price, size, aggressorBrokerId, ... }
    → KernelMarketGenerator emite MarketTick por execução
    → EventBus → Store → UI

O PREÇO NASCE DO CASAMENTO. Não é inventado.
```

---

## Matching Engine — Algoritmo FIFO

### Market Order (agressor)
1. Busca melhor preço no lado oposto (`getBestAsk` para buy, `getBestBid` para sell)
2. Pega a primeira ordem na fila daquele nível (FIFO — quem chegou primeiro)
3. Executa `min(agressor.remaining, passivo.remaining)` contratos
4. Emite `Execution`
5. Atualiza o book (reduz passivo, remove se zerado)
6. Repete até agressor estar totalmente preenchido ou book vazio

### Limit Order
1. Verifica se preço da limit cruza o melhor oposto
2. Se sim: funciona como market até não cruzar mais
3. Se sobra remainder: resting no book (entra na fila FIFO)

---

## Order Book Engine — Fila FIFO por nível

```
Preço 5165.00 [BID]
  Queue: [BTG 200, pos:1] [XP 50, pos:2] [TRADER 30, pos:3]

Preço 5165.25 [ASK]  
  Queue: [UBS 150, pos:1] [Goldman 300, pos:2]
```

Quando alguém vende a mercado 250 contratos:
- UBS 150 → executado totalmente
- Goldman 100 (de 300) → executado parcialmente
- Resultado: 2 executions, preço = 5165.25

---

## Liquidez automática

O `KernelMarketGenerator`:
1. **Seed inicial:** 5 níveis de bid + 5 de ask com ordens passivas
2. **Replenish por tick:** players passivos adicionam ordens quando spread fica largo
3. **Resultado:** sempre tem liquidez para cruzar

---

## O que o usuário vê

Mesma experiência visual — mas o mercado agora se comporta de forma muito mais realista:
- **Preço não anda sem razão** — alguém comprou/vendeu para mover
- **Volume Profile** reflete onde realmente houve execuções
- **Delta** é exato — cada exec tem agressor identificado
- **Book tem profundidade real** — não números inventados

---

## O que NÃO mudou

- Formato `MarketTick` idêntico
- Store, painéis, operações, treinamento — tudo igual
- API do `useFlowEngine` idêntica

---

## Validação

- [x] `npx tsc --noEmit` sem erros
- [x] Mercado funciona ao clicar Iniciar
- [x] Execuções aparecem no TT
- [x] Preço muda por execução (não por cálculo direto)
- [x] Book tem profundidade (orders resting em múltiplos níveis)
- [x] Velocidade e operações funcionam

---

## Próxima Sprint (8)

Sprint 8 é de **polimento e validação** — garantir que o mercado está comportando-se realisticamente, ajustar parâmetros dos players, e confirmar que o Kernel é a única fonte de mercado (sem fallbacks).
