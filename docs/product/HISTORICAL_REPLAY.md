# Historical Replay

O replay historico permite reproduzir negocios reais importados de CSV como mercado observado.

Nesta fase, o replay alimenta:

- Times & Trades;
- Volume Profile;
- Broker History;
- ultimo preco observado;
- grafico atemporal;
- FlowAnalysis.

O replay historico nao executa ordens do aluno e nao altera posicao, stops, P&L ou FIFO.

Categorias preservadas:

- BUY;
- SELL;
- RLP;
- DIRECT;
- AUCTION;
- UNKNOWN.

RLP, DIRECT, AUCTION e UNKNOWN permanecem auditaveis e nao sao tratados como agressao direcional.
