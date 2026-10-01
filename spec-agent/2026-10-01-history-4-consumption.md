# Spec 4/4: Consumo (materiais de estudo → Academy)

**Data:** 2026-10-01 · **Status:** proposto · **Depende de:** Spec 3/4 (leitura por janela) · **Desbloqueia:** nada (entrega final)
**Premissas:** materiais = JSON versionado derivado do banco; Academy lê JSON (renderer sem acesso
nativo). `AcademyRoute` atual em `src/core/AppRouter.tsx` (regras/dicas por missão).

## Descoberta

- Nenhum consumidor de candles existe ainda; `AcademyRoute` é o ponto de consumo.
- Padrão UI do repo: componentes representam estado, sem regra de domínio; fallback honesto quando
  falta dado (precedente: painéis com "Sem …").

## Desenho

```
DuckDB → scripts/build-materials.ts --symbol WDO
  → data/materials/WDO.json: { symbol, generatedAt, sessions: [{ date, range, volume, gapPct, regime }] }
  → AcademyRoute: seção "Sessões de estudo" (fallback: "sem materiais — rode npm run materials")
```

- Regime v1 determinístico e documentado no código: `range | trend-up | trend-down | volatile`
  (limiares fixos sobre `|c-o|/range` e `range/ATR(14)`).
- Builder puro em `src/core/analytics/history/sessionStats.ts` (testável sem IO).

## Contratos

- Script npm `materials`; JSON com os campos acima (datas `YYYY-MM-DD`).
- Sem regra de domínio no `.tsx` (só render + fallback).

## Riscos / unknowns / breaking

- **Risco:** JSON cresce (baixo). Mitigação: um arquivo por símbolo, D1 na v1.
- **Unknown:** nenhum bloqueante.
- **Breaking:** nenhum (adição + 1 script npm).

## Rollback

- `git revert`; apagar `data/materials/*` (recriável).

## Tarefas (TDD)

### T4.1 — Builder puro
- [ ] RED: `tests/history/materials.test.ts` — fixture de candles → stats com range/volume/gap/regime esperados, incluindo dia sem pregão e volume zero; falha: módulo não existe
- [ ] GREEN; rollback `git revert`

### T4.2 — Script + UI + docs
- [ ] `scripts/build-materials.ts` (DuckDB → JSON); script npm `materials`
- [ ] `AcademyRoute`: seção de sessões + fallback honesto
- [ ] Docs: `BACKLOG.md` (item), `Architecture.md` (fluxo), `data/README.md` (fontes + comandos)
- [ ] Verificação: `tsc` + `vitest` + `vite build` + navegador (playwright-cli: seção renderiza; fallback sem JSON)
- [ ] Rollback: `git revert`
- [ ] Resultado esperado: Academy exibe sessões reais ou fallback honesto

## DoD (da cadeia 1–4)

- [ ] `npm install && scripts/fetch-history.ts && build-materials` reproduzível a partir dos comandos
- [ ] `data/raw/*` e `~/.flowtrainer/` fora do versionamento; sem segredos no diff
- [ ] Gates finais verdes com evidência fresca (tsc, vitest, build, navegador)
