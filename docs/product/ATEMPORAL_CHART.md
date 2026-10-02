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

## Apresentação

- Candles renderizados (corpo + pavio + barra de agressão C/V na lane inferior), ancorados à direita, com altura medida por `ResizeObserver` (preenche o painel sem scroll).
- Linhas de referência do dia com valores impressos: Máx (verde), Mín (vermelho), VWAP (azul), Abertura (amarelo) — desenhadas quando dentro do range visível; valores do dia sempre no header.
- Candle com volume ≥75% do máximo da janela e range < 3 pts ganha contorno de absorção.
