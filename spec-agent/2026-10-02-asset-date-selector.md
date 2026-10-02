# Spec: Seletor de Ativo e Data/Sessão

**Status:** Parcialmente implementado (ver CHANGELOG 2026-10-02; restante reavaliar antes de executar)  
**Prioridade:** Alta  
**Revisão:** 2026-10-02 (corrigida com arquitetura real)

---

## 1. Problema

O usuário não consegue selecionar qual ativo e qual data/sessão quer estudar de forma direta. Hoje:
- O seletor de ativo existe apenas como radios dentro do DataPanel (rota Training)
- Não há seletor no Header (sempre visível)
- Não existe seleção de data/sessão — os materiais mostram todas as sessões em texto

## 2. Causa Raiz (evidência em código)

| Fato | Evidência |
|------|-----------|
| Ativo é um radio group dentro do DataPanel | `DataPanel.tsx:98-105` — `role="radiogroup"` com 4 opções |
| Header mostra apenas o label (estático) | `AppShell.tsx:136-140` — `<strong>{ASSET_LABELS[asset]}</strong>` sem interação |
| Sessões existem mas não são selecionáveis | `StudyMaterial.sessions[]` tem `date`, `range`, `volume`, `gapPct`, `regime` — exibidas só como lista na Academy |
| Store não tem data/sessão selecionada | `dataAssetStore.ts` — só `asset`, `csvName` |

## 3. Solução

### 3.1 Seletor de ativo no Header (dropdown)

**Arquivos:**
- `src/store/dataAssetStore.ts` — manter `asset` + adicionar `availableAssets` derivado
- `src/core/AppShell.tsx` — substituir label estático por `Dropdown`
- `src/ui/designSystem.tsx` — criar componente `Dropdown` (ver spec redesign Fase 4)

**Interface:**
```typescript
// Dropdown genérico no designSystem
interface DropdownProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  width?: number;
}
```

**Comportamento:**
- Mostra ativo atual (ex: `WDO sintético (ao vivo) ▾`)
- Opções sempre visíveis: SYNTHETIC (sempre), WDO/PETR4 (se material existe), CSV (se csvName existe)
- Selecionar SYNTHETIC → mantém kernel; selecionar WDO/PETR4 → abre contexto de estudo (não inicia replay automaticamente)
- Selecionar CSV → carrega o CSV já importado no replay engine

### 3.2 Seletor de data/sessão

**Arquivos:**
- `src/store/dataAssetStore.ts` — adicionar `selectedDate`
- `src/core/AppShell.tsx` — segundo dropdown (data)
- `src/core/AppRouter.tsx` — Academy usa `selectedDate` para filtrar

**Interface:**
```typescript
interface DataAssetState {
  // ... existente
  selectedDate: string | null;          // ISO date 'YYYY-MM-DD'
  availableDates: string[];             // derivado do material ativo
  setSelectedDate: (date: string | null) => void;
  getActiveSessions: () => StudySession[];  // helper de leitura
}
```

**Comportamento:**
- Dropdown de data só aparece quando o ativo tem materiais (WDO/PETR4) ou sessões (CSV tem 1)
- Mostra as últimas N datas (ex: 30) + opção "Todas"
- Selecionar data → Academy/estudo filtra para aquela sessão; relatórios (range, volume, regime) mostram só ela
- Persistir seleção em `localStorage` (o store já usa `persist`)

### 3.3 Fonte de dados dos dropdowns

```
SYNTHETIC  → sempre disponível
WDO        → data/materials/WDO.json (loadStudyMaterials) OU cache brapi (localStorage)
PETR4      → data/materials/PETR4.json
CSV        → dataAssetStore.csvName (importado pelo usuário)
```

**Regra:** opção desabilitada (com tooltip) quando a fonte não existe — nunca inventar opção.

## 4. Critérios de Aceite

- [ ] Dropdown de ativo no Header substitui o label estático
- [ ] Opções refletem fontes reais: sem material → opção oculta/desabilitada
- [ ] Dropdown de data lista datas do ativo ativo (ordenadas desc)
- [ ] Selecionar data filtra a visão de estudo (Academy + StudySessions)
- [ ] Seleção persiste entre reloads (store `persist` já configurado)
- [ ] Teclado: dropdown navegável (setas + Enter + Esc)
- [ ] `npx tsc --noEmit` → 0 erros

## 5. Riscos

| Risco | Mitigação |
|-------|-----------|
| Dropdown custom difícil de acessibilizar | Usar `<button>` + `<ul role="listbox">` com `aria-activedescendant`; testar com teclado |
| Muitas datas sobrecarregam o dropdown | Limitar a 50 + input de busca por ano/mês |
| Material carrega assíncrono (cache brapi) | Loading state no dropdown; opção desabilitada até resolver |

## 6. Rollback

Reverter `dataAssetStore.ts`, `AppShell.tsx`, `AppRouter.tsx`, `Dropdown` no `designSystem.tsx`. Dados não são tocados.
