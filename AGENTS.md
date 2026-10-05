# AGENTS.md — Orquestrador

> **Leia este arquivo antes de qualquer tarefa.** Ele é o ponto de entrada para toda a documentação do projeto.

## O que é

Plataforma desktop (Electron) de treinamento de Order Flow para Mini Dólar (WDO). React 19 + TypeScript 6 + Vite 8 + Zustand + Vitest.

```bash
npm install && npm run dev      # desenvolvimento
npx vitest run                  # testes
npx tsc --noEmit                # typecheck
```

## Mapa de documentação

| Tema | Arquivo |
|------|---------|
| **Arquitetura** | `docs/architecture.md` |
| **Módulos e painéis** | `docs/modules.md` |
| **Changelog (histórico + estado)** | `CHANGELOG.md` |
| **Índice de docs** | `docs/README.md` |
| **Regras de engenharia** | `docs/engineering-handbook.md` |
| **Interações SuperDOM** | `docs/product-superdom.md` |
| **Design System** | `docs/design-system.md` |

## Regras críticas (resumo)

1. **Dois universos isolados:** Mercado (simulação) × Trader (operação). Não misture.
2. **UI não implementa regra de negócio:** engines concentram lógica; React apenas representa estado.
3. **Replay histórico:** evento `historical:trade:executed`, nunca `matching:execution:created`. Não tocar posição/stops/P&L/FIFO.
4. **Fila read-only:** só via `getOrderQueueState(orderId)`. Preço tocar nível ≠ execução.
5. **Commits:** em inglês, Conventional Commits. Nunca `git add -A` — só paths tocados.
6. **Evidência:** cole saída real de build/teste. Sem comando rodado, não conta.

## Estado atual (2026-10-02)

- Build: ✅ `tsc` 0 erros, `vite build` ok
- Testes: ✅ 61/61 passando (20 arquivos)
- App: view única `Main` (sem rotas); desk fluido em linhas × colunas; 19 painéis no registry; 3 workspaces (Tape Reading, Scalping, DOM Puro)
- Projeto 100% histórico/simulado: sem CSV na UI, sem modo ao vivo


