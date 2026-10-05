# Dados históricos e materiais de estudo

Sem tick a tick, sem tempo real — só dados passados para estudo (decisão registrada).

## Fontes (todas sem credencial)

| Fonte | Granularidade | Uso |
|---|---|---|
| B3 COTAHIST anual (`COTAHIST_Ayyy.ZIP`) | diária | `scripts/fetch-history.ts --year YYYY` → `data/raw/` |
| brapi futuros (sem token: WIN/WDO) | diária (~1 ano) | `npm run materials:wdo` → banco + `data/materials/WDO.json` |
| brapi / bolsai / backtester free | diária / M1 limitado | futuro (WDO intradiário) |

> O COTAHIST à vista **não contém futuros de WDO** (só vista/opções/termo). WDO diário vem da
> brapi (`npm run materials:wdo`, front vigente). WDO intradiário segue pendente de fonte gratuita.
> Arquivo anual (~650MB) excede o limite de string do Node: processar por mês.

## Pipeline

```txt
fetch-history  →  data/raw/*.ZIP (+ manifest)
parse (daily.ts) → DuckDB ~/.flowtrainer/market.duckdb (override FLOWTRAINER_DB)
npm run materials -- --symbol PETR4  →  data/materials/PETR4.json
Sidebar Estudo (lê o JSON; fallback honesto quando ausente)
```

## Comandos

```bash
vite-node scripts/fetch-history.ts --year 2024 --out data/raw
npm run materials -- --symbol PETR4
npm run materials:wdo                                   # WDO diário via brapi → DuckDB + JSON
npm run validate:trade-csv -- data/imports/arquivo.csv  # valida CSV avulso (scripts/testes, sem UI)
```

Pipeline de dados históricos: ver `../CHANGELOG.md` e `../docs/arch-history-pipeline.md`.
