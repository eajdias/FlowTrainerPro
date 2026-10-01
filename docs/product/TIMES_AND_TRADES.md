# Times & Trades

## Objetivo

O Times & Trades apresenta execuções ao vivo com leitura rápida e baixa confusão visual.

## Colunas

- Hora, Qtd, Preço, Comprador, Vendedora, Slip (ticks de deslizamento da agressora).

## Filtros locais

Lado (todos/compra/venda) e lote mínimo, com botão "Limpar filtros" quando o filtro esvazia a lista.

## Tipos de Negócio

Execuções do simulador são sempre direcionais (`BUY`/`SELL`). Categorias históricas
(`RLP`, `DIRECT`, `AUCTION`, `UNKNOWN`) aparecem apenas nos painéis de replay histórico,
nunca forçadas para lado.

## Estados

- Vazio: "Sem execuções na sessão." (ou "no filtro atual" com ação de limpar).
- Fonte: exclusivamente `tradeStore` (máx. 100 execuções recentes).
