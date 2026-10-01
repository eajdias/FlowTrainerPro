# Spec 5/4+1: WDO via brapi (série diária gratuita, sem token)

**Data:** 2026-10-01 · **Status:** proposto · **Depende de:** Specs 3/4 (store) e 4/4 (materials/Academy)
**Origem:** promessa do produto é treino em dólar; COTAHIST à vista não tem futuros de WDO.
Verificado em sessão: `GET /api/v2/futures/term-structure?asset=WDO` e
`/api/v2/futures/historical?symbol=WDOX26` respondem **sem token** (241 barras, ~1 ano, EOD).
Sem tick, sem intraday, sem credencial — compatível com a decisão (só passado, sem tempo real).

## Descoberta

- Contrato vigente via `term-structure` (ex.: `WDOX26`, expira 2026-11-03); anterior `WDOV26` expirou.
- Barra: `{date (epoch s), open: null, high, low, average, close, settlement, trades, volume}`.
  `open` sempre `null`; barras pré-listagem vêm zeradas/null — filtrar.
- Normalização honesta p/ `DailyCandle`: `o = average ?? close` (documentar aproximação no código),
  demais campos diretos; descarta barras sem `high/low/close`.
- Academy já lê `data/materials/*.json` (Spec 4/4): `WDO.json` aparece sem mudar UI.

## Desenho

```
brapi term-structure (front WDO) → historical → normalizeBrapiFuture()
  → store.saveCandles → build-materials --symbol WDO → data/materials/WDO.json
```

- `src/core/marketData/history/brapi.ts`: `fetchFrontContract(asset)`, `fetchFutureHistory(symbol)`,
  `normalizeBrapiFuture(json)`; `fetch` injetável p/ testes (sem rede nos testes).
- Script `npm run materials:wdo` encadeando fetch → store → materials.

## Contratos

- `normalizeBrapiFuture(unknown) → DailyCandle[]` (valida shape, ignora barras nulas).
- Erros tipados `BrapiHttpError`; timeout 30s (mesmo padrão da Spec 1/4).

## Riscos / unknowns / breaking

- **Risco:** brapi muda plano/limite p/ WDO (baixo; hoje aberto). Mitigação: fixture real + falha explícita.
- **Unknown:** nenhum bloqueante (verificado ao vivo).
- **Breaking:** nenhum (adição).

## Rollback

- `git revert`; `data/materials/WDO.json` recriável.

## Tarefas (TDD)

### T5.1 — Cliente + normalização (fixture real)
- [ ] RED: `tests/history/brapi.test.ts` lê `fixtures/brapi-wdox26.json`: front-contract parse, `normalizeBrapiFuture` com `o` fallback e filtro de nulas; falha: módulo não existe
- [ ] Implementar `brapi.ts` com `fetch` injetável (default global)
- [ ] GREEN; casos: barra nula descartada, shape inválido → `BrapiShapeError`, `open`→fallback documentado
- [ ] Verificação: `vitest run tests/history` + `tsc`; rollback `git revert`

### T5.2 — Script ponta a ponta + Academy
- [ ] `scripts/materials-wdo.ts` + npm `materials:wdo` (front → history → store → materials/WDO.json)
- [ ] Evidência real: rodar e conferir `WDO.json` (~240 sessões)
- [ ] Verificação: navegador (Academy lista WDO) + gates; rollback `git revert`

## DoD

- [ ] Sem rede nos testes; RED antes do GREEN; gates verdes com evidência fresca
- [ ] `data/materials/WDO.json` versionado; `data/README.md` atualizado (fonte WDO)
