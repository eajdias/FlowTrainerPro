# UX/UI Migration Plan

## Fase UX 1

Concluida:

- design system oficial;
- tokens centralizados;
- tema dark premium;
- App Shell com TopBar e StatusBar;
- superficies principais;
- componentes basicos.

Nao redesenha internamente os paineis de mercado.

Baseline tecnico:

- suite completa estabilizada;
- testes CSV real separados por comandos oficiais;
- `npm test` e `npm run test:all` rodam o conjunto completo;
- detalhes em `docs/standards/TESTING_BASELINE.md`.

## Fase UX 2

Concluida estruturalmente:

- Header global refinado com ativo, source mode, sessao, estado, hora e acoes globais;
- ReplayToolbar compacta com Play, Pause, Stop, Reset, velocidade e progresso visual;
- StatusBar diagnostica com Kernel, Fonte, Replay, Sessao, Flow, Broker Flow, warnings e versao;
- tooltips para estados e indisponibilidades;
- atalhos seguros para Play/Pause e velocidade;
- remocao de compra, venda, flatten e cenario/editor da toolbar global;
- documentacao em `docs/product/GLOBAL_TRADING_CONTROLS.md`.

Limitacoes mantidas para fases futuras:

- biblioteca oficial de icones ainda nao instalada;
- importacao historica visual dedicada ainda nao implementada;
- seek por timeline e step forward/back ainda sem handler homologado.

## Fase UX 3

Parcial concluida nesta etapa:

- SuperDOM ergonomico com barras de liquidez discretas, best bid/ask, last price e overlay de ordens do aluno;
- fila exposta de forma compacta quando a API read-only esta disponivel;
- Times & Trades com modo compacto/detalhado, badges de tipo, limite visual e auto-scroll;
- helpers puros e testes de UX para os dois paineis;
- documentacao de produto e performance.

Ainda pendente para UX 3:

- Book;
- Volume Profile;
- filtros do Times & Trades;
- medicao automatizada de FPS/long tasks.

## Fase UX 4

- Broker Flow;
- Broker History;
- Flow Analysis;
- Training HUD.

## Fase UX 5

- grafico atemporal: viewport horizontal explicito, janela deslizante e auto-follow implementados sem alterar a regra 8P;
- animacoes;
- responsividade;
- QA visual;
- polimento final.

## Riscos

- quebrar drag/resize;
- duplicar headers;
- reduzir contraste em informacao critica;
- alterar acidentalmente fluxos de dados.

## Criterio Permanente

Novos componentes visuais devem usar o Design System oficial.
