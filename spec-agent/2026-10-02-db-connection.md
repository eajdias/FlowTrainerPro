# Spec: Carregar Dados Históricos no App (Boot e Troca de Fonte)

**Status:** Parcialmente implementado (ver CHANGELOG 2026-10-02; restante reavaliar antes de executar)  
**Prioridade:** Alta  
**Revisão:** 2026-10-02 (corrigida com arquitetura real)

---

## 1. Problema

`npm run dev` sempre abre em modo SYNTHETIC. O usuário não vê os dados históricos que existem no projeto (`data/materials/WDO.json`, `PETR4.json`) nem consegue trocar para eles de forma clara.

## 2. Causa Raiz (evidência em código)

| Fato | Evidência |
|------|-----------|
| App abre em SYNTHETIC por padrão | `src/store/marketDataSourceStore.ts:20` — `sourceMode: 'SYNTHETIC'` |
| Dados existem mas não são usados no boot | `data/materials/WDO.json` e `PETR4.json` presentes; `loadStudyMaterials()` só é chamado na rota Academy e no DataPanel |
| Troca de fonte só funciona via DataPanel | `DataPanel.tsx:52` — `setSource('HISTORICAL_FILE', file.name)` após importar CSV |
| **DuckDB não é acessível pelo browser** | `@duckdb/node-api` é dependência de **scripts Node** (`scripts/*.ts` via `vite-node`); o app roda no browser |

**Arquitetura real dos dados:**
```
Scripts Node (vite-node)              Browser (Vite app)
────────────────────────              ──────────────────
brapi/COTAHIST → DuckDB               data/materials/*.json  (import.meta.glob)
       │                                      ▲
       └──→ data/materials/*.json ────────────┘
                                              
CSV do usuário ──→ parseCsvTrades ──→ HistoricalReplayEngine (memória)
```

## 3. Solução

### 3.1 Boot: detectar e apresentar dados disponíveis

**Arquivos:**
- `src/store/dataAssetStore.ts` — adicionar estado de materiais disponíveis
- `src/core/AppRouter.tsx` — carregar materiais no boot e expor na UI

**Interface:**
```typescript
// dataAssetStore.ts
interface AvailableMaterial {
  symbol: string;        // 'WDO' | 'PETR4'
  sessions: number;      // quantidade de sessões
  generatedAt: string;   // data de geração
  live: boolean;         // veio do cache brapi vs JSON versionado
}

interface DataAssetState {
  // ... existente
  materials: AvailableMaterial[];
  materialsLoaded: boolean;
  loadMaterials: () => void;   // síncrono: import.meta.glob é eager
}

// AppRouter.tsx — no mount
useEffect(() => {
  useDataAssetStore.getState().loadMaterials();
}, []);
```

**Passos:**
- [ ] Adicionar `materials` + `loadMaterials()` em `dataAssetStore.ts` (usa `loadStudyMaterials()` existente)
- [ ] Chamar no mount do `AppRouter`
- [ ] Se `materials.length > 0`, mostrar badge informativo no Header (não trocar modo automaticamente — evita surpresa)
- [ ] Badge clicável: "2 datasets disponíveis — clique para explorar"

### 3.2 Troca de fonte via UI (SYNTHETIC ↔ HISTORICAL)

**Arquivos:**
- `src/store/marketDataSourceStore.ts` — ampliar `setSource()` (ver spec `source-mode-buttons`)
- `src/core/AppShell.tsx` — chips clicáveis

**Regra de negócio:**
- Se sessão estiver rodando/pausada → bloquear troca com tooltip explicativo (já existe lógica em `setSource()`)
- Se `HISTORICAL_FILE` for ativado sem sessão carregada → mostrar estado "READY (carregue um dataset)"
- CSV importado pelo usuário tem prioridade sobre JSONs versionados como sessão ativa

### 3.3 WDO intradiário do DuckDB (opcional, fase 2)

O DuckDB local (`data/materials/market.duckdb`) guarda candles diários de COTAHIST. Para usar **intradiário** (tick a tick), o caminho correto é:

1. Script Node lê DuckDB → exporta JSON de sessão intradiária para `data/materials/sessions/<ativo>-<data>.json`
2. App carrega o JSON no `HistoricalReplayEngine` (mesmo caminho do CSV)

**Fora do escopo desta spec** — registrado para evitar tentar ler DuckDB no browser (impossível sem WASM ou endpoint).

## 4. Critérios de Aceite

- [ ] No boot, se `data/materials/*.json` existir, Header mostra badge com quantidade de datasets
- [ ] Badge abre o DataPanel ou a rota Academy com os datasets listados
- [ ] Troca SYNTHETIC ↔ HISTORICAL funciona clicando no chip (com guard de sessão rodando)
- [ ] Nenhuma regressão: teste existente de replay continua passando
- [ ] `npx tsc --noEmit` → 0 erros

## 5. Riscos

| Risco | Mitigação |
|-------|-----------|
| `import.meta.glob` eager incha o bundle se JSONs crescerem | Limitar JSONs a materiais resumidos (sessões agregadas), não trades individuais |
| Troca automática de modo confunde o usuário | Não trocar automaticamente no boot; apenas informar disponibilidade |

## 6. Rollback

Reverter `dataAssetStore.ts`, `AppRouter.tsx`, `AppShell.tsx`. Dados não são tocados (somente leitura).
