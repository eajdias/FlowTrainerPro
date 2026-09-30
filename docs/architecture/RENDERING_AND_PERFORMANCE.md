# Rendering and Performance

## Regra Geral

React representa estado. Engines e stores de dominio continuam fora da camada visual.

## UX 3 — SuperDOM

Medidas estruturais:

- `SuperDOMView` separa renderizacao pura da conexao com stores;
- linhas do ladder usam `React.memo`;
- ordens do aluno sao agrupadas por preço e lado com `useMemo`;
- normalizacao de barra de liquidez usa apenas o maior volume visivel;
- nenhuma regra de FIFO e calculada na UI;
- fila vem de `QueueInspector` read-only.

## UX 3 — Times & Trades

Medidas estruturais:

- `TimesAndTradesView` separa renderizacao pura da conexao com stores;
- limite visual de 250 linhas;
- chaves por `tradeId`;
- normalizacao visual por `normalizeTradeViewModel`;
- `useMemo` evita remap desnecessario quando a lista nao muda;
- auto-scroll acompanha o topo e pausa quando o usuario inspeciona historico.

## Medição

Baseline qualitativo antes da UX 3:

- SuperDOM renderizava todas as linhas diretamente no componente conectado;
- Times & Trades renderizava toda a lista entregue pelo store;
- não havia limite visual proprio no Times & Trades;
- fila do SuperDOM estava documentada em helper, mas não ligada ao overlay visual.

Depois da UX 3:

- SuperDOM mantém quantidade de linhas definida pelo book, com linha memoizada;
- Times & Trades renderiza no máximo 250 linhas;
- estados especiais são resolvidos por helpers puros testados;
- build e testes de regressão validam que engines não foram alteradas.

## Chart8P Atemporal

Medidas estruturais:

- candles sao projetados incrementalmente por `tradeId`, em vez de reconstruidos a partir da janela curta da store;
- `candleWidth` e `candleGap` dependem apenas do zoom, nunca da quantidade de candles;
- `visibleCandleCapacity` depende apenas da largura util e do stride do candle;
- medicoes invalidas de resize preservam a ultima largura valida;
- o canvas desenha a janela visivel mais overscan pequeno;
- diagnostico de desenvolvimento pode ser ativado por `flowtrainer.chart8p.debug`.

Invariantes testados:

- 500 e 2.000 fechamentos sequenciais sem colapso da janela;
- resize instavel com largura `0`/`undefined` sem capacidade cair para 1;
- 100 alteracoes de zoom com novos candles;
- 1.000 re-renders sem perda de historico;
- janela de store limitada a 100 trades sem apagar candles fechados do grafico.

Medição em navegador deve registrar:

- console limpo;
- ausência de overflow;
- responsividade em 1366x768, 1440x900, 1920x1080 e 2560x1440;
- comportamento em replay acelerado.

## Limitações

- FPS e long tasks ainda não possuem coletor automatizado.
- Virtualização fica reservada para quando houver evidência de necessidade.
