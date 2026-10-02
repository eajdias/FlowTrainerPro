# Spec: Botões de Source Mode Funcionais

**Status:** Pronto para execução  
**Prioridade:** Alta  
**Revisão:** 2026-10-02 (corrigida com evidência em código)

---

## 1. Problema

Os chips de source mode no Header (DB/SYNTHETIC, SC/SCENARIO, HF/HISTORICAL, LF/LIVE FUTURE) são `<span>` sem `onClick` — parecem botões mas não fazem nada. O usuário clica e nada acontece.

## 2. Causa Raiz (evidência em código)

| Fato | Evidência |
|------|-----------|
| Chips renderizados como `<span>` | `AppShell.tsx:147-155` — `<span className="ftp-sourceButton">` sem handler |
| `setSource()` existe e tem guard | `marketDataSourceStore.ts:24-36` — bloqueia troca com sessão running/paused |
| A troca real funciona via DataPanel | `DataPanel.tsx:52` — `setSource('HISTORICAL_FILE', file.name)` após import CSV |
| Nenhum componente chama `setSource` ao clicar no chip | grep: só DataPanel usa |

## 3. Solução

### 3.1 Converter chips em botões funcionais

**Arquivos:**
- `src/core/AppShell.tsx` — `<span>` → `<button>` com `onClick`
- `src/store/marketDataSourceStore.ts` — ampliar `setSource()` com efeitos por modo

**Comportamento por modo:**

| Modo | Ação ao clicar | Requisito |
|------|----------------|-----------|
| `SYNTHETIC` | Pausa replay histórico; kernel sintético segue disponível | Nenhum |
| `SCENARIO` | Carrega o cenário da missão ativa (se houver); senão, aviso | Missão selecionada ou cenário carregado |
| `HISTORICAL_FILE` | Ativa fonte histórica; se nenhuma sessão carregada, mostra "carregue um dataset" | Sessão carregada (CSV ou JSON) |
| `LIVE_FUTURE` | Não implementado — mantém estado, mostra tooltip "em breve" | Nenhum (desabilitado visualmente) |

**Regras de UX:**
- Chip ativo: estado visual `is-active` (já existe CSS)
- Chip disponível mas inativo: hover + cursor pointer
- Chip bloqueado (sessão rodando): `disabled` + tooltip "Pare a sessão para trocar de fonte"
- `LIVE_FUTURE`: sempre `disabled` com tooltip "Reservado para integração futura"
- Sem confirmação modal para troca — troca direta com feedback no status bar

### 3.2 Efeitos da troca em `setSource()`

**Arquivos:**
- `src/store/marketDataSourceStore.ts`

```typescript
// Ampliação do setSource com efeitos por modo
setSource: (sourceMode, sessionId = null) => {
  const training = useTrainingSessionStore.getState();
  const current = useMarketDataSourceStore.getState().sourceMode;
  if (current === sourceMode) return;                    // no-op
  if (training.status === 'running' || training.status === 'paused') return; // guard existente

  // 1. Sair de HISTORICAL_FILE: limpar projeções históricas
  if (current === 'HISTORICAL_FILE' && sourceMode !== 'HISTORICAL_FILE') {
    eventBus.emit(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, { sourceMode });
  }

  // 2. Entrar em HISTORICAL_FILE sem sessão: bloquear com aviso
  if (sourceMode === 'HISTORICAL_FILE' && !sessionId) {
    const replay = getSharedReplayEngine().getState();
    if (replay.status === 'empty') {
      // não muda o modo; emite aviso para a UI
      eventBus.emit(SOURCE_MODE_NOTICE, { kind: 'needs-session' });
      return;
    }
    sessionId = replay.sessionId;
  }

  set({ sourceMode, sessionId, isHistorical: sourceMode === 'HISTORICAL_FILE' });
}
```

### 3.3 Feedback visual e acessibilidade

**Arquivos:**
- `src/core/AppShell.tsx`, `src/core/AppShell.css`

- `aria-pressed={active}` em cada chip
- `disabled` real (não só CSS) para LIVE_FUTURE
- Tooltip com motivo quando bloqueado
- Aviso `needs-session`: status bar mostra "ℹ Carregue um dataset para ativar HISTORICAL" por 4s

## 4. Critérios de Aceite

- [ ] Clicar em SYNTHETIC/HISTORICAL troca o modo quando permitido
- [ ] Sessão rodando bloqueia troca com tooltip explicativo
- [ ] HISTORICAL sem sessão carregada não troca; mostra aviso
- [ ] LIVE_FUTURE sempre desabilitado com tooltip "em breve"
- [ ] `aria-pressed` correto em todos os chips
- [ ] Setup do status bar reflete a fonte ativa após troca
- [ ] Nenhuma regressão: replay GUI (`tests/replayQA`) continua passando
- [ ] `npx tsc --noEmit` → 0 erros

## 5. Riscos

| Risco | Mitigação |
|-------|-----------|
| Troca de fonte durante matching deixa estado órfão | Guard de sessão já existe; ampliar para pausar kernel ao entrar em HISTORICAL |
| Usuário clica repetidamente em modo indisponível | Feedback imediato (aviso 4s) + tooltip; sem fila de eventos |
| `PROJECTION_RESET` com sourceMode errado | Testar com `tests/replayQA/historicalReplayQA.test.ts` |

## 6. Rollback

Reverter `AppShell.tsx`, `AppShell.css`, `marketDataSourceStore.ts`. Nenhum dado é afetado.
