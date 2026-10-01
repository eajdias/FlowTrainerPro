# Market Data Provider

> ⚠️ DOCUMENTO HISTÓRICO — descreve `src/market/providers/` (MarketDataProvider, SyntheticMarketProvider), **removidos do tree atual**. A camada foi substituída por KernelMarketGenerator + MarketScenarioEngine (ver `docs/Architecture.md` § Ausências e `SPRINT8_MIGRATION_COMPLETE.md`). Mantido como contexto; não implementar contra ele sem revisar a arquitetura atual.

## Objetivo da camada
A camada `MarketDataProvider` introduz uma separação clara entre a origem dos dados de mercado e o consumidor desses dados.
Ela permite que o sistema consuma ticks de mercado sem que o `FlowEngine` precise gerar preços internamente.

## Responsabilidades
- definir uma interface única para entregas de ticks de mercado;
- permitir múltiplas implementações de origem de dados;
- gerenciar o ciclo de vida de produção de ticks (`start` / `stop`);
- expor eventos de tick por meio de callback (`onTick`);
- não conhecer nenhuma interface gráfica;
- não depender do React.

## Interfaces existentes
### `src/market/providers/MarketDataProvider.ts`
- `MarketTick`
  - `price: number`
  - `volume: number`
  - `delta: number`
  - `timestamp: number`
- `MarketDataProvider`
  - `start(): void`
  - `stop(): void`
  - `onTick(listener: (tick: MarketTick) => void): void`
  - `offTick?(listener: (tick: MarketTick) => void): void`

### `src/market/providers/SyntheticMarketProvider.ts`
- implementação concreta de `MarketDataProvider`
- gera ticks aleatórios usando `setInterval`
- emite ticks para listeners registrados
- mantém o histórico de preço local e incrementa com `delta`

## Fluxo de dados
1. O `SyntheticMarketProvider` inicia a geração de ticks com `start()`.
2. A cada intervalo, ele cria um `MarketTick` com `price`, `volume`, `delta` e `timestamp`.
3. O provider chama os listeners registrados via `onTick`.
4. O `FlowEngine` registra seu listener no provider e recebe os ticks.
5. O `FlowEngine` redistribui os ticks para seus próprios listeners.
6. Componentes consumidores, como o `SuperDOM`, recebem ticks do `FlowEngine` sem conhecer a origem dos dados.

## Relação com o FlowEngine
- `FlowEngine` deixa de ser responsável pela geração de preços.
- `FlowEngine` passa a consumir ticks de um `MarketDataProvider`.
- Ele atua como um redistribuidor de eventos de tick.
- Arquivo de implementação atual: `src/modules/scenarios/FlowEngine.ts`.
- `FlowEngine` pode iniciar e parar o provider sem manipular lógica de geração de mercado.

## Relação com o SuperDOM
- `SuperDOM` continua consumindo `FlowEngine` da mesma forma que antes.
- A camada de apresentação não foi alterada na tarefa.
- `SuperDOM` se beneficia do fato de o `FlowEngine` ser agora um consumidor desacoplado.
- Arquivo de implementação atual: `src/modules/dom/SuperDOM.tsx`.

## Como futuras implementações deverão funcionar
- novas implementações devem cumprir `MarketDataProvider`.
- cada provider deve expor `start`, `stop`, `onTick` e opcionalmente `offTick`.
- o `FlowEngine` não precisa ser modificado para aceitar novos providers, desde que recebam a interface correta.
- não é necessário adicionar lógica de UI a essa camada.

## Como ReplayProvider e LiveProvider poderão utilizar essa arquitetura
- um `ReplayProvider` poderá implementar `MarketDataProvider` e emitir ticks a partir de um histórico gravado.
- um `LiveProvider` poderá implementar `MarketDataProvider` e emitir ticks recebidos de uma fonte ao vivo.
- ambos manteriam o mesmo contrato `MarketTick` e seriam intercambiáveis no `FlowEngine`.
- o `FlowEngine` continuaria a consumir `onTick`, independente da origem dos dados.

## Princípios de desacoplamento adotados
- separação de responsabilidades: geração de dados fica em `MarketDataProvider`, consumo em `FlowEngine`.
- fronteira clara entre domínio de mercado e interface de apresentação.
- `SuperDOM` não conhece a fonte dos dados; ele apenas consome ticks via `FlowEngine`.
- a camada de dados não depende de React ou de qualquer UI.
- arquitetura preparada para múltiplas fontes de dados futuras sem alterar o consumidor.
