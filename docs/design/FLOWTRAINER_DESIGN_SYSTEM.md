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

## Paleta (tokens em `src/assets/theme.css`)

- Canvas: `#101216`
- App: `#14161b`
- Panel: `#1a1d23`
- Panel elevated: `#20242c`
- Hover: `#262b34`
- Border subtle: `#262b33`
- Border strong: `#353c47`
- Text primary: `#e8ebf0`
- Text secondary: `#b9c0cb`
- Text muted: `#828da0` (contraste ≥ 4.64 — Lighthouse a11y 100)
- Accent: `#4d8dff`
- Buy: `#00c853`
- Sell: `#ff5252`
- Warning: `#ff9800`
- Info: `#4fc3f7`
- Special: `#f5c400`

## Tipografia

Fonte UI e numérica: Tahoma (produto), fallback Segoe UI/system. Números sempre `tabular-nums`.

## Espacamento

Escala oficial:

```txt
2, 4, 6, 8, 12, 16, 20, 24, 32, 40px
```

## Radius

```txt
xs 2px
sm 3px
md 4px
```

## Movimento

```txt
fast 120ms
normal 160ms
```

Transições só em hover/foco/estado (`panels.css`); sem animação decorativa.

## Componentes (`src/ui/designSystem.tsx`)

- `ThemeProvider`
- `Button` (`primary`/`ghost`)
- `Badge` (`neutral/info/special/warning/buy/sell`)
- `Icon` (SVG inline: `import/config/layout/help`)

## Controles Globais UX 2

Header, StatusBar e ReplayToolbar devem seguir o vocabulario oficial:

- source mode: `SYNTHETIC`, `SCENARIO`, `HISTORICAL`, `LIVE FUTURE`;
- sessao/replay: `IDLE`, `READY`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`, `ERROR`;
- velocidades: `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`.

Regras:

- nao usar emoji como icone profissional (SVG inline no DS);
- nao criar botao sem handler real (source modes viraram indicadores; mortos removidos);
- nao misturar ordens de trading com transporte de replay;
- tooltips devem explicar estado, atalho ou motivo de indisponibilidade.

## Painéis de Mercado UX 3 (implementado)

SuperDOM, Times & Trades, Book, Volume Profile e Chart8P seguem:

- densidade compacta com grade fixa e ellipsis (robusto a zoom de fonte);
- números com `tabular-nums`;
- tints translúcidos compra/venda escopados ao SuperDOM;
- ordens do aluno visualmente diferentes de liquidez do book;
- fila expandida com espera média; Slip no T&T; filtros de lado/lote.

## Baseline tecnico (2026-10-01, verificado)

- `npm run build` ok; `tsc` 0 erros
- suíte: 59+ testes verdes (cobertura engines 66–100%)
- Lighthouse (navegador): acessibilidade 100, best practices 100
- warning `INEFFECTIVE_DYNAMIC_IMPORT`: não reproduz no build atual

Detalhes em `docs/standards/TESTING_BASELINE.md`.

## Praticas Proibidas

- criar novos hex hardcoded sem justificativa;
- remover outline/foco sem substituto acessivel;
- usar emoji como icone profissional;
- colocar regra de dominio em componente visual;
- recriar tema por render;
- adicionar animacoes decorativas pesadas.
