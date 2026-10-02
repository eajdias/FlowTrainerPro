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

SuperDOM/Ladder (fundido: `[Δ exec] [Ord.C] [Qtd.C] [PREÇO] [Qtd.V] [Ord.V] [Exec.C] [Exec.V] [R$]` com heat, refs do dia, auto-follow e linha atual sublinhada), Times & Trades, Gráfico 8P, Volume Profile, Book por Corretora, Histórico de Corretoras, Large Trades (≥250), Medium Trades, Training HUD, Histórico de Operações, Book, Trade History, ScenarioEditor, 5 inspectors, ReplayInspector, Debug.

## Workspaces (desk fluido)

Layout em **linhas × colunas proporcionais (flex)** que se adaptam ao espaço (sidebar expandida/colapsada):

| Workspace | Organização |
|-----------|-------------|
| **Tape Reading** (base) | Coluna 1: `Corretoras · Volume Profile · ≥25 · ≥250` (estreita) · Coluna 2: `SUPERDOM fundido` (sozinho) · Coluna 3: `T&T (alto) · Gráfico 8P` |
| **Scalping** | `DOM fundido` · `Gráfico + VP` · `Tape` |
| **DOM Puro** | `DOM fundido` + `Tape` em 2 colunas |
