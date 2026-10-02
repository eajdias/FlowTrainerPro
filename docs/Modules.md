# Modules

## View única — Main

O app tem **uma única view**: `Main` (mesa de treino de Order Flow). Não há navegação entre abas — tudo acontece com o desk de painéis sempre visível.

## Sidebar (colapsável e ajustável)

| Tab | Conteúdo |
|-----|----------|
| **Missões** | Stepper (Missão → Briefing → Operar → Resultado), tour, cards de missão, briefing, objetivos ao vivo, feedback do coach e resultado |
| **Mesa** | KPIs da sessão (preço, VWAP, delta, volume, execuções, P&L, win/loss), leitura de fluxo (pressão, absorções, walls) e correlação de corretoras |
| **Estudo** | Sessões históricas (WDO/PETR4) + aulas das missões |

## Header (cockpit)

- Transporte: play/pause, finalizar, reset, fast-forward (+30s/+1min/+5min) e velocidade
- Fonte (popover): ativo de estudo, data da sessão, perfil de mercado, TRAINING FIFO e download de dados
- Preço em destaque com delta acumulado
- Sessão, hora e status

## Painéis do desk (registrados)

SuperDOM, Times & Trades, Gráfico 8P, Volume Profile, Book por Corretora, Histórico de Corretoras, Large Trades (≥250), Medium Trades, Training HUD, Histórico de Operações, PriceLadder, Book, Trade History, ScenarioEditor, 5 inspectors, ReplayInspector, Debug.

## Workspaces (desk fluido)

Layout em **colunas proporcionais (flex)** que se adaptam ao espaço (sidebar expandida/colapsada):

| Workspace | Organização |
|-----------|-------------|
| **Default** | SuperDOM · Tape (T&T + ≥250) · Gráfico 8P + Book Corretora · Volume Profile + Corretoras · HUD + Operações |
| **Tape Reading** | Tape dominante (Medium + Large + T&T) · Gráfico + VP · SuperDOM |
| **Scalping** | SuperDOM + PriceLadder · Gráfico · VP + T&T |
| **DOM Puro** | SuperDOM + PriceLadder + T&T |
