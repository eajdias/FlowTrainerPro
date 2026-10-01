# Global Trading Controls

## Objetivo

Os controles globais organizam o contexto operacional sem alterar engines ou regras de mercado.

> Controles globais utilizam vocabulário, ícones, estados e semântica consistentes.

## Header

- Marca, ativo em estudo (seletor em Dados & Ativos; motor ao vivo é sintético WDO),
  source mode (indicadores, sem troca por clique), sessão, último preço, hora, estado global.
- Botão Importar (ícone SVG) navega para a estação de training (painel Replay Player).

## Source Mode

| Modo | Rótulo | Descrição |
|---|---|---|
| `SYNTHETIC` | `SYNTHETIC` | Mercado gerado pelo simulador. |
| `SCENARIO` | `SCENARIO` | Cenário didático controlado. |
| `HISTORICAL_FILE` | `HISTORICAL` | Replay de negócios históricos importados. |
| `LIVE_FUTURE` | `LIVE FUTURE` | Reservado para mercado ao vivo futuro. |

Troca destrutiva bloqueada com sessão rodando (`MarketDataSourceGuard` em `marketDataSourceStore`).

## Sessão

Vocabulário: `IDLE`, `READY`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`, `ERROR`.

## ReplayToolbar

Transporte real: iniciar/pausar/retomar/finalizar/reset + velocidades `0.5x–16x` +
perfis de mercado (`slow`/`normal`/`aggressive`) + `TRAINING FIFO`. Dirige sessão, kernel
e bridge. Sem compra/venda/flatten (vivem no SuperDOM).

Sem atalhos de teclado globais, sem barra de progresso e sem seek na toolbar
(o Replay Player tem step; seek do replay histórico via `engine.seek()`).

## StatusBar

Kernel, Fonte, Replay, Sessão, Trades, Flow, Broker Flow, warnings e versão. Discreta.

## Erros e Warnings

Warnings como texto curto com tooltip. Sem `alert()`; erros aparecem na UI, não só no console.

## Responsividade

Header em uma linha com ocultação progressiva (`AppShell.css`); workspace com scroll;
tabelas com layout fixo e ellipsis (SuperDOM robusto a zoom de fonte).
