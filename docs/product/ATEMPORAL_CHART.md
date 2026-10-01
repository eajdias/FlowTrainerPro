# Atemporal Chart 8P

## Objetivo

O gráfico 8P mostra candles atemporais construídos a partir das execuções. 8P significa
**8 pontos**: com `tickSize = 0,50`, um candle fecha com range (high−low) ≥ **8.00** (16 ticks).
O fechamento não depende de tempo, velocidade de replay, volume ou timestamp.

Motor: `RangeCandleEngine` (`src/core/marketData/candles/`), alimentado por
`matching:execution:created` via `candleFeed` (ligado no boot).

## Regras implementadas

- Abre no preço da primeira execução; atualiza OHLC + volumes C/V a cada trade.
- Fecha quando `high − low >= 8.00`; o trade que estoura **não** abre o próximo (abre no trade seguinte).
- Candles fechados são imutáveis (`Object.freeze`); em formação é sempre cópia.
- Ticks inválidos (`price/qty <= 0`) são ignorados.
- Painel lista O/H/L/C + saldo de agressão (C/V e %) por candle; formando com borda tracejada.

## Fase futura (canvas)

Viewport deslizante com auto-follow, drag horizontal, zoom (3–12px), eixo com labels em
múltiplos de tick, `ResizeObserver` com guarda de largura e medição de FPS dedicada —
conforme desenho original deste documento (seções removidas para não descrever o que não existe).
