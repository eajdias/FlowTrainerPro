# Modules

Fonte única do status dos módulos e painéis. Não repetir esta tabela em `PROJECT_STATUS.md` ou `README.md`.

## Módulos

| Módulo | Status | Onde |
|--------|--------|------|
| `training` | ✅ Ativo | `src/training/` + `src/store/training*.ts` + rotas training/academy |
| `dashboard` | ✅ Ativo (rota com dados reais) | `AppRouter` + stores de sessão/posição |
| `academy` | ✅ Ativo (rota com dados reais) | `AppRouter` + `MissionLibrary` (regras, dicas) |
| `analysis` | ✅ Ativo (rota com dados reais) | `AppRouter` + FlowAnalysis + rankings brokerFlow |

Navegação entre eles: estado local em `src/core/AppRouter.tsx` (`src/router/` é stub não usado).

## Training (arquivos existentes)

| Arquivo | Papel |
|---------|-------|
| `src/training/TrainingMissionEngine.ts` | Motor de missões |
| `src/training/MissionLibrary.ts` | Biblioteca de missões |
| `src/training/MissionStore.ts` | Estado das missões |
| `src/training/types.ts` | Tipos |
| `src/store/trainingStore.ts` / `trainingSessionStore.ts` / `scenarios.ts` | Estado Zustand |

## Painéis

`src/workspace/PanelRegistry.ts` registra 24 tipos — todos implementados em `src/panels/*/` (2026-10-01). Núcleo UX 3 funcional: SuperDOM (click/Shift+click homologados), Times & Trades, Book, Volume Profile, Chart8P (candles range-8 + agressão), ReplayToolbar (sessão+kernel+bridge).

| Painel (tipo registrado) | Uso |
|--------|------|
| SuperDOMPanel | Ordens + Shift agressora (interações: `product/SUPERDOM_TRADING_INTERACTIONS.md`) |
| TimesTradesPanel | HORA/QTD/PREÇO/COMPRADOR/VENDEDORA |
| BrokerHistoryPanel / OrderBookByBrokerPanel | Corretoras e book por corretora |
| VolumeProfilePanel | POC/VAH/VAL |
| Chart8PPanel | Candles range-8 reais (fecha com high-low ≥ 4.00) + saldo de agressão |
| Large/MediumTradesPanel | Agressões ≥250 / ≥25 |
| BookPanel / PriceLadderPanel / CandleClockPanel | Livro e relógio |
| TradeHistoryPanel | P&L e trades do trader |
| ScenarioEditorPanel | Cenários sintéticos |
| Scenario/Mission/Evaluation/Feedback/Replay Inspector | Painéis técnicos |
| ReplayPlayerPanel / ReplayToolbar | Reprodução |
| TrainingHUD / TrainingPanel / DebugPanel | Sessão e debug |
