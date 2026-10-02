# Broker Flow Analysis

## Fonte oficial

`BrokerFlowAnalyzer` → `broker:flow:snapshot:updated` → `brokerFlowStore` → `BrokerHistoryPanel`

## Métricas

- Volumes buy/sell/agressivos
- Net, RLP, market share, activity rate
- Persência, maiores lotes

## Regras

- Não inferir intenção, posição real ou causalidade de corretora
- Não alimentar UI via `matching:execution:created`
- Não recalcular métricas de domínio dentro de componentes React
- Não misturar RLP/DIRECT/AUCTION/UNKNOWN com agressão direcional
- Não afirmar posição real, estoque, manipulação
- Não tratar corretora como pessoa
- Não gerar sinal operacional
- Não alterar ordens, posição, stops, P&L, FIFO ou matching

## Hook oficial

`src/store/useBrokerFlow.ts`
