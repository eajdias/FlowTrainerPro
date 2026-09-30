# FlowTrainerPro Design System

## Principios

O design system do FlowTrainerPro busca um cockpit profissional de trading: escuro, compacto, preciso, legivel e com baixo ruido visual.

Regras:

- usar tokens oficiais;
- evitar hex hardcoded em novos componentes;
- preservar alta densidade sem sacrificar leitura;
- nao depender apenas de cor;
- manter foco visivel;
- respeitar `prefers-reduced-motion`;
- manter numeros com `tabular-nums`.

## Paleta

- Canvas: `#0B0E13`
- App: `#0F131A`
- Panel: `#151A23`
- Panel elevated: `#1A202B`
- Hover: `#202735`
- Border subtle: `#283140`
- Border strong: `#354154`
- Text primary: `#F4F7FB`
- Text secondary: `#A7B0BF`
- Text muted: `#707C8D`
- Accent primary: `#4D8DFF`
- Accent secondary: `#6D5DFB`
- Buy: `#23C483`
- Sell: `#FF5B68`
- Warning: `#F4B740`
- Info: `#42B8F5`
- Neutral: `#8B95A5`

## Tipografia

Fonte UI:

```txt
Inter, Segoe UI, system-ui
```

Fonte numerica:

```txt
IBM Plex Mono, SFMono-Regular, Consolas
```

Numeros de mercado devem usar `font-variant-numeric: tabular-nums`.

## Espacamento

Escala oficial:

```txt
2, 4, 6, 8, 12, 16, 20, 24, 32, 40px
```

## Radius

```txt
xs 3px
sm 5px
md 8px
lg 12px
```

## Movimento

```txt
fast 100ms
normal 160ms
slow 240ms
```

Animacoes devem ser funcionais: hover, foco, estado e feedback.

## Componentes

Criados na Fase UX 1:

- `ThemeProvider`
- `Button`
- `IconButton`
- `Badge`
- `Panel`
- `Card`
- `Surface`
- `Divider`
- `Text`
- `Tooltip`

## Controles Globais UX 2

Header, StatusBar e ReplayToolbar devem seguir o vocabulario oficial:

- source mode: `SYNTHETIC`, `SCENARIO`, `HISTORICAL`, `LIVE FUTURE`;
- sessao/replay: `IDLE`, `READY`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`, `ERROR`;
- velocidades: `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`.

Regras:

- nao usar emoji como icone profissional;
- nao criar botao sem handler real;
- nao misturar ordens de trading com transporte de replay;
- tooltips devem explicar estado, atalho ou motivo de indisponibilidade;
- controles desabilitados devem ter aparencia consistente;
- barra de progresso da ReplayToolbar e visual enquanto seek seguro nao estiver homologado.

## Painéis de Mercado UX 3

SuperDOM e Times & Trades seguem:

- densidade compacta;
- números com `tabular-nums`;
- barras translúcidas, nunca blocos sólidos saturados;
- ordens do aluno visualmente diferentes de liquidez do book;
- tipos especiais do Times & Trades separados de BUY/SELL;
- truncamento com tooltip para nomes longos;
- foco visível em controles;
- `prefers-reduced-motion` respeitado.

## Baseline Tecnico UX 1

- build validado com `npm run build`;
- testes do Design System: 7/7;
- suite completa estabilizada: 29 arquivos, 163 testes;
- testes com CSV real classificados como integracao pesada, nao unidade comum;
- comando completo oficial: `npm test` ou `npm run test:all`;
- warning conhecido fora do escopo UX 1: `INEFFECTIVE_DYNAMIC_IMPORT` em `SimulationKernel.ts`.

Detalhes em `docs/standards/TESTING_BASELINE.md`.

## Praticas Proibidas

- criar novos hex hardcoded sem justificativa;
- remover outline/foco sem substituto acessivel;
- usar emoji como icone profissional;
- colocar regra de dominio em componente visual;
- recriar tema por render;
- adicionar animacoes decorativas pesadas.
