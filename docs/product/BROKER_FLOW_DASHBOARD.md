# Broker Flow Dashboard

## Fluxo oficial

```txt
market:trade:observed
  -> BrokerFlowAnalyzer
  -> broker:flow:snapshot:updated
  -> brokerFlowStore
  -> useBrokerFlow + seletores
  -> BrokerHistoryPanel
```

O painel nao consome `matching:execution:created`, nao calcula metricas de dominio e nao infere intencao, posicao real ou recomendacao operacional.

## Store oficial

`src/store/brokerFlowStore.ts` armazena o ultimo `BrokerFlowMarketSnapshot`, filtros visuais, ordenacao, corretora selecionada, janela selecionada, modo de tabela, fonte, sessao, timestamp e status.

O store nao acumula trades, nao recalcula VWAP, market share, persistencia, saldo agressor ou rankings de dominio. Ele apenas recebe snapshots prontos e aplica seletores de apresentacao.

## Hook oficial

`src/shared/hooks/useBrokerFlow.ts` assina `broker:flow:snapshot:updated` de forma idempotente, sincroniza o store e remove listeners no cleanup. Ele nao assina `matching:execution:created`.

## Filtros e modos

Filtros disponiveis:

- busca por nome, codigo ou broker key;
- janela: `1s`, `5s`, `15s`, `30s`, `60s`, `5min`, `session`;
- todos, saldo comprador, saldo vendedor, somente com agressao e RLP;
- somente ativos;
- volume minimo;
- market share minimo.

Modos:

- `ESSENTIAL`: corretora, agressao compradora/vendedora, saldo agressor, market share, velocidade, persistencia e ultimo lado.
- `ADVANCED`: adiciona compra/venda total, VWAPs, maior lote, streak, mudancas de lado e ultima atuacao.
- `COMPLETE`: adiciona RLP, DIRECT, AUCTION, UNKNOWN e aggressive market share.

## Rankings

Cards compactos exibem:

- mais ativa;
- maior agressora compradora;
- maior agressora vendedora;
- maior saldo positivo;
- maior saldo negativo;
- maior persistencia;
- maior lote.

Os rankings usam snapshots e seletores; nao ha recalculo de acumulados na UI.

## Detalhe da corretora

O detalhe exibe totais, agressao, passividade, saldo agressor, market share, aggressive market share, directional aggression, VWAPs, maior lote, persistencia, streak, mudancas de lado, categorias especiais, concentracao por preco e resposta observada apos a atuacao.

Linguagem aprovada:

```txt
resposta observada apos a atuacao
```

Linguagem proibida:

```txt
a corretora moveu o mercado
```

## Tooltips

- Saldo agressor: "Diferença entre agressões compradoras e vendedoras observadas. Não representa necessariamente a posição líquida da corretora."
- Persistencia: "Mede continuidade e regularidade da atuação agressora observada. Não prevê necessariamente o próximo movimento."
- Resposta do preco: "Movimento observado após as atuações da corretora. Correlação temporal não prova causalidade."
- Market share: "Participação observada no volume negociado da janela selecionada."

## Legado

`brokerHistoryStore` esta marcado como `@deprecated` para UI. Ele permanece temporariamente para consumidores externos comprovados. O painel migrado usa exclusivamente `brokerFlowStore`.

O adapter `BrokerFlowToLegacyBrokerHistoryAdapter` permanece como compatibilidade temporaria e apenas transforma contratos; nao recalcula metricas.

## QA e performance

A UI acompanha snapshots consolidados, nao trades individuais. A tabela e limitada pelo painel visivel e o detalhe limita concentracao por preco aos primeiros 5 niveis.

Validacoes atuais:

- build TypeScript/Vite;
- testes de store, hook e UI;
- CSV real ja coberto pelo `BrokerFlowAnalyzer`;
- validacao visual no workspace local.

## Remocao futura

Backlog:

- localizar consumidores externos restantes de `brokerHistoryStore`;
- migrar consumidores para `brokerFlowStore` ou adapter explicito;
- remover assinatura legado quando nao houver consumidor;
- excluir adapter apos janela de compatibilidade.
