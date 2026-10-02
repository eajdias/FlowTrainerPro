# Engineering Handbook

## Arquitetura

- **Engines concentram lógica.** React apenas representa estado.
- **UI nunca implementa regra de negócio.**
- **Dois universos isolados:** Mercado (simulação) × Trader (operação).
- **EventBus** é a espinha dorsal da comunicação.

## Padrões de código

- TypeScript fortemente tipado, evitar `any`
- Responsabilidade única, baixo acoplamento, alta cohesão
- Componentes pequenos, interfaces antes de implementações
- Sem duplicação, preferir composição

## Replay histórico

- Evento oficial: `historical:trade:executed` (nunca `matching:execution:created`)
- Projeção de leitura: `market:trade:observed`
- `MarketTrade` é imutável; timestamps históricos são preservados
- Não afeta MatchingEngine, FIFO, posição, stops ou P&L
- `MarketDataSourceGuard` impede fontes simultâneas

## Análise de corretoras

- Produz evidências quantitativas, não conclusões sobre intenção
- Não alimenta UI via `matching:execution:created`
- Não mistura RLP/DIRECT/AUCTION/UNKNOWN com agressão direcional
- Broker Flow visual: `brokerFlowStore` + `useBrokerFlow`

## Interface

- Usar Design System oficial (`src/ui/designSystem`)
- Sem valores hardcoded de cor, tipografia, espaçamento
- Controles globais: Header (cockpit com `SessionControls`), StatusBar (camada de apresentação)
- Botões sem handler real não são permitidos
- Filas exibidas na UI vêm de API read-only autoritativa

## Qualidade

- Toda entrega deve compilar e não quebrar funcionalidades existentes
- Toda nova arquitetura deve possuir documentação
- Toda decisão importante deve ser documentada
