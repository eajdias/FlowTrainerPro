# UX/UI Migration Plan (estado real)

## Fase UX 1 — concluída e vigente

Tokens em `src/assets/theme.css`, componentes em `src/ui/designSystem.tsx`
(`ThemeProvider`, `Button`, `Badge`, `Icon`), App Shell com TopBar e StatusBar.

## Fase UX 2 — concluída

Header (marca, ativo em estudo, source modes como indicadores, sessão, último preço,
hora, estado, Importar), ReplayToolbar (transporte + velocidade + perfis + TRAINING FIFO),
StatusBar diagnóstica. Sem atalhos globais de teclado, sem barra de progresso.

## Fase UX 3 — concluída

24 painéis implementados: SuperDOM (click/Shift+click, fila expandida), Times & Trades
(filtros + Slip), Book, Volume Profile (POC/VAH/VAL/ZIM), Chart8P (candles range-8 reais),
PriceLadder, OrderBookByBroker, BrokerHistory, CandleClock (progresso 8P), Large/Medium,
TradeHistory, Training/HUD, ScenarioEditor, 5 inspectors, ReplayInspector/Player, Debug,
DataPanel. Treino guiado em 4 passos + tour de primeiros passos na rota training.

## Fase UX 4 — concluída

Broker Flow (analyzer + rankings + feed ao vivo + rota Analysis), Broker History
(vivo e histórico), Flow Analysis (pressão/resposta/liquidez no Debug/Analysis),
Training HUD.

## Fase UX 5 — concluída (escopo ajustado)

Layout em grade com scroll, tipografia Tahoma tabular, QA via chrome-devtools
(Lighthouse a11y 100) + playwright-cli, sem overflow. Canvas do 8P com viewport/drag/zoom:
fase futura (lista honesta no lugar).

## Riscos (vigentes)

- SuperDOM com muitas linhas sem virtualização (limite atual: 30 níveis);
- seletores derivados em stores precisam de `useMemo` (loop infinito de render);
- watcher do Vite pode perder edições (conferir servido ou reiniciar).
