# Dados históricos e materiais de estudo

Sem tick a tick, sem tempo real — só dados passados para estudo (decisão registrada).

## Fontes (todas sem credencial)

| Fonte | Granularidade | Uso |
|---|---|---|
| B3 COTAHIST anual (`COTAHIST_Ayyy.ZIP`) | diária | `scripts/fetch-history.ts --year YYYY` → `data/raw/` |
| brapi / bolsai / backtester free | diária / M1 limitado | futuro (WDO intradiário); ver U2 na spec 3 |

> O COTAHIST à vista **não contém futuros de WDO** (só vista/opções/termo). Materiais v1 usam
> ações (ex.: PETR4). WDO intradiário segue pendente de fonte gratuita.
> Arquivo anual (~650MB) excede o limite de string do Node: processar por mês.

## Pipeline

```txt
fetch-history  →  data/raw/*.ZIP (+ manifest)
parse (daily.ts) → DuckDB ~/.flowtrainer/market.duckdb (override FLOWTRAINER_DB)
npm run materials -- --symbol PETR4  →  data/materials/PETR4.json
Academy (lê o JSON; fallback honesto quando ausente)
```

## Comandos

```bash
vite-node scripts/fetch-history.ts --year 2024 --out data/raw
npm run materials -- --symbol PETR4
npm run validate:trade-csv -- data/imports/arquivo.csv   # CSV tick (caminho secundário)
```

Specs: `spec-agent/2026-10-01-history-{1-acquisition,2-validation,3-storage,4-consumption}.md`.
