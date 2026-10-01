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

- **Build quebrado e 17/18 arquivos de teste falhando** — `PanelRegistry`, `panels/index`, `workspace/index`, `App.tsx`/`AppShell.tsx` importam módulos não commitados (`src/panels/*/`, `WorkspaceManager/`, `src/ui/designSystem`, `src/core/kernel/`). Lista completa em `docs/Architecture.md` § Ausências.
- **Item 0 do BACKLOG** (restaurar esses módulos) bloqueia qualquer outra verificação. Não declare "pronto" sem `tsc` + `vitest` verdes.
- Docs que citam `src/market/`, `src/modules/`, `SyntheticMarketProvider` são **históricos** — o tree atual não os tem.

## Regras

1. Universo do Mercado × Universo do Trader são isolados (`PROJECT_STATUS.md` §2). Não misture.
2. UI nunca implementa regra de negócio; engines concentram lógica.
3. Replay histórico: evento `historical:trade:executed`, nunca `matching:execution:created`; não tocar posição/stops/P&L/FIFO.
4. Fila: só via API read-only `getOrderQueueState(orderId)`; preço tocar o nível ≠ execução.
5. Commits em inglês, Conventional Commits. Nunca `git add -A` — só paths tocados.
6. Evidência antes de afirmação: cole saída real de build/teste; sem comando rodado, não conta.
