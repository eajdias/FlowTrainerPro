# Changelog

Histórico consolidado do projeto. Para detalhes do estado atual, ver `PROJECT_STATUS.md` e `docs/roadmap/BACKLOG.md`.

---

## 2026-10-02 — Volume Profile: layout final valor │ barra │ %

- Célula redesenhada no padrão `1.5k ▬▬▬ 74%`: valor à esquerda, **barra esticada** no meio (flex, aproveita toda a largura restante) e porcentagem à direita
- Track das barras mais visível (legibilidade dos %), fills com espelhamento (agressão cresce da direita, absorção da esquerda)
- Dimensões otimizadas para a coluna: valor 34px / barra flex / % 26px com fontes proporcionais

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo (barras proporcionais por linha, top-5 em gradiente, POC/VAH e preço atual marcados).

---

## 2026-10-02 — Volume Profile: redesign tabular espaçado

- Tabela de borda a borda com **divisores verticais** entre todas as colunas (`Preço · Agressão · Absorção · Total`)
- Linhas de **27px** com zebra alternada e bordas sutis — leitura confortável
- Valor e porcentagem separados por divisor interno (`1.5k │ 65%`)
- Fills sólidos de fundo por célula (agressão da direita, absorção da esquerda) — sem gradiente enganoso
- Resumo com respiro (POC/VAH/VAL + delta), top-5 em gradiente laranja, marcador de preço atual (barra lateral)
- CSS do resumo restaurado (havia sido perdido numa limpeza)

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo.

---

## 2026-10-02 — VP: separação valor × porcentagem

- Células de agressão/absorção: valor alinhado à esquerda, **divisor vertical** e porcentagem à direita (`1.5k │ 65%`) com padding generoso — leitura imediata de quantidade vs proporção

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo.

---

## 2026-10-02 — Assimetria do desk: VP alinhado ao ≥25 com leitura maior

**Ações:**
- Volume Profile redimensionado para a **mesma largura do Histórico ≥25** (colWeight alinhado), criando a assimetria da view: coluna fina à esquerda + gráfico largo à direita
- Leitura do VP ampliada: células de 22px (era 15), fontes de 11px (era 10), espaçamento de 3px entre linhas e padding maior

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo (VP fino alinhado ao ≥25, 3 candles com corpo+pavio, Δ +2.7k compra).

---

## 2026-10-02 — Candle 8P restaurado + Volume Profile v2 (estilo SuperDOM)

**Contexto:** Candles deformados (blocos gigantes sem pavio) e leitura ruim do Volume Profile.

**Causas raiz e correções:**
- **Candles quebrados**: os estilos `.ftp-candle-wick` e `.ftp-candle-body` (position absolute, offsets) haviam sido perdidos numa limpeza de CSS anterior — sem eles, os elementos internos caíam no fluxo normal e viravam blocos. **Restaurados** (pavio 2px, corpo absoluto com contorno).
- **Proporção**: padding da escala elevado para 18% (range bars de 8 pts não dominam mais a janela) e largura do candle reduzida (13px)
- **Volume Profile v2**: aparência alinhada ao SuperDOM — colunas `Preço · Agressão · Absorção · Total` com **células de fundo proporcional espelhadas** (agressão cresce da direita, absorção da esquerda), texto claro com sombra para contraste, % por lado, TOP 5 zonas quentes em gradiente laranja, POC/VAH/VAL e preço atual (◀)

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo — candles com corpo+pavio desenhados; VP v2 com células proporcionais (`1.5k 65% | 814 35% | 2.3k`), VAH/POC/◀ marcados, Δ +3.2k compra.

---

## 2026-10-02 — Volume Profile unificado (agressão/absorção) + SuperDOM nível profissional

**Contexto:** Volume Profile e Agressão por Preço eram o mesmo dado duplicado; SuperDOM pedia mais informação de liquidez.

**Ações:**
- **Painéis fundidos**: o "Agressão por Preço" foi absorvido pelo **Volume Profile**, que agora traz colunas completas por nível — `Preço · Volume (barra) · Agressão (compra + %) · Absorção (venda + %) · Total` — com header de colunas, POC/VAH/VAL, delta total e preço atual marcado (◀)
- **TOP 5 zonas mais quentes** destacadas com gradiente laranja progressivo (1 = mais quente → 5), além do heat contínuo na barra
- **SuperDOM com pesquisa (Jigsaw Daytradr / Bookmap)**: barra de liquidez no topo com **Total Bid, Total Ask, Imbalance % e Spread** + barra visual de imbalance; **destaque de profundidade** em células com lote ≥150 (contorno + brilho); linhas de referência do dia (Máx verde/Mín vermelho/VWAP azul/Abert amarelo) mantidas
- Layout da mesa principal: `[≥25] [T&T + ≥250] [SuperDOM] [Histórico de Corretoras]` em cima; `[Volume Profile unificado] [Gráfico 8P]` embaixo

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo — VP com colunas `Agressão 43% / Absorção 50% / Total 3.3k` e top-5 em gradiente; SuperDOM `Bid 2.7k · Ask 896 · Imb 76% · Spread 0.50`; Histórico de Corretoras com BTG +917 / CLEAR +1.1k; ≥25 e ≥250 populados.

**Nota operacional:** após remoções de arquivos, reiniciar o `npm run dev` (o HMR acumula módulo morto).

---

## 2026-10-02 — Tape Reading como base; Agressão por Preço; históricos corrigidos

**Contexto:** Default redundante; barras de agressão pouco claras; VP mal posicionado; painéis de histórico vazios (≥25/≥250/Corretoras); SuperDOM sem contexto do dia.

**Ações:**
- **Tape Reading é a mesa base** (Default removido): `[≥25] [T&T + ≥250] [SuperDOM] [Agressão × Preço]` em cima; `[Volume Profile] [Gráfico 8P largo]` embaixo
- **Barras de agressão reescritas**: empilhadas verticalmente (compra em cima, venda embaixo, altura ∝ volume) com contorno — leitura imediata de quem dominou; marcador de absorção mantido
- **Novo painel "Agressão por Preço"**: compra × venda por nível, delta colorido e **gradiente de zona quente** (heat ∝ volume²) — substituiu o VP na coluna direita
- **Volume Profile ao lado do gráfico** + marcador `◀` no preço atual
- **SuperDOM assimétrico**: trader compacto (11%), book largo (21%), preço central destacado (25%), e **linhas de referência do dia marcadas** (Máx verde, Mín vermelho, VWAP azul, Abert amarelo) com tags nas linhas
- **Cores das linhas**: Máx agora **verde** e Mín **vermelho** (no gráfico e no SuperDOM)
- **Históricos corrigidos** (causas raiz):
  - `≥25`/`≥250`: a janela de 100 trades descartava os grandes — `tradeStore` ganhou buffers dedicados (200/300 registros) e o gerador agora produz **block trades** (25% dos sweeps, 100–400 contratos)
  - `Corretoras`: só lia replay histórico — ganhou **fallback ao vivo** via `BrokerFlowAnalyzer` (compra/venda/net/atividade por corretora)
- Persist do workspace em v14

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo: ≥25 com 20+ agressões, ≥250 com "265 C CLEAR", Corretoras com BTG/CLEAR/ITAU/AGORA/XP, SuperDOM com 4 refs, gráfico com Máx verde/Mín vermelho.

---

## 2026-10-02 — Correções do Gráfico 8P: escala, linhas e barras de agressão

**Contexto:** Gráfico achatado no topo com vazio embaixo; linhas de referência invertidas (Mín no topo / Máx embaixo); barras de agressão invisíveis.

**Correções (causas raiz):**
- **Linhas invertidas**: `y()` calcula distância do topo, mas era aplicado como `bottom` — corrigido com conversão explícita `bottom = PAD_BOTTOM + (chartH - top(price))`. Máx agora no topo, Mín embaixo
- **Vazio/achatamento**: a escala incluía Máx/Mín do dia distantes dos candles — agora escala só pelos candles visíveis; referências viram linhas quando dentro do range e **sempre aparecem no header** coloridas (`Máx · Mín · VWAP · Abert`)
- **Gráfico não preenchia o painel**: `.ftp-panel-body` do gráfico não esticava (`flex: 1`) e o candle tinha `height: 170px` fixo no CSS — corrigido; altura agora é medida por `ResizeObserver` e o canvas preenche o painel completo
- **Barras de agressão invisíveis**: escala fixa (/300) com volumes pequenos — agora proporcionais ao maior volume visível (min 3px, max 14px), barra dupla compra×venda na lane inferior
- **Marcador de absorção**: candle com volume ≥75% do máximo da janela e range < 3 pts ganha contorno amarelo (`is-absorb`)

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo (13 candles preenchendo o painel; Máx 5077.00 topo / Mín 5062.50 fundo; VWAP 5070.54 e Abert 5069.50 no meio; barras de agressão visíveis).

---

## 2026-10-02 — Gráfico 8P em faixa inferior; Price Ladder no Default; labels à esquerda

**Contexto:** Gráfico com altura desperdiçada; labels das linhas à direita; Price Ladder ausente no workspace principal.

**Ações:**
- **Desk com linhas**: o sistema de layout ganhou faixas horizontais (`row` + `rowWeights`) — a linha superior concentra as janelas de trabalho e a inferior recebe o gráfico
- **Gráfico 8P**: movido para a faixa inferior, **largo e compacto verticalmente** (largura total, ~150px de candles); labels das linhas de referência (Máx/Mín/VWAP/Abertura) agora à **esquerda**
- **Price Ladder** adicionado ao workspace **Default** (bid/ask/delta por nível, 25 níveis)
- Default reorganizado: SuperDOM · Price Ladder · Times & Trades + ≥250 · Volume Profile + Book + Corretoras → **Gráfico 8P em faixa larga embaixo**; Tape Reading e Scalping também com gráfico na faixa inferior; persist do workspace em v12

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo (9 candles fechados; labels `Mín 5062.50` / `Abert 5069.50` / `Máx 5076.50` à esquerda; Price Ladder operando; Δ +1.3k compra no VP).

---

## 2026-10-02 — Gráfico 8P dominante com referências do dia; HUD e Operações absorvidos

**Contexto:** Gráfico 8P com espaço desperdiçado; Training HUD e Histórico de Operações ocupavam painéis inteiros; Volume Profile com números brutos; faltavam dados do dia (máx/mín/VWAP/abertura).

**Ações:**
- **Gráfico 8P dominante**: no workspace Default o gráfico agora ocupa a coluna principal (~2.6× de largura)
- **Linhas de referência no gráfico** com valores impressos e cores: **Máx do dia** (vermelha), **VWAP** (azul), **Abertura** (amarela) e **Mín do dia** (verde) — traçadas na escala real dos candles
- **Dados do dia** no store (`dayOpen`, `dayHigh`, `dayLow`, `dayVwap`): abertura no primeiro tick, máx/mín correntes e VWAP calculado a cada execução
- **Training HUD absorvido**: o regime foi para a statusbar (junto de Kernel/Replay/Trades/Flow); demais campos já existiam no header/statusbar
- **Histórico de Operações absorvido**: a tab **Mesa** da sidebar ganhou a seção "Operações da sessão" (lado, entrada, saída, qtd, P&L — últimas 12, coloridas)
- **Volume Profile melhorado**: value area (VAH↔VAL) destacada com fundo sutil, delta total do perfil (compra/venda) no topo e volumes formatados (k/mi)
- Layout Default reformulado em 4 colunas: SuperDOM · Tape (T&T + ≥250) · **Gráfico 8P** · Fluxo (VP + Book + Corretoras); persist do workspace em v11

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado ao vivo (Máx 5074.50 / Abert 5069.50 / VWAP 5071.22 / Mín 5064.00 impressos no gráfico; delta +220 compra no VP; Regime volatile na statusbar).

---

## 2026-10-02 — View única "Main": Dashboard e Academy absorvidos pela sidebar

**Contexto:** Três views com sobreposição (Dashboard = KPIs, Academy = ensinamentos) criavam alternância desnecessária. O usuário pediu consolidação numa única view com sidebar dinâmica.

**Ações:**
- **View única "Main"** — a navegação entre abas foi removida; o app abre direto na mesa de treino (rota `training` renomeada de papel para "Main")
- **Sidebar com 3 tabs internas**:
  - **Missões** — stepper, tour, cards de missão, briefing, objetivos ao vivo, feedback e resultado
  - **Mesa** — KPIs da sessão (preço, VWAP, delta, volume, execuções, P&L, win/loss), leitura de fluxo (pressão, absorções, walls) e correlação de corretoras — antes no Dashboard
  - **Estudo** — sessões históricas (WDO/PETR4 com range/volume/regime, formatado) + aulas das missões — antes no Academy
- **AppShell simplificado** — sem navegação; header cockpit (transporte + fonte + preço) e status bar permanecem
- CSS limpo (modal e dashboard antigos removidos)

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado em 1920×1080: sessão RUNNING pelo header, tab Mesa com dados ao vivo (delta +83, 24 absorções, ITAU/AGORA/BTG), tab Estudo com 251+75 sessões.

---

## 2026-10-02 — Cockpit: controles no header, desk fluido, abas unificadas

**Contexto:** Controles de replay escondidos em painel/modal; layout fixo não se adaptava à sidebar; abas Dashboard/Analysis redundantes; aparência ainda próxima do placeholder original.

**Ações:**
- **Controles de sessão no header** (`SessionControls`): play/pause/finalizar/reset, fast-forward (`⏩ +30s/+1min/+5min`), velocidade e **fonte com popover** (ativo, data da sessão, perfil de mercado, TRAINING FIFO e "Baixar dados"). O painel "Replay & Dados" e o modal de setup foram **removidos**
- **Preço em destaque no header**: último preço grande colorido por delta + Δ acumulado ao vivo
- **Desk fluido** (`DeskLayout`): workspaces agora usam **colunas flex proporcionais** que se adaptam automaticamente ao expandir/colapsar a sidebar; painéis empilhados por peso dentro de cada coluna; 4 workspaces redesenhados (Default, Tape Reading, Scalping, DOM Puro)
- **Abas unificadas**: Dashboard + Analysis fundidos numa única aba "Dashboard" — KPIs da sessão + leitura de fluxo (pressão/absorções/walls) + correlação de corretoras em cards com cores semânticas
- **Sidebar de Training**: cards e stepper em layout mais limpo (botão "Nova sessão" removido — controles vivem no header)
- Persist do workspace em v10

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado em 1920×1080 (iniciar/pausar pelo header, fast-forward +1min = 650 ticks, gráfico com candles, desk adaptando à sidebar).

---

## 2026-10-02 — Correções de replay: fast-forward seguro, gráfico 8P vivo, layout 1920×1080

**Contexto:** O `+5min` travava a UI (2000 ticks síncronos), o Gráfico 8P nunca fechava candles (mercado preso na âncora, sem deslocamento), o layout não aproveitava telas 1920×1080 e o modal destoava do restante do frontend.

**Ações:**
- **Fast-forward em chunks** (`sessionActions.advanceSimulation`): processa ~80 ticks por vez cedendo a thread — UI não trava e os botões mostram estado `⏩ …` durante o avanço
- **Sweeps no gerador** (`KernelMarketGenerator.maybeSweep`): agressões maiores (18–60 contratos) que varrem 1–3 níveis criam deslocamento de preço real — o que faz os candles 8P fecharem; probabilidade por perfil (slow 5% / normal 10% / aggressive 16%)
- **Replenish no gerador**: garante ≥3 níveis nos dois lados do book — corrige bug (encontrado por teste) de esvaziar um lado após sweeps
- **Gráfico 8P redesenhado**: candles ancorados à direita (mais recentes visíveis), corpo/pavio mais visíveis, header com "N candles fechados" e range em formação; validado: 12 candles fechados numa sessão de ~2min
- **Layout 1920×1080**: canvas dos workspaces ampliado para ~1586×970 (2 linhas + estação), sem scroll vertical na resolução alvo
- **Modal de replay consistente**: removido gradiente do header (superfície padrão do design system)

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado em 1920×1080 (fast-forward +5min ×2 sem travar; gráfico desenhando; velocidade 2x com feedback no modal e refletida no painel).

---

## 2026-10-02 — Sidebar de Training + Modal de sessão + Fast-forward + Header limpo

**Contexto:** Controles de replay/dados espalhados; pedido de sidebar colapsável para o Training, modal de replay com visual colorido, avanço para pontos específicos, seleção de datas/ativos para praticar, e remoção de elementos que poluíam o header (chips de source mode e botão de importar).

**Ações:**
- **Sidebar de Training** (`AppRouter`): missões, stepper, briefing, objetivos e feedback movidos para uma sidebar colapsável (botão ⟨/⟩) e redimensionável (drag na borda, 232–480px); largura e estado persistem em `localStorage`
- **Modal "Nova sessão de replay"** (`ReplaySetupModal`): aparece na primeira entrada do Training e reabrível pelo botão "▶ Nova sessão"; cards coloridos por fonte (sintético azul / WDO amarelo / PETR4 verde), seleção de data do material (até 60 sessões), meta da sessão (range/volume/regime), velocidades e ações "Explorar depois" / "▶ Começar prática"
- **Fast-forward na estação**: botões `⏩ +30s` / `+1min` / `+5min` que avançam a simulação instantaneamente (`kernel.advance()`); validado: +1min = ~400 ticks num clique
- **Ações de sessão compartilhadas** (`core/sessionActions.ts`): `startSimulation`/`pauseSimulation`/`resumeSimulation`/`finishSimulation`/`resetSimulation`/`advanceSimulation` — usadas pelo painel e pelo modal
- **Header limpo**: removidos os chips de source mode (DB/SC/HF), o badge duplicado, o item "Fonte" do statusbar e o botão de importar; instrumento agora mostra apenas o ativo

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validado no navegador (modal → Começar prática → RUNNING; sidebar colapsa/expande; fast-forward avança ticks e trades juntos).

**Nota operacional:** dev servers antigos podem ficar com módulo stale após HMR com erro — se a tela não atualizar, reinicie o `npm run dev`.

---

## 2026-10-02 — Estação Replay & Dados unificada + escopo 100% histórico

**Contexto:** Os painéis REPLAY, REPLAY PLAYER, DADOS & ATIVOS e RELÓGIO estavam espalhados e com posições ruins. O projeto consolida dados via pipeline API→DuckDB→JSON — CSV manual e modo ao vivo não fazem parte do escopo.

**Ações:**
- **Novo painel `DataReplayPanel`** funde os 4 antigos em uma estação com 3 linhas: Transporte (start/pause/finish/reset + velocidade + perfil + FIFO), Fonte (sintético/WDO/PETR4 + materiais + atualizar via brapi) e Sessão (tempo, ticks, último, progresso do candle 8P)
- **CSV removido**: input de importação, `csvName`/`setCsv`/`clearCsv` do store e referências de UI; ingestão é exclusivamente via pipeline API→DB (`npm run materials`)
- **LIVE_FUTURE removido**: source modes agora são `SYNTHETIC`, `SCENARIO`, `HISTORICAL_FILE`
- **Painéis antigos removidos**: `ReplayToolbar`, `ReplayPlayerPanel`, `DataPanel`, `CandleClockPanel` (fusão); registry e layouts atualizados
- **Layouts**: os 4 workspaces usam o painel unificado no rodapé (posição única e acessível); persist do workspace em v8

**Evidência:** `tsc` 0 erros · `vitest` 61/61 · `vite build` ok · validação no navegador (Iniciar/Pausar/Finalizar operando, sessão e candle 8P atualizando, Book por Corretora populado).

---

## 2026-10-02 — Redesign da interface (spec `2026-10-02-ui-redesign.md`)

**Contexto:** Interface percebida como anti-profissional, não fluida e sem elegância. Após primeiro passe conservador, redesign AGRESSIVO aprovado com pesquisa em Bloomberg Terminal, Linear, pixel-show, Sharpnel DOM, NinjaTrader e TradingView.

**Ações:**
- **Design tokens** (`theme.css`): sistema completo com 4-step elevation, bordas alpha, tipografia, espaçamento 4px, movimento (3 durações/2 easings), sombras e z-index; `prefers-reduced-motion` zera durações
- **Tipografia:** Inter (UI) + JetBrains Mono (números) com fallbacks offline; `tabular-nums` em todos os números
- **App Shell:** header 48→40px, brand sem gradiente, chips de source mode compactos, statusbar 26→22px, badges com alpha, **preço em destaque colorido por delta**
- **Training (topo redesenhado):** header com stepper visual (bolinhas numeradas: ativo/completo), **cards de missão com badges coloridas** (BEGINNER/INTERMEDIATE/ADVANCED), tour compacto
- **SuperDOM:** **heatmap de profundidade** — barras verdes (bid) / vermelhas (ask) proporcionais ao volume em cada célula; tags B/A/LAST no preço
- **Volume Profile:** **barras horizontais reais** com gradiente por dominância (compra/venda), POC destacado em amarelo, VAH/VAL com dots coloridos
- **Times & Trades:** linhas com tint verde/vermelho por lado agressor
- **Gráfico 8P:** **candles reais** (corpo + pavio + barra de agressão C/V) — antes era lista de texto
- **Dashboard:** **KPI cards** com números grandes e bordas semânticas (último preço, VWAP, delta, volume, execuções, P&L, win/loss)
- **Bug corrigido:** painel `ReplayToolbar` tinha tamanho 0×0 (inclicável) — agora é barra visível no rodapé; persist do workspace incrementado para v7
- **Docs:** `docs/design/FLOWTRAINER_DESIGN_SYSTEM.md` atualizado com o novo sistema

**Evidência:** `tsc` 0 erros · `vitest` 62/62 · `vite build` ok · console limpo (0 erros) com kernel rodando · screenshots das rotas Training/Dashboard/Analysis com dados ao vivo (heatmap SuperDOM, barras VP, candles, KPI cards).

---

## 2026-10-01 — Reconstrução completa

**Contexto:** Projeto recebido em estado crítico — repositório git corrompido, código-fonte ausente (módulos essenciais não existiam no disco), documentação divergente, zero testes automatizados.

**Ações:**
- Recuperado backup git corrompido e restaurado histórico
- Removido código morto e documentação vazia
- Reconstruídos módulos ausentes a partir dos contratos (imports + testes como spec)
- Criado sistema de design (tema escuro estilo Profit)
- Implementado motor de simulação completo (matching FIFO, book, cenários, clock 150ms)
- Implementados 24 tipos de painéis de visualização
- Implementado SuperDOM interativo, Times & Trades, gráfico 8P, workspace
- Implementado sistema de treinamento (10 cenários, missões, avaliação, feedback)
- Implementado pipeline de dados históricos (CSV, COTAHIST, brapi)
- Criados 43 testes automatizados
- Validado build (tsc 0 erros), testes (43/43), performance (50k execs ~18ms)
- QA visual via Chrome DevTools (acessibilidade 100%)

**Resultado:** Plataforma funcional, testada e documentada. Backlog alta/média prioridade 100% concluído.

---

## 2026-07 — Visão original e sprints de migração

**Contexto:** Projeto iniciado com visão de criar plataforma de treinamento de Order Flow.

**Sprints de migração (tree anterior, histórico):**
- Sprint 1: Kernel bootstrap — engines instanciados
- Sprint 2: SimulationClock assume o controle do tempo
- Sprint 3: MarketStateEngine alimentado por tick (fonte autoritativa)
- Sprint 4: FlowEngine removido do pipeline (EventBus é a espinha)
- Sprint 5: SyntheticMarketProvider eliminado — KernelMarketGenerator assume
- Sprint 6: Players com perfis reais geram atividade (8-12 bots)
- Sprint 7: MatchingEngine implementado FIFO — preço nasce do casamento
- Sprint 8: Limpeza final — comentários, docs, validação
- Sprint 10: FlowAnalysisEngine (Hawkes, CUSUM, BOCPD)

**Sprints de produto (tree anterior, histórico):**
- Sprint 9: Scenario Library Integration (87/87 testes)
- Sprint 11: Scenario Inspector
- Sprint 13: Training Mission Engine (57/57 testes)
- Sprint 14: Mission Evaluation Engine (21/21 testes)
- Sprint 15: Mission Rules Engine (16/16 testes)
- Sprint 16: Feedback Engine (21/21 testes)
- Sprint 17: Replay Recorder (20/20 testes) + Replay Player (16/16 testes)

**Homologações (tree anterior, histórico):**
- Trader Layer Homologation (39/39 testes)
- Queue + Aggressive Orders (27/27 testes)
- Passive Fill Diagnostic (17/17 testes)
- Performance (Clock 150ms)

---

## Documentação de domínio (julho/2026)

Documentos conceituais criados para definir o domínio de mercado:
- `FLOWTRAINER_VISION.md` — constituição, missão, princípios
- `FLOW_MARKET_MICROSTRUCTURE.md` — especificação de microestrutura
- `FLOW_MARKET_PHENOMENA.md` — biblioteca de 24 fenômenos de mercado
- `FLOW_MARKET_SCENARIOS.md` — biblioteca de cenários de ensino
- `FLOW_PLAYER_LIBRARY.md` — perfis comportamentais dos participantes
- `FLOW_BROKER_COLORS.md` — especificação de cores das corretoras

**Status:** Estes documentos foram absorvidos pela implementação atual. Os princípios e visão estão incorporados no código e nas fontes únicas atuais.

---

## Decisões arquiteturais históricas

| Decisão | Descrição |
|---------|-----------|
| Preço nasce do matching | Preço é consequência do casamento de ordens, não gerado arbitrariamente |
| Dois universos isolados | Mercado (simulação) e Trader (operação) são separados |
| EventBus como espinha | Comunicação via eventos, não chamadas diretas |
| UI não implementa regra | Engines concentram lógica; React apenas representa estado |
| Replay isolado | Evento `historical:trade:executed`, nunca `matching:execution:created` |
| Fila read-only | Só via `getOrderQueueState(orderId)`; preço tocar nível ≠ execução |
