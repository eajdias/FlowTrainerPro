# Rendering and Performance

## Regra Geral

React representa estado. Engines e stores de domínio continuam fora da camada visual.

## Medidas aplicadas

- **Listas curtas e paginadas por janela:** tradeStore mantém 100 execuções; Times & Trades
  filtra localmente (lado, lote mínimo) + coluna Slip sem recalcular domínio.
- **Polling comedido:** painéis de diagnóstico (Debug, CandleClock, ReplayInspector, Analysis)
  atualizam em intervalo de 500–1000ms em vez de assinar cada evento.
- **Seletores granulares:** cada painel assina só os campos que exibe (sem re-render em cascata).
- **Sem cálculo de domínio na UI:** POC/VAH/VAL, slippage, fila e scores vêm prontos de engines/stores.
- **Fila via `QueueInspector` read-only** (+ seção expandida com espera média por nível).

## Chart8P

Lista de candles (O/H/L/C + agressão C/V) a partir do `RangeCandleEngine`; formando com borda
tracejada. Canvas com viewport/drag/zoom é fase futura (ver `docs/product/ATEMPORAL_CHART.md`).

## Medição em navegador (evidência 2026-10-01)

- console limpo (0 erros);
- sem overflow horizontal em 1280px;
- Lighthouse: acessibilidade 100, best practices 100;
- 50k execuções no matching em ~18ms / 23MB heap.

## Limitações

- Contador de long tasks no Debug (`PerformanceObserver`); FPS contínuo dedicado: pendente.
- Virtualização reservada para evidência de necessidade (listas atuais são curtas).
