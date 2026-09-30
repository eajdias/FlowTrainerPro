# Testing Baseline — Fase UX 1

## Diagnostico do timeout

Teste original que sofreu timeout:

- arquivo: `tests/marketData/HistoricalMarketProjections.test.ts`
- caso: `HistoricalMarketDataProjection > processa CSV real completo quando arquivo existe`
- timeout anterior: 5.000ms padrao do Vitest
- classificacao: integracao pesada / validacao com arquivo real
- arquivo lido: `data/imports/WDOFUT_F_0_Trade_13-07-2026.csv`
- trades processados: 39.292
- estado global usado: `eventBus`, stores Zustand historicos, `MarketDataSourceGuard`, `PositionStore`

O caso nao e unitario comum. Ele le CSV real, faz parse do arquivo completo e projeta dezenas de milhares de eventos para stores globais.

## Evidencia

Caso CSV real isolado, cinco execucoes:

| Run | Resultado | Duracao total | Duracao do caso |
|---|---:|---:|---:|
| 1 | passou | 6.667ms | 3.339ms |
| 2 | passou | 7.160ms | 3.561ms |
| 3 | passou | 6.287ms | 2.959ms |
| 4 | passou | 6.104ms | 3.013ms |
| 5 | passou | 8.121ms | 3.864ms |

Arquivo `HistoricalMarketProjections.test.ts`, cinco execucoes observadas:

| Run | Resultado | Duracao total Vitest | CSV real | Carga 10k/100k |
|---|---:|---:|---:|---:|
| 1 | passou | 8.91s | 3.56s | 3.03s |
| 2 | passou | 8.97s | 3.40s | 3.75s |
| 3 | passou | 8.80s | 3.91s | 3.16s |
| 4 | passou | 8.08s | 3.43s | 2.88s |
| 5 | passou | 8.60s | 3.60s | 3.30s |

Suite completa, tres execucoes apos estabilizacao:

| Run | Resultado | Duracao total externa | Duracao Vitest |
|---|---:|---:|---:|
| 1 | passou | 17.445ms | 15.35s |
| 2 | passou | 17.014ms | 15.02s |
| 3 | passou | 18.361ms | 16.34s |

Suite completa sequencial:

| Modo | Resultado | Duracao total externa | Duracao Vitest |
|---|---:|---:|---:|
| `--fileParallelism=false` | passou | 31.210ms | 30.06s |

## Causa delimitada

O timeout vinha do limite padrao de 5.000ms aplicado a testes de integracao pesada com CSV real e carga. Em suite completa, esses testes concorrem com outros testes de 10.000/100.000 trades e com parse/projecoes do mesmo arquivo real, elevando a variacao acima do limite padrao.

Nao foi encontrada evidencia de falha funcional, dupla contagem, NaN, Infinity, alteracao de posicao, PnL, FIFO, stops ou MatchingEngine.

## Correcoes aplicadas

- timeout explicito de 20.000ms nos testes de CSV real pesados;
- unsubscribe explicito em listeners de teste adicionados em `eventBus`;
- comandos oficiais separados para suite completa, sequencial, CSV real, integracao e carga.

## Politica de timeout

- testes unitarios devem permanecer no timeout padrao;
- testes com CSV real, 39.292 trades ou 100.000 trades devem declarar timeout local e justificavel;
- nao reduzir volume de dados, asserts ou determinismo apenas para reduzir tempo;
- quando houver listener manual em `eventBus`, usar unsubscribe em `finally`.

## Comandos oficiais

```bash
npm test
npm run test:all
npm run test:sequential
npm run test:integration
npm run test:real-csv
npm run test:load
npm run build
```

`npm test` e `npm run test:all` rodam a suite completa.

## Baseline UX 1

- build: passou; bundle principal JS aproximado `420.88 kB`, CSS `51.27 kB`;
- suite completa: 29 arquivos, 163 testes;
- Design System: 10 componentes base;
- CSV real: 39.292 trades;
- warnings conhecidos: `INEFFECTIVE_DYNAMIC_IMPORT` em `SimulationKernel.ts`;
- console visual: sem erros no carregamento verificado;
- FPS: nao instrumentado nesta etapa;
- memoria: medicao externa via processo Node nao indicou delta confiavel; registrar com profiler dedicado em fase futura.

## Fase UX 2 — plano proposto

- padronizar toolbar global e controles;
- substituir controles textuais por IconButton onde fizer sentido;
- consolidar inputs, selects, toggles e tooltips;
- melhorar estados empty/loading/error;
- criar padrao de modais/drawers;
- manter engines e calculos de dominio fora da UI.
