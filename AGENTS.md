# AGENTS.md — guia para agentes LLM

Leia este arquivo antes de qualquer tarefa. Ele aponta as fontes únicas — não deduza estrutura por nomes de docs antigos.

## O que é

Plataforma desktop (Electron) de treinamento de Order Flow para Mini Dólar (WDO). React 19 + TypeScript 6 + Vite 8 + Zustand + Vitest.

```bash
npm install
npm run dev
npx vitest run          # suíte (ver § Estado real)
npx tsc --noEmit        # typecheck
```

## Fontes únicas (não duplicar conteúdo entre docs)

| Tema | Arquivo |
|------|---------|
| Arquitetura, tree real de `src/`, ausências | `docs/Architecture.md` |
| Módulos e painéis registrados | `docs/Modules.md` |
| O que falta fazer (prioridades) | `docs/roadmap/BACKLOG.md` |
| Fases concluídas / fase atual | `docs/roadmap/ROADMAP.md` |
| Status snapshot | `PROJECT_STATUS.md` |
| Índice de todos os docs | `docs/README.md` |
| Regras de engenharia e convenções | `docs/standards/FLOWTRAINER_ENGINEERING_HANDBOOK.md` |
| Interações do SuperDOM + fila FIFO | `docs/product/SUPERDOM_TRADING_INTERACTIONS.md` |

## Estado real (2026-10-01, verificado em disco)

- **Build verde:** `npx tsc --noEmit` → 0 erros; `vite build` ok; suíte 59+ testes verdes.
- **Módulos criados a partir dos contratos** (nada existia no histórico para restaurar):
  kernel (`MatchingEngine`, `OrderBookEngine`, `MarketScenarioEngine`, `SimulationKernel`),
  24 painéis, `ui/designSystem`, `marketData`, `marketIdentity`, workspace managers.
  Lista atual em `docs/Architecture.md` (tree real).
- Docs que citam `src/market/` legado, `src/modules/`, `SyntheticMarketProvider`, `FlowEngine`,
  `flow:snapshot` ou eventos `TRADE_EXECUTED`/`BOOK_UPDATE`/`trade:executed` são **históricos

## Regras

1. Universo do Mercado × Universo do Trader são isolados (`PROJECT_STATUS.md` §2). Não misture.
2. UI nunca implementa regra de negócio; engines concentram lógica.
3. Replay histórico: evento `historical:trade:executed`, nunca `matching:execution:created`; não tocar posição/stops/P&L/FIFO.
4. Fila: só via API read-only `getOrderQueueState(orderId)`; preço tocar o nível ≠ execução.
5. Commits em inglês, Conventional Commits. Nunca `git add -A` — só paths tocados.
6. Evidência antes de afirmação: cole saída real de build/teste; sem comando rodado, não conta.
