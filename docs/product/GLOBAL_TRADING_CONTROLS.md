# Controles de sessão (cockpit)

## O que é

Os controles de replay e dados vivem no **header** (`src/core/SessionControls.tsx`), não mais num painel. Ações compartilhadas em `src/core/sessionActions.ts` (start/pause/resume/finish/reset + `advanceSimulation` em chunks assíncronos).

## Estrutura

### 1. Transporte
- `▶ Iniciar` / `⏸ Pausar` / `▶ Retomar` / `⏹ Finalizar` / `↺ Reset`
- Fast-forward: `⏩ +30s` / `+1min` / `+5min` (chunks de ~80 ticks, sem travar a UI)
- Velocidade: `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`

### 2. Fonte (popover)
- Ativo de estudo: `WDO sintético (simulador)` / `WDO diário (estudo)` / `PETR4 diário (estudo)`
- Data da sessão (até 80 datas dos materiais) + meta (range/volume/regime)
- Ajustes do simulador: perfil (`slow`/`normal`/`aggressive`) + `TRAINING FIFO`
- `⭳ Baixar dados (brapi)` — busca o contrato corrente e salva no cache local

### 3. Preço em destaque
- Último preço grande, colorido pelo delta acumulado (`Δ ±N`)

## Decisões de escopo

- **Sem CSV na UI**: a ingestão de dados é via pipeline API → DuckDB → JSON (`npm run materials`). A importação manual de CSV foi descontinuada (o parser segue existindo para scripts e testes).
- **Sem modo ao vivo**: o projeto é 100% histórico/simulado. `LIVE_FUTURE` foi removido do source mode.
- Source modes atuais: `SYNTHETIC`, `SCENARIO`, `HISTORICAL_FILE`.

## Regras

- Os controles são camada de apresentação — não alteram engines ou stores de domínio além dos handlers homologados (`TradingController`, kernel via `sessionActions`).
- Não colocar ações de trading (compra/venda) no transporte.
- Botões sem handler real não são permitidos.
