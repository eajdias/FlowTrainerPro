# Design System

## Princípios

Cockpit profissional de trading: escuro, compacto, preciso, legível, baixo ruído visual.
Baseado em Bloomberg Terminal (dados), Linear (craft) e pixel-show (densidade).

## Paleta (tokens em `src/assets/theme.css`)

**Superfícies (4-step elevation):**

| Token | Valor |
|-------|-------|
| `--ftp-bg-canvas` | `#0a0c10` |
| `--ftp-bg-app` | `#101216` |
| `--ftp-bg-panel` | `#171a21` |
| `--ftp-bg-panel-elevated` | `#1e222b` |
| `--ftp-bg-hover` | `#262b36` |
| `--ftp-bg-input` | `#0d0f14` |

**Bordas:** `--ftp-border-subtle` (6% white), `--ftp-border` (9%), `--ftp-border-strong` (14%), `--ftp-border-accent` (azul 45%)

**Texto:** `--ftp-text-primary` `#e8ebf0` · `--ftp-text-secondary` `#a8b2c1` · `--ftp-text-muted` `#6b7688` · `--ftp-text-disabled` `#4a5262`

**Semânticas:** buy `#00d4aa` (cyan) · sell `#ff4757` (coral) · info `#4d8dff` · warning `#ffb800` · special `#f5c400` · neutral `#8b90a0`

## Tipografia

- UI: **Inter** (fallback Segoe UI/system-ui)
- Números: **JetBrains Mono** (fallback SF Mono/Consolas)
- Números sempre com `font-variant-numeric: tabular-nums`
- Tamanhos: `--ftp-font-size-2xs` (9px) a `--ftp-font-size-lg` (14px)

## Espaçamento, Radius, Movimento

- Escala de 4px: `--ftp-space-1` (2px) a `--ftp-space-8` (32px)
- Radius: `xs 2px`, `sm 3px`, `md 4px` (precisão — sem cantos grandes)
- Movimento: `fast 120ms` · `normal 160ms` · `slow 240ms`
- Easing: `--ftp-ease-out` (swift), `--ftp-ease-in-out` (standard)
- **Regra:** animar apenas `transform`/`opacity`/`background-color`/`color`
- `prefers-reduced-motion: reduce` zera todas as durações

## Componentes (`src/ui/designSystem.tsx`)

- `ThemeProvider`
- `Button` — variantes `primary`/`ghost`/`danger`; `compact` opcional
- `Badge` — variantes `neutral/info/special/warning/buy/sell`; `dot` opcional
- `Tooltip` — texto explicativo com delay via CSS
- `Skeleton` — loading state com shimmer (respeita reduced-motion)
- `Icon` — SVG inline: `import/config/layout/help/play/pause/stop/download/database/calendar/chart/search/close/chevron-down`

**Pendentes (specs consumidoras):** `Dropdown` (asset-date-selector), `Modal` (data-download)

## Controles globais

Header, StatusBar, ReplayToolbar — vocabulário oficial:
- Source mode: `SYNTHETIC`, `SCENARIO`, `HISTORICAL`, `LIVE FUTURE`
- Sessão: `IDLE`, `READY`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`, `ERROR`
- Velocidades: `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`

## Práticas proibidas

- Novos hex hardcoded fora de `theme.css` (dados de domínio — cores de corretoras — são exceção)
- Remover outline/foco sem substituto acessível
- Emoji como ícone profissional
- Regra de domínio em componente visual
- Animações decorativas pesadas ou em loop

## Baseline (2026-10-02, verificado)

- `tsc` 0 erros; `vitest` 62/62; `vite build` ok
- Lighthouse a11y 100 (manter na próxima rodada)
- Console limpo (0 erros) com kernel rodando
