# Spec 3/4: Persistência local (candles → DuckDB)

**Data:** 2026-10-01 · **Status:** proposto · **Depende de:** Spec 2/4 (`DailyCandle`) · **Desbloqueia:** Spec 4/4
**Premissas:** store of record local; renderer não acessa o banco (shell Electron ainda é stub —
`electron/*/index.ts` vazios); caminho default `~/.flowtrainer/market.duckdb`, override `FLOWTRAINER_DB`.

## Descoberta

- Padrão de teste do repo: vitest sem jsdom, lógica pura; scripts via `vite-node`.
- `DailyCandle` (frozen) chega da Spec 2/4: `{ symbol, date, o, h, l, c, trades, qty, volume }`.

## Desenho

```
DailyCandle[] → historyStore.saveCandles() → DuckDB `candles(symbol, date, o,h,l,c, trades, qty, volume)`
→ historyStore.loadCandles(symbol, from, to) ordenado
```

- PK `(symbol, date)` + upsert → re-execução idempotente.
- Módulo `src/core/marketData/history/store.ts` com injeção do caminho (sem estado global além do default).

## Contratos

- `saveCandles(rows): { inserted, updated }`; `loadCandles(symbol, from, to): DailyCandle[]`.
- Erro tipado `HistoryStoreError` (falha de IO/schema), nunca exceção nua.

## Riscos / unknowns / breaking

- **Risco:** `@duckdb/node-api` nativo pode não instalar neste Arch (médio, impacto baixo e isolado).
  Mitigação: spike de 30min primeiro; **fallback `node:sqlite`** com schema idêntico (decisão registrada no commit).
- **Unknown U1:** binário DuckDB roda aqui? → spike responde; dono: agente; trava só o backend do store, não o schema.
- **Breaking:** nenhum (módulo novo; dep runtime nova).

## Rollback

- `git revert` (+ `npm uninstall @duckdb/node-api` se adotado); apagar `~/.flowtrainer/market.duckdb` (recriável via Specs 1–2).

## Tarefas (TDD)

### T3.1 — Spike backend (time-box 30min, sem commit se falhar)
- [ ] Instalar e smoke (`:memory:` + CRUD) via script efêmero em `/tmp`; evidência impressa
- [ ] Decisão DuckDB vs SQLite registrada; rollback = uninstall

### T3.2 — Schema + upsert idempotente
- [ ] RED: `tests/history/historyStore.test.ts` — save 3 linhas, re-save, contagem estável, `loadCandles` ordenado por data; falha: módulo não existe
- [ ] GREEN; casos: janela vazia → `[]`; DB inexistente → cria; override por env
- [ ] Verificação: suíte history + `tsc`; rollback `git revert`

## DoD

- [ ] Idempotência provada (re-save não duplica); erros de IO tipados
- [ ] RED antes do GREEN; gates verdes com evidência fresca
