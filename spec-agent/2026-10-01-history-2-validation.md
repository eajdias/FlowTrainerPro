# Spec 2/4: Validação e normalização (COTAHIST → candles validados)

**Data:** 2026-10-01 · **Status:** proposto · **Depende de:** Spec 1/4 (formato do raw) · **Desbloqueia:** Spec 3/4
**Premissas:** sem tick/realtime; layout posicional do PDF oficial (245 bytes/registro: `00` header,
`01` cotações, `99` trailer). Padrões do repo: TS estrito, Conventional Commits, gates `tsc`+`vitest`.

## Descoberta

- Parser tick existente (`src/core/marketData/import.ts`) é outro formato — **não reutilizar**, só o estilo
  (tipos de erro, diagnósticos, `Object.freeze` na saída).
- Campos `01` relevantes: data pregão, código negociação, open/high/low/average/last, nº negócios,
  quantidade, volume. Preços em `(11)V99` (÷100).
- Consumidores futuros: store DuckDB (Spec 3/4) via `DailyCandle[]`.

## Desenho

```
texto raw (Spec 1) → parseDailyCotahist() → { candles: DailyCandle[], diagnostics }
```

- `DailyCandle` (frozen): `{ symbol, date: 'YYYY-MM-DD', o, h, l, c, trades, qty, volume }`.
- `diagnostics`: `{ physicalLines, blank, valid, invalid, outOfOrder, duplicates, firstDate, lastDate, invalidLines: [{line, reasonCode, raw}] }`.
- Deduplicação por `(symbol, date)`; ordenação crescente por data; sem milissegundos inventados
  (mesmo princípio do parser tick).

## Contratos

- `parseDailyCotahist(text: string): { candles, diagnostics }` em
  `src/core/marketData/history/daily.ts`.
- `reasonCode` prefixado `HIST_…`; `raw` truncado em 200 chars.

## Riscos / unknowns / breaking

- **Risco:** anos antigos com layout sutilmente diferente (baixo). Mitigação: fixture com 2 anos distintos.
- **Unknown:** nenhum bloqueante (layout público e estável).
- **Breaking:** nenhum (módulo novo).

## Rollback

- `git revert`. Nada irreversível.

## Tarefas (TDD)

### T2.1 — Registros válidos + diagnósticos
- [ ] RED: `tests/history/daily.test.ts` com fixture mínima (`00` + 3×`01` + `99`): espera 3 candles + `valid: 3`; falha: módulo não existe
- [ ] Implementar parser posicional + `Object.freeze`
- [ ] GREEN; casos: linha curta → `HIST_SHORT_LINE`; preço inválido → `HIST_BAD_PRICE`; data inválida → `HIST_BAD_DATE`
- [ ] Verificação: `vitest run tests/history` + `tsc`; rollback `git revert`

### T2.2 — Ordem, duplicatas, trailer
- [ ] RED: fixture fora de ordem + duplicada + trailer com total divergente → ordenado, dedup, `outOfOrder`/`duplicates` contados, warning de trailer
- [ ] GREEN; rollback `git revert`
- [ ] Resultado esperado: saída determinística e ordenada para qualquer entrada

## DoD

- [ ] Cobertura: linha inválida, duplicata, fora de ordem, trailer divergente, arquivo vazio, ano distinto
- [ ] RED observado antes de cada GREEN; gates verdes com evidência fresca
