# Spec: Redesign Completo da Interface (UI/UX)

**Status:** Pronto para execução  
**Prioridade:** Alta  
**Estimativa:** 6 fases, ~40 arquivos afetados  
**Autor:** Revisão com pesquisa em fontes primárias (2026-10-02)

---

## 1. Problema

A interface atual é percebida como: feia, anti-profissional, não fluida, não elegante, não agradável aos olhos.

**Diagnóstico técnico (evidência em código):**

| Problema | Evidência |
|----------|-----------|
| Tokens de cor limitados (17 tokens) | `src/assets/theme.css` — sem escala de elevação, sem estados, sem alpha |
| Sem sistema de movimento | Nenhum token de duração/easing; transições ad-hoc |
| Tipografia inadequada para dados | `Tahoma` para tudo; números não usam monospace real |
| Header sobrecarregado | `AppShell.tsx` — 6+ elementos competindo; source modes como `<span>` mortos |
| Layout sem hierarquia | Painéis com mesmo peso visual; sem separação clara de superfícies |
| Densidade inconsistente | Espaçamentos arbitrários entre painéis |

---

## 2. Referências coletadas (pesquisa 2026-10-02)

### 2.1 Plataformas de trading profissionais

| Fonte | URL | Insights-chave |
|-------|-----|----------------|
| **Bloomberg Terminal Design System** | vontigo.ai/docs/systems/trading-terminal | Dark-only, cyan `#00D4AA` buy / coral `#FF4757` sell, zero border-radius, sem gradientes, 100-150ms transitions |
| **Open Design — Trading Terminal** | opendesigner.io/design-systems/trading-terminal | Inter + Roboto Mono, `#00d4aa`/`#ff4757`, 14px base, "readable from two meters away" |
| **Sharpnel DOM V2** | sharpnel-trading.com/docs/panels/dom-v2 | Pull/Stack meter, delta cumulativo por preço, tape reconstruído, price spine central, barras mirror-anchored |
| **NinjaTrader SuperDOM** | static.ninjatrader.com/support/helpGuides/nt8/price_ladder_display.htm | Price column central, bid/ask laterais, botões Buy Market/PnL/Sell Market no rodapé, auto-center |
| **TradeX Institutional** | edwson.com/project-tradex-institutional.html | "Density as discipline", semantic colors reservadas para direção, rAF batching contra layout thrashing |
| **TradingView Design** | design.withfudge.com/share/tradingview.com-design | Paletas completas light/dark, action blue `#5B9CF6`, negative `#F23645`, dark-canvas `#000000` |

### 2.2 Princípios de craft e qualidade

| Fonte | URL | Insights-chave |
|-------|-----|----------------|
| **Linear — A calmer interface** | linear.app/now/behind-the-latest-design-refresh | "Structure should be felt, not seen"; sidebar dimmer; tabs compactas; reduzir ícones; bordas suaves |
| **Linear — Redesign part II** | linear.app/now/how-we-redesigned-the-linear-ui | LCH color space para temas; 3 variáveis geram 98; stress tests antes de implementar |
| **Linear Method — Craft** | linear.app/method | "Quality creates gravity"; hover fade ~150ms; qualidade é treinada por inspeção em grupo |
| **ssych ui** | ssych.com | Biblioteca React para dashboards densos de trading; "every number gets the same treatment" |

### 2.3 Data-dense dashboards

| Fonte | URL | Insights-chave |
|-------|-----|----------------|
| **pixel-show — 8 Lessons** | pixel-show.com/blog/designing-data-dense-dashboards | Dark default; 4-step elevation (6-7 hex points apart); 2 fontes (UI + mono); drawer pattern; conditional density; motion para confiança |
| **The Avocado — Micro-Animations** | theavocado.co/articles/dashboard-micro-animations-reducing-cognitive-load/ | Stagger de entrada; skeleton screens; motion contextual (rows deslizam); 150-300ms |

### 2.4 Sistemas de movimento

| Fonte | URL | Insights-chave |
|-------|-----|----------------|
| **AngularUX — Premium Motion** | blog.angularux.com | Micro-interactions ≤150ms; navigation 200-300ms; 60fps; transform/opacity only; `prefers-reduced-motion` |
| **Microcharts Motion** | microcharts.dev/docs/motion | `interact` 120ms; `update` 240ms; `enter` 360ms; reduced-motion vence |
| **IDV — GPU Animation** | interactive-data-visualization.com/high-performance-animation-gpu-acceleration/ | Batch reads/writes; só `transform`/`opacity`/`filter` no compositor; canvas fora do reconciler |

---

## 3. Filosofia do redesign

```
BLOOMBERG (dados)          LINEAR (craft)              PIXEL-SHOW (density)
─────────────────          ──────────────              ────────────────────
• Dark-only                • Structure felt not seen    • 4-step elevation
• Mono para números        • Visual weight hierarchy    • 2 fontes
• Cores semânticas         • Motion 150ms contido       • Conditional density
• Densa, sem decoração     • Reduzir ruído              • Drawer > página
```

**Princípio norteador:** _"Informação densa pode parecer calma se a hierarquia é afiada."_ (Linear)

**Anti-metas explícitas:**
- ❌ Não usar emoji como ícone profissional
- ❌ Não usar gradientes decorativos (exceto brand mark)
- ❌ Não animar valores/gráficos decorativamente
- ❌ Não usar border-radius grande (manter ≤4px para precisão)
- ❌ Não usar light mode
- ❌ Não criar botão sem handler real

---

## 4. Fases de implementação

### FASE 1 — Design Tokens (`theme.css`)

**Arquivo:** `src/assets/theme.css`

**Objetivo:** Substituir os 17 tokens atuais por um sistema completo com elevação, alpha e movimento.

```css
/* ═══ SUPERFÍCIES — 4-step elevation (6-7 pontos apart) ═══ */
:root {
  /* Elevação progressiva: canvas → app → panel → elevated → hover */
  --ftp-bg-canvas:          #0a0c10;  /* Visualização raiz */
  --ftp-bg-app:             #101216;  /* Fundo do main */
  --ftp-bg-panel:           #171a21;  /* Painéis padrão */
  --ftp-bg-panel-elevated:  #1e222b;  /* Painéis em foco, dropdowns */
  --ftp-bg-hover:           #262b36;  /* Hover state */
  --ftp-bg-overlay:         rgba(10, 12, 16, 0.72); /* Modais/backdrops */

  /* ═══ BORDAS — sutis para não competir ═══ */
  --ftp-border-subtle:      rgba(255, 255, 255, 0.06);
  --ftp-border:             rgba(255, 255, 255, 0.09);
  --ftp-border-strong:      rgba(255, 255, 255, 0.14);
  --ftp-border-accent:      rgba(77, 141, 255, 0.45);

  /* ═══ TEXTO — hierarquia clara ═══ */
  --ftp-text-primary:       #e8ebf0;
  --ftp-text-secondary:     #a8b2c1;
  --ftp-text-muted:         #6b7688;
  --ftp-text-disabled:      #4a5262;

  /* ═══ CORES SEMÂNTICAS — apenas para direção ═══ */
  --ftp-buy-primary:        #00d4aa;  /* Cyan — compra/positivo */
  --ftp-buy-dim:            rgba(0, 212, 170, 0.12);
  --ftp-sell-primary:       #ff4757;  /* Coral — venda/negativo */
  --ftp-sell-dim:           rgba(255, 71, 87, 0.12);
  --ftp-warning:            #ffb800;
  --ftp-info:               #4d8dff;  /* Accent interativo */
  --ftp-special:            #f5c400;
  --ftp-neutral:            #8b90a0;

  /* ═══ TIPOGRAFIA — 2 fontes (UI + mono) ═══ */
  --ftp-font-ui:            'Inter', 'Segoe UI', system-ui, sans-serif;
  --ftp-font-numeric:       'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  --ftp-font-size-xs:       10px;
  --ftp-font-size-sm:       11px;
  --ftp-font-size-base:     12px;
  --ftp-font-size-md:       13px;
  --ftp-font-size-lg:       14px;

  /* ═══ ESPAÇAMENTO — escala de 4px ═══ */
  --ftp-space-1:            2px;
  --ftp-space-2:            4px;
  --ftp-space-3:            6px;
  --ftp-space-4:            8px;
  --ftp-space-5:            12px;
  --ftp-space-6:            16px;
  --ftp-space-7:            24px;
  --ftp-space-8:            32px;

  /* ═══ RADIUS — precisão (≤4px) ═══ */
  --ftp-radius-xs:          2px;
  --ftp-radius-sm:          3px;
  --ftp-radius-md:          4px;

  /* ═══ MOVIMENTO — 3 durações, 2 easings ═══ */
  --ftp-duration-fast:      120ms;  /* Hover, press, feedback */
  --ftp-duration-normal:    160ms;  /* Mudanças de estado */
  --ftp-duration-slow:      240ms;  /* Overlays, transições grandes */
  --ftp-ease-out:           cubic-bezier(0.16, 1, 0.3, 1);    /* Swift out */
  --ftp-ease-in-out:        cubic-bezier(0.4, 0, 0.2, 1);     /* Standard */

  /* ═══ SOMBRAS — discretas ═══ */
  --ftp-shadow-sm:          0 1px 2px rgba(0, 0, 0, 0.24);
  --ftp-shadow-md:          0 4px 12px rgba(0, 0, 0, 0.32);
  --ftp-shadow-focus:       0 0 0 2px rgba(77, 141, 255, 0.42);

  /* ═══ Z-INDEX ═══ */
  --ftp-z-dropdown:         100;
  --ftp-z-modal:            200;
  --ftp-z-tooltip:          300;
}

/* ═══ REDUCED MOTION — acessibilidade ═══ */
@media (prefers-reduced-motion: reduce) {
  :root {
    --ftp-duration-fast:    0ms;
    --ftp-duration-normal:  0ms;
    --ftp-duration-slow:    0ms;
  }
}
```

**Passos:**
- [ ] Substituir `theme.css` com tokens acima
- [ ] Adicionar fontes via `index.html`: Inter (400/500/600/700) + JetBrains Mono (400/500) do Google Fonts
- [ ] Atualizar `global.css` para usar fontes novas
- [ ] Rodar `npx tsc --noEmit` e `npm run dev` para validar

**Rollback:** Reverter `theme.css` e `index.html`.

---

### FASE 2 — App Shell (Header + StatusBar)

**Arquivos:** `src/core/AppShell.tsx`, `src/core/AppShell.css`

**Problema atual:** Header com 6+ grupos competindo; source modes como `<span>` sem interação; brand mark com gradiente chamativo.

**Design alvo (baseado em Linear "structure felt not seen" + Bloomberg):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FT FlowTrainerPro    │ [WDO ▾] [15/07 ▾] │ [SYN] [SCN] [HIST] │ · Dashboard · Academy · Training · Analysis │ 5069.00 │ ● RUNNING │ 13:45:22 │
└──────────────────────────────────────────────────────────────────────────────┘
│                                    CONTEÚDO                                  │
└──────────────────────────────────────────────────────────────────────────────┘
│ ● Kernel ONLINE · Fonte SYNTHETIC · Sessão default · Trades 1234 · Flow ACTIVE │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Regras:**
- Altura do header: 40px (atual 48px) — menos peso
- Brand: sem gradiente; marca discreta `FT` mono + nome em `--ftp-text-secondary`
- Ativos/datas: dropdowns reais com `▾` (não texto estático)
- Source modes: chips clicáveis com estados `ativo`/`inativo`/`disabled` + tooltip
- Nav: botões ghost com peso menor; rota ativa com sublinhado sutil (não pill)
- Estado de mercado: `--ftp-font-numeric` para preço/hora
- StatusBar: altura 22px; itens com separador `·`; dot colorido por estado
- Todos os elementos interativos: `transition: var(--ftp-duration-fast)`

**Passos:**
- [ ] Reduzir altura do header/statusbar
- [ ] Trocar brand mark gradiente por sólido discreto
- [ ] Converter `<span>` source modes em `<button>` (ver spec source-mode-buttons)
- [ ] Mover nav para posição com menos peso visual
- [ ] Aplicar `--ftp-font-numeric` em preço/hora/trades
- [ ] Adicionar hover/focus states consistentes
- [ ] Testar em 1280px, 1440px, 1920px

**Rollback:** Reverter `AppShell.tsx`/`AppShell.css`.

---

### FASE 3 — Painéis Principais

**Arquivos:** `src/assets/panels.css`, `src/panels/SuperDOMPanel/*`, `src/panels/TimesTradesPanel/*`, `src/panels/PriceLadderPanel/*`, `src/panels/PanelShell/*`

**Design alvo (baseado em Sharpnel DOM V2 + NinjaTrader SuperDOM):**

**3.1 SuperDOM / Price Ladder — price spine central**
```
┌─────────────────────────────────────────┐
│ SUPERDOM              [ZERAR] [✕]       │
├──────────┬──────────┬───────────────────┤
│          │  PREÇO   │  [minha ordem]    │
│          │          │                   │
│  BID     │  5070.00 │        ASK        │
│  ▓▓▓▓▓   │◄── 5070 │                   │  ← bars mirror-anchored
│  ▓▓▓     │  5069.50 │    ▓▓▓▓▓▓         │
│          │  5069.00 │    ▓▓▓            │
└──────────┴──────────┴───────────────────┘
```

- Price spine central fixa (não rola com conteúdo)
- Bid bars ancoradas à direita do spine, crescendo para esquerda
- Ask bars ancoradas à esquerda do spine, crescendo para direita
- Cor de barra constante (não muda saturação); comprimento = magnitude
- Current price chip: fundo `--ftp-warning` com texto escuro
- Minhas ordens: visualmente distintas (borda tracejada + cor accent)
- Hover em linha: `background: var(--ftp-bg-hover)` com transição 120ms
- Click feedback: pulse 240ms no nível clicado

**3.2 Times & Trades**
- Row height: 18px (denso mas legível)
- Números em `--ftp-font-numeric` com `font-variant-numeric: tabular-nums`
- Hover: highlight sutil sem deslocar layout
- Novas linhas: sem animação de entrada (evitar distração); flash 240ms apenas em prints grandes
- Filtros: chips compactos no header do painel

**3.3 Chart8P**
- Candles: corpo sólido, pavio fino 1px
- Borda tracejada apenas no candle formando
- Grid: linhas em `--ftp-border-subtle` (quase invisível)
- Crosshair: linha fina em `--ftp-text-muted`

**3.4 PanelShell — moldura padrão**
- Header do painel: 24px altura, título em `--ftp-text-muted` uppercase 10px
- Borda: `1px solid var(--ftp-border-subtle)`
- Sem sombra; separação por cor de superfície (elevation)
- Controles no header: ghost, aparecem em hover do painel (max 2-3)

**Passos:**
- [ ] Atualizar `panels.css` com sistema de densidade
- [ ] Redesenhar SuperDOM com spine central
- [ ] Atualizar T&T com tabular-nums
- [ ] Atualizar Chart8P com grid sutil
- [ ] Atualizar PanelShell com header compacto
- [ ] Validar todos os 24 painéis visualmente

---

### FASE 4 — Componentes Base (`designSystem.tsx`)

**Arquivos:** `src/ui/designSystem.tsx`

**Melhorias:**
- `Button`: 3 variantes (`primary`, `ghost`, `danger`); alturas `24px` (compact) / `28px` (default); estados hover/active/disabled/focus explícitos
- `Badge`: cores com alpha; dot indicator opcional
- `Icon`: expandir set SVG (atualmente só `import/config/layout/help`); adicionar `play`, `pause`, `stop`, `download`, `database`, `calendar`, `chart`, `settings`
- Novo: `Tooltip` (delay 400ms, posicionamento inteligente)
- Novo: `Dropdown` (para seletores de ativo/data)
- Novo: `Modal` (overlay + focus trap)
- Novo: `Skeleton` (loading state)
- Novo: `Input` (para filtros)

**Passos:**
- [ ] Expandir ícones SVG
- [ ] Melhorar Button com variantes/estados
- [ ] Criar Dropdown
- [ ] Criar Modal
- [ ] Criar Tooltip
- [ ] Criar Skeleton
- [ ] Testar acessibilidade (focus visible, aria attributes)

---

### FASE 5 — Micro-interações e Movimento

**Arquivos:** `src/assets/global.css`, componentes que precisam de animação

**Sistema (baseado em AngularUX + Microcharts):**

| Interação | Duração | Easing | Propriedade |
|-----------|---------|--------|-------------|
| Hover em botão/row | 120ms | ease-out | background-color, color |
| Focus ring | 0ms (instant) | — | box-shadow |
| Dropdown abrir | 160ms | ease-out | opacity + translateY(4px) |
| Modal abrir | 240ms | ease-out | opacity + scale(0.98) |
| Painel drag | 0ms (segue cursor) | — | transform |
| Tooltip aparecer | 120ms após delay | ease-out | opacity |
| Valor mudando (preço) | sem animação | — | (números trocam direto) |
| Flash de execução | 240ms | ease-out | background-color |

**Regras invioláveis:**
- Animar **apenas** `transform`, `opacity`, `background-color`, `color` (compositor-friendly)
- Nunca animar `width`, `height`, `top`, `left`, `margin` (causa layout)
- Nunca animar valores numéricos (contador não conta)
- `prefers-reduced-motion`: todas as durações viram 0ms
- Sem animações em loop (exceto dot de status "pulsando" se aprovado)

**Passos:**
- [ ] Adicionar classes utilitárias em `global.css`: `.ftp-fade-in`, `.ftp-slide-up`
- [ ] Aplicar transições consistentes em todos os elementos interativos
- [ ] Implementar flash de execução no T&T/SuperDOM
- [ ] Validar 60fps no DevTools Performance
- [ ] Testar com `prefers-reduced-motion: reduce`

---

### FASE 6 — Polish e Densidade

**Arquivos:** múltiplos

**Checklist de polish final:**

- [ ] Todos os números usam `--ftp-font-numeric` + `tabular-nums`
- [ ] Todos os labels usam uppercase 10px `--ftp-text-muted` (kicker pattern)
- [ ] Nenhum hex hardcoded fora de `theme.css`
- [ ] Nenhuma sombra em painéis (elevation por superfície)
- [ ] Espaçamentos seguem escala de 4px
- [ ] Tooltips em todos os controles
- [ ] Estados vazios ("Sem execuções") com mensagem útil + ação
- [ ] Loading states com skeleton
- [ ] Error states com mensagem clara
- [ ] Contraste mínimo 4.5:1 em todo texto
- [ ] Focus visible em todo elemento interativo
- [ ] Sem overflow horizontal em 1280px
- [ ] Lighthouse a11y mantido em 100

---

## 5. Critérios de Aceite

### Mensuráveis
- [ ] `npx tsc --noEmit` → 0 erros
- [ ] `npx vitest run` → todos passando (sem regressão)
- [ ] `npm run build` → ok
- [ ] Lighthouse: acessibilidade ≥ 100, best practices ≥ 100
- [ ] Nenhum hex hardcoded fora de `theme.css` (grep)
- [ ] 60fps em operações de hover/drag (DevTools Performance)
- [ ] Contraste ≥ 4.5:1 em todo texto

### Qualitativos (verificação humana)
- [ ] Interface parece profissional em comparação lado-a-lado com Profit/Bookmap
- [ ] Hierarquia visual clara: conteúdo domina, chrome recede
- [ ] Números alinham verticalmente em colunas (tabular-nums funcionando)
- [ ] Transições sentem-se instantâneas, nunca lentas
- [ ] Nenhum elemento pisca/pula durante updates de mercado
- [ ] Aparência coesa entre todos os 24 painéis

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Fontes externas não carregam offline | Média | Médio | Fallback para system-ui/Consolas no `font-family` |
| Mudança de tokens quebra painéis existentes | Alta | Médio | Manter nomes de tokens antigos como aliases temporários |
| Animações causam jank em máquinas fracas | Média | Médio | Transform/opacity only + reduced-motion + teste em DevTools |
| Densidade excessiva prejudica legibilidade | Média | Alto | Testar com 3 usuários; row height mínimo 18px |
| Redesign quebra testes existentes | Baixa | Baixo | Testes usam data-testid/aria, não CSS |

## 7. Breaking Changes

- **Nenhum breaking change de API.** Tokens CSS são internos; componentes mantêm props.
- Seletor de ativo/data (nova funcionalidade em spec separada) adiciona UI mas não quebra existente.

## 8. Rollback

Cada fase é commit atômico. Reverter qualquer fase = `git revert <commit>`:
1. Fase 1 (tokens) — reverter `theme.css` + `index.html`
2. Fase 2 (shell) — reverter `AppShell.*`
3. Fase 3 (painéis) — reverter `panels.css` + painéis individuais
4. Fase 4 (componentes) — reverter `designSystem.tsx`
5. Fase 5 (motion) — reverter `global.css`
6. Fase 6 (polish) — reverter commit

## 9. Definition of Done

- [ ] 6 fases implementadas e commitadas atomicamente
- [ ] Testes passando sem regressão (`npx vitest run`)
- [ ] Build verde (`tsc` + `vite build`)
- [ ] Lighthouse a11y 100
- [ ] Validação visual em navegador (screenshots antes/depois)
- [ ] Documentação atualizada (`docs/design/FLOWTRAINER_DESIGN_SYSTEM.md`)
- [ ] `CHANGELOG.md` atualizado
- [ ] Nenhum segredo/arquivo gerado no diff
