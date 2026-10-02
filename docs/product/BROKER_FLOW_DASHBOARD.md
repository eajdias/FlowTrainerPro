# Broker Flow Dashboard

## Fluxo oficial

```txt
execução (live) ou MarketTrade (histórico)
  -> BrokerFlowAnalyzer (processTrade)
  -> flushSnapshot()
  -> brokerFlowStore.receiveSnapshot
  -> useBrokerFlow + seletores
  -> Analysis (rankings) / painéis
```

Sem evento intermediário de snapshot; sem consumo de `matching:execution:created` pelo
visual (o feed assina e projeta). Sem inferir intenção, posição real ou recomendação.

## Store oficial

`src/store/brokerFlowStore.ts`: último snapshot, filtros (busca, ativos, direcional,
volume/share mínimos), ordenação, corretora selecionada, janela, modo de tabela, fonte,
sessão e status. Só recebe snapshots prontos + seletores de apresentação.

## Hook oficial

`src/store/useBrokerFlow.ts`: brokers visíveis + rankings + seleção. Sem regra de domínio.

## Filtros e modos

Busca, ativas, direcional (buyer/seller/aggressive/rlp), volume e share mínimos;
janelas `1s–session`; modos `ESSENTIAL`/`ADVANCED`/`COMPLETE`.

## Rankings

Mais ativa, maior compradora/vendedora agressiva, maiores nets — via
`selectBrokerFlowRankings` (também na tab **Mesa** da sidebar).

## Feed ao vivo

`initLiveBrokerFlow()` (boot): cada 10 execuções publica snapshot (`SYNTHETIC`/`live`).
