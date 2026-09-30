# Times & Trades

## Objetivo

O Times & Trades apresenta negócios observados com leitura rápida e baixa confusão visual.

A Fase UX 3 altera somente a apresentação. Não altera parser, replay, projections, `MatchingEngine`, `FlowAnalysis` ou `BrokerFlow`.

## Modos

### Compacto

Colunas:

- Hora;
- Preço;
- Qtd;
- Agressor.

### Detalhado

Colunas:

- Hora;
- Preço;
- Qtd;
- Compradora;
- Vendedora;
- Tipo.

O modo compacto e o padrão para preservar densidade em painéis menores.

## Tipos de Negócio

| Tipo | Badge |
|---|---|
| `BUY` | `BUY` |
| `SELL` | `SELL` |
| `RLP` | `RLP` |
| `DIRECT` | `DIRETO` |
| `AUCTION` | `LEILÃO` |
| `UNKNOWN` | `DESCONH.` |

Tipos especiais não são convertidos para compra ou venda.

## Destaque de Lotes

Faixas visuais:

| Faixa | Quantidade |
|---|---|
| normal | menor que 25 |
| medio | 25 a 99 |
| grande | 100 a 249 |
| excepcional | 250 ou mais |

Essas faixas são apenas visuais e não alteram dados.

## Auto-scroll

Como a lista mostra negócios recentes primeiro:

- auto-scroll acompanha o topo quando o usuário está no fluxo atual;
- ao subir no histórico, o estado passa para `PAUSED`;
- novos negócios acumulam contador visual;
- botão `LIVE` volta para o fluxo atual.

## Limite Visual

A UI limita a renderização a 250 negócios por vez. O estado lógico pode manter mais dados.

Resumo exibido:

```txt
VIS 250/500
```

## Estados

Estado vazio:

```txt
Aguardando negócios.
```

Replay concluído deve ser indicado por camada global ou futura integração de status do replay.

## Performance

A view foi separada em `TimesAndTradesView`, com normalização visual em `normalizeTradeViewModel` e `useMemo`.

Chaves de linha usam `tradeId`, preservando estabilidade.

## Acessibilidade

- botões com texto;
- tooltips em nomes truncados;
- números tabulares;
- contraste por texto e borda, não apenas cor;
- `prefers-reduced-motion` respeitado no CSS.

## Limitações

- Filtros ainda não foram implementados.
- O modo detalhado usa dados disponíveis; em live, a regra histórica de exibir apenas o agressor foi preservada.
- Não foi adicionada virtualização porque o limite visual de 250 linhas e suficiente para esta fase.
