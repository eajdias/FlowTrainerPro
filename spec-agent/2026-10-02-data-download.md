# Spec: Download e Atualização de Dados pela UI

**Status:** Pronto para execução  
**Prioridade:** Média  
**Revisão:** 2026-10-02 (corrigida com arquitetura real)

---

## 1. Problema

Não há UI clara para baixar/atualizar dados de um ativo. O botão "Atualizar WDO" existe mas está escondido dentro do DataPanel (rota Training), e PETR4 não tem atualização.

## 2. Causa Raiz (evidência em código)

| Fato | Evidência |
|------|-----------|
| "Atualizar WDO" existe só no DataPanel | `DataPanel.tsx:111-113` — botão dentro do painel |
| Fluxo WDO já funciona no browser | `fetchFrontContract('WDO')` + `fetchFutureHistory` via brapi, salva em `localStorage` (`writeWdoCache`) |
| PETR4 não tem botão de atualização | `data/materials/PETR4.json` é gerado só via script `npm run materials` |
| Scripts Node (`fetch-history.ts`) não são acessíveis pela UI | São executados via `vite-node` no terminal |
| DuckDB é escrito por scripts, lido pelo browser via JSON | Ver spec `db-connection` §2 |

**Limite técnico importante:** o browser só consegue baixar dados de APIs com CORS liberado (brapi funciona). COTAHIST/DuckDB exigem scripts Node (não acessíveis da UI sem um endpoint dev).

## 3. Solução

### 3.1 Botão "Baixar Dados" no DataPanel (consolidar)

**Arquivos:**
- `src/panels/DataPanel/DataPanel.tsx` — ampliar seção de atualização
- `src/core/marketData/history/brapi.ts` — já tem o fetch; reutilizar
- `src/core/marketData/history/materials.ts` — generalizar cache por ativo

**Interface:**
```typescript
// materials.ts — generalizar cache (hoje é só ftp-wdo-cache)
export function readAssetCache(asset: string): WdoCache | null;
export function writeAssetCache(asset: string, cache: WdoCache): boolean;

// DataPanel — estado de download unificado
interface DownloadState {
  asset: 'WDO' | 'PETR4';
  status: 'idle' | 'fetching' | 'saving' | 'done' | 'error';
  message: string | null;
}
```

**Comportamento:**
- Botão "Atualizar dados" por ativo (WDO, PETR4) — usa brapi (browser, sem CORS)
- Mostra progresso: buscando contrato → baixando barras → salvando
- Resultado: "WDO atualizado (245 sessões, WDOFUT)" ou erro legível
- Atualiza `availableDates`/`availableAssets` após sucesso

### 3.2 Download com período (brapi diário)

**Arquivos:**
- `src/core/marketData/history/brapi.ts` — verificar parâmetros de range
- `src/panels/DataPanel/DataPanel.tsx` — seletor de período

**Comportamento:**
- Opções: "Último ano" (default brapi), "Últimos 30 dias", "Tudo disponível"
- brapi free limita período — mostrar aviso quando limitado

### 3.3 Fluxo Node/DuckDB (documentado, fora da UI)

Para dados que exigem script (COTAHIST anual, WDO intradiário):
- UI mostra seção "Dados avançados (terminal)": comando copiável `npm run materials:wdo`
- Copy-to-clipboard com 1 clique
- Não tentar executar script do browser (sem endpoint dev, é impossível)

**Opcional (fase 2):** Vite plugin middleware `dev-data-plugin` que expõe `POST /api/download` executando o script em dev only. Requer avaliar segurança (só localhost).

## 4. Critérios de Aceite

- [ ] Botão "Atualizar dados" funciona para WDO e PETR4 (via brapi, no browser)
- [ ] Progresso visível durante fetch (estados: fetching/saving/done/error)
- [ ] Mensagem de erro legível em falha de rede
- [ ] `availableDates` atualiza após download bem-sucedido
- [ ] Seção "Dados avançados" com comando copiável para COTAHIST/intradiário
- [ ] Nenhuma regressão nos testes de brapi/replay
- [ ] `npx tsc --noEmit` → 0 erros

## 5. Riscos

| Risco | Mitigação |
|-------|-----------|
| brapi fora do ar / rate limit | Timeout + mensagem; manter dados anteriores no cache |
| Cache localStorage estoura quota (5MB) | Guardar só últimas ~250 sessões; JSON comprimido (round de casas decimais) |
| Usuário espera baixar dados B3 completos pela UI | Mensagem clara: "Dados B3 completos: use o comando no terminal" |

## 6. Rollback

Reverter `DataPanel.tsx`, `materials.ts`, `brapi.ts`. Caches locais do usuário não são removidos (limpeza manual se necessário).
