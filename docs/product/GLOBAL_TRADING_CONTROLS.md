# Replay & Dados — Estação Unificada

## O que é

Painel único (`DataReplayPanel`) que concentra os controles de replay e dados do projeto. Substituiu os antigos `ReplayToolbar`, `ReplayPlayerPanel`, `DataPanel` e `CandleClockPanel` (fundidos).

## Estrutura (3 linhas)

### 1. Transporte
- `▶ Iniciar` / `⏸ Pausar` / `▶ Retomar` / `⏹ Finalizar` / `↺ Reset`
- Velocidade: `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`
- Perfil de mercado: `slow` / `normal` / `aggressive`
- `TRAINING FIFO` (filas menores durante treino)
- Status da sessão (idle/running/finished)

### 2. Fonte
- Seleção do ativo de estudo: `WDO sintético (simulador)` / `WDO diário (estudo)` / `PETR4 diário (estudo)`
- Materiais disponíveis (sessões por ativo)
- `Atualizar dados (brapi)` — busca o contrato corrente e salva no cache local

### 3. Sessão
- Sessão (tempo decorrido), Ticks, Último preço, progresso do Candle 8P
- Range em formação do candle

## Decisões de escopo

- **Sem CSV**: a ingestão de dados é via pipeline API → DuckDB → JSON (`npm run materials`). A importação manual de CSV foi descontinuada.
- **Sem modo ao vivo**: o projeto é 100% histórico/simulado. `LIVE_FUTURE` foi removido do source mode.
- Source modes atuais: `SYNTHETIC`, `SCENARIO`, `HISTORICAL_FILE`.

## Regras

- O painel é camada de apresentação — não altera engines ou stores de domínio além dos handlers homologados (`TradingController`, kernel).
- Não colocar ações de trading (compra/venda) no transporte.
- Botões sem handler real não são permitidos.
