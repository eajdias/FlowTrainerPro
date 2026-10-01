# Modules

Fonte única do status dos módulos e painéis. Não repetir esta tabela em `PROJECT_STATUS.md` ou `README.md`.

## Módulos

| Módulo | Status | Onde |
|--------|--------|------|
| `training` | ✅ Ativo | `src/training/` + `src/store/training*.ts` |
| `dashboard` | ❌ Não implementado | — |
| `academy` | ❌ Não implementado | — |
| `analysis` | ❌ Não implementado | — |

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

`src/workspace/PanelRegistry.ts` registra 24 tipos (`SuperDOMPanel`, `TimesTradesPanel`, `VolumeProfilePanel`, `Chart8PPanel`, `Large/MediumTradesPanel`, inspectors, `ReplayPlayerPanel`, etc.).

⚠️ **Implementações ausentes:** só `src/panels/index.ts` (barrel) existe — nenhum subdir `src/panels/*/` está commitado. Ou seja: a tabela abaixo é o **contrato do registry**, não painéis funcionais. Ver `docs/Architecture.md` § Ausências.

| Painel (tipo registrado) | Uso |
|--------|------|
| SuperDOMPanel | Ordens + Shift agressora (interações: `product/SUPERDOM_TRADING_INTERACTIONS.md`) |
| TimesTradesPanel | HORA/QTD/PREÇO/COMPRADOR/VENDEDORA |
| BrokerHistoryPanel / OrderBookByBrokerPanel | Corretoras e book por corretora |
| VolumeProfilePanel | POC/VAH/VAL |
| Chart8PPanel | Candles atemporais |
| Large/MediumTradesPanel | Agressões ≥250 / ≥25 |
| BookPanel / PriceLadderPanel / CandleClockPanel | Livro e relógio |
| TradeHistoryPanel | P&L e trades do trader |
| ScenarioEditorPanel | Cenários sintéticos |
| Scenario/Mission/Evaluation/Feedback/Replay Inspector | Painéis técnicos |
| ReplayPlayerPanel / ReplayToolbar | Reprodução |
| TrainingHUD / TrainingPanel / DebugPanel | Sessão e debug |
