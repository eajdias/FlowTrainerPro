# Rendering and Performance

## Regra geral

React representa estado. Engines e stores de domínio continuam fora da camada visual.

## Medidas aplicadas

- **Listas curtas e paginadas:** tradeStore mantém 100 execuções; Times & Trades filtra localmente
- **Polling comedido:** painéis de diagnóstico atualizam em 500–1000ms
- **Seletores granulares:** cada painel assina só os campos que exibe
- **Sem cálculo de domínio na UI:** POC/VAH/VAL, slippage, fila e scores vêm prontos de engines/stores
- **Fila via `QueueInspector` read-only**

## Chart8P

Lista de candles (O/H/L/C + agressão C/V) a partir do `RangeCandleEngine`; formando com borda tracejada. Canvas com viewport/drag/zoom é fase futura.

## Medição em navegador (evidência 2026-10-01)

- console limpo (0 erros)
- sem overflow horizontal em 1280px
- Lighthouse: acessibilidade 100, best practices 100
- 50k execuções no matching em ~18ms / 23MB heap

## Limitações

- Contador de long tasks no Debug (`PerformanceObserver`); FPS contínuo dedicado: pendente
- Virtualização reservada para evidência de necessidade (listas atuais são curtas)
