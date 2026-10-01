# Spec 1/4: Aquisição de dados históricos (COTAHIST → raw local)

**Data:** 2026-10-01 · **Status:** proposto · **Depende de:** nada · **Desbloqueia:** Spec 2/4
**Premissas (dono, sessão 2026-10-01):** sem tick, sem tempo real; diário basta p/ v1; nenhuma fonte
exige credencial. Padrões do repo: TS estrito, Conventional Commits, nunca `git add -A`,
gates `tsc` + `vitest` + `vite build`.

## Descoberta

- B3 publica COTAHIST anual (`COTAHIST_Ayyyy.ZIP`) e mensal; formato estável desde 1986 (fonte: pesquisa
  Exa + `b3quant`/`b3fileparser` como referência de URL — não copiar código).
- Scripts do repo rodam em Node via `vite-node` (`scripts/validate-trade-csv.ts`).
- `data/imports/README.md` documenta o formato Trade (tick); COTAHIST diário é outro formato (não misturar).

## Desenho

```
scripts/fetch-history.ts --year YYYY --out data/raw/
  → data/raw/COTAHIST_AYYYY.ZIP (+ .manifest.json: { url, fetchedAt, bytes, sha256 })
```

- `data/raw/` git-ignorado (dado volumoso, recriável).
- Download com timeout + verificação de integridade (tamanho > 0 e trailer `99` confere no Spec 2;
  aqui: HTTP 200 + bytes gravados + manifest).
- Sem parsing nesta spec além de checagem de cabeçalho (`00COTAHIST`).

## Contratos

- CLI: `vite-node scripts/fetch-history.ts --year 2024 [--out data/raw]`; exit 0 + manifest, exit ≠ 0 + mensagem em stderr.
- Manifest JSON: `{ source: 'b3-cotahist', year, url, fetchedAt, bytes, sha256 }`.

## Riscos / unknowns / breaking

- **Risco:** URL da B3 muda (baixo; estável há décadas). Mitigação: URL base em constante nomeada + fixture local p/ testes (nenhum teste bate na rede).
- **Unknown U1:** endpoint mensal exato p/ ano corrente → verificar na implementação contra a página da B3 (dono: agente; não bloqueia: anual basta p/ v1).
- **Breaking:** nenhum (arquivos novos + 1 linha em `.gitignore`).

## Rollback

- `git revert`; apagar `data/raw/*`. Nada irreversível.

## Tarefas (TDD)

### T1.1 — Fixture + manifest writer
- [ ] RED: `tests/history/fetch.test.ts` — `writeManifest(tmp)` gera JSON com os 6 campos; falha: módulo não existe
- [ ] Criar `src/core/marketData/history/fetch.ts`: `buildCotahistUrl(year)`, `writeManifest()`, `sha256File()`
- [ ] GREEN + `tsc`; rollback `git revert`

### T1.2 — Downloader (sem rede nos testes)
- [ ] RED: teste com servidor HTTP local efêmero (novo `node:http`): baixa bytes + grava manifest; falha: `downloadFile()` não existe
- [ ] Implementar com timeout 30s e erro tipado (`HttpStatusError`, `TimeoutError`)
- [ ] GREEN; rollback `git revert`
- [ ] Resultado esperado: `scripts/fetch-history.ts --year 2024` grava ZIP + manifest reais (evidência manual, fora do teste)

## DoD

- [ ] Nenhum teste acessa a rede; fixture cobre cabeçalho/trailer mínimos
- [ ] Erros de rede tipados (não `any`, não `throw string`)
- [ ] `.gitignore` cobre `data/raw/`; gates verdes com evidência fresca
