# Atemporal Chart 8P

## Objetivo

O grafico 8P mostra candles atemporais construidos a partir das execucoes disponiveis para a fonte atual. A regra de formacao do candle permanece no dominio do grafico: abre no preco da primeira execucao, atualiza OHLC enquanto esta em formacao e fecha quando o range atinge 8,00 pontos de preco.

8P significa 8 pontos, nao 8 trades, 8 eventos, 8 segundos ou 8 ticks. No WDO atual, `tickSize = 0,50`, portanto um candle 8P corresponde a 16 ticks de amplitude.

```ts
tickSize = 0.50
pointsPerCandle = 8
ticksPerCandle = pointsPerCandle / tickSize // 16
rangeToClose = 8.00
```

O fechamento nao depende de tempo, replay speed, quantidade de trades, volume, `requestAnimationFrame` ou timestamp.

## Historico logico

O historico logico e a projecao incremental de candles mantida pelo painel a partir dos trades novos recebidos. O viewport visual nunca remove candles desse historico. Sair da area visivel significa apenas que o candle ficou fora da janela desenhada.

Importante: stores de Times & Trades podem manter uma janela curta de negocios para exibicao, mas o grafico nao reconstrói candles fechados a partir dessa janela a cada render. Cada `tradeId` novo e consumido uma vez, em ordem cronologica, para preservar candles fechados.

Cada candle recebe `candleId` sequencial estavel (`8p-0`, `8p-1`, ...). O indice absoluto pertence ao historico logico; o indice visivel pertence apenas ao viewport.

## Viewport visual

O viewport e uma janela horizontal sobre o historico logico:

- `visibleStartIndex`: primeiro candle visivel;
- `visibleEndIndex`: ultimo candle visivel;
- `visibleCandleCapacity`: quantidade de candles que cabe na area util do grafico.

Com auto-follow ativo:

```ts
visibleEndIndex = candles.length - 1
visibleStartIndex = Math.max(0, visibleEndIndex - visibleCandleCapacity + 1)
```

## Capacidade visivel

A capacidade e calculada sobre a largura util do grafico, descontando eixo de preco, margem direita e padding do candle atual:

```ts
visibleCandleCapacity = Math.max(
  1,
  Math.floor((availableChartWidth - rightPadding) / (candleWidth + candleGap)),
)
```

## Coordenada X

O X de cada candle e relativo ao inicio do viewport, nao ao indice absoluto puro:

```ts
visibleIndex = absoluteIndex - visibleStartIndex
x = chartLeftPadding + visibleIndex * (candleWidth + candleGap) + candleWidth / 2
```

Isso permite que o historico continue completo enquanto apenas a janela visivel desliza.

## Eixo de preco

O eixo vertical e calculado a partir dos candles visiveis e do ultimo preco conhecido. O dominio passa por tres etapas puras:

- coleta de `low`, `high` e `currentPrice`;
- aplicacao de padding vertical em ticks;
- arredondamento para multiplos validos de `tickSize`.

No WDO, todo label do eixo precisa respeitar `tickSize = 0,50`. O grafico nao desenha labels derivados de divisao livre da altura do canvas. Primeiro o dominio e ajustado para ticks validos, depois os labels sao gerados com um passo "nice" que tambem e multiplo inteiro do tick.

```ts
domain.minPrice = floorPriceToTick(rawMin - padding, tickSize)
domain.maxPrice = ceilPriceToTick(rawMax + padding, tickSize)
axisStep = nicePriceStep(rawStep, tickSize)
```

A conversao visual usa o mesmo dominio para desenho e leitura:

```ts
y = priceToY(price, domain, plotTop, plotHeight)
price = yToPrice(y, domain, plotTop, plotHeight)
```

O label do preco atual e desenhado dentro do canvas, alinhado a direita, para evitar truncamento na borda do painel.

## Auto-follow

Quando ativo, o ultimo candle permanece visivel automaticamente. Enquanto houver espaco, novos candles aparecem a direita sem expulsar os anteriores. Quando a tela enche, a janela avanca e os candles antigos saem gradualmente pela esquerda.

O botao `Voltar ao candle atual` reativa o auto-follow e leva o viewport para o final do historico.

## Drag e scroll horizontal

Arrastar ou usar rolagem horizontal/Shift + scroll altera `visibleStartIndex` dentro dos limites:

```ts
0 <= visibleStartIndex <= Math.max(0, candles.length - visibleCandleCapacity)
```

Ao navegar para tras, o auto-follow pausa. Novos candles continuam entrando no historico logico, mas a janela manual do usuario nao salta para o final.

## Zoom

Zoom altera a largura visual dos candles. Com auto-follow ativo, o ultimo candle continua visivel. Com auto-follow pausado, o grafico preserva aproximadamente o centro historico que o usuario estava observando.

A largura operacional do candle e independente da quantidade de candles exibidos. Ela vem apenas da configuracao de zoom, limitada entre 3px e 12px. A capacidade depende da largura; a largura nao depende da capacidade.

O zoom usa `candleWidth` como estado unico da interface. Os botoes `+` e `-` alteram essa largura diretamente, recalculam a capacidade visivel e preservam o ultimo candle quando o auto-follow esta ativo.

## Resize

Ao redimensionar o painel, a capacidade visivel e recalculada. Com auto-follow ativo, mais ou menos historico passa a aparecer mantendo o ultimo candle. Com auto-follow pausado, a navegacao manual e preservada dentro dos limites validos.

Medicoes invalidas ou momentaneamente pequenas do `ResizeObserver` preservam a ultima largura valida quando o grafico ja estava renderizado. Isso evita queda artificial da capacidade para 1 em re-render ou resize intermediario.

## Candle atual

O candle em formacao ocupa a ultima posicao visual quando auto-follow esta ativo. Quando fecha, permanece no historico e o proximo candle recebe uma nova posicao logica.

Contrato atual da projecao do grafico:

- `candles` contem candles fechados e, quando existir, o candle atual em formacao;
- o candle atual e sempre o ultimo item quando `closed = false`;
- o proximo candle abre no preco do primeiro trade recebido apos o fechamento anterior;
- um trade que ultrapassa o limite fecha o candle atual no preco observado, mas nao cria multiplos candles sinteticos no mesmo evento.

## Performance

O canvas desenha apenas a janela visivel mais pequeno overscan. O grafico evita renderizar milhares de candles fora da area util e nao recalcula regras de negocio na interacao visual.

Em desenvolvimento, diagnosticos de runtime podem ser ativados com:

```js
localStorage.setItem('flowtrainer.chart8p.debug', '1')
```

O log registra fechamento de candles, capacidade, largura, viewport e coordenadas dos ultimos candles visiveis. Essa instrumentacao nao roda em producao.

## Limitacoes

- Ainda nao ha medicao automatizada de FPS ou long tasks dedicada ao grafico.
- O controle de auto-follow horizontal e separado de qualquer centralizacao vertical de preco futura.
