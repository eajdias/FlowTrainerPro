# Roadmap

## Sprints

### Sprint 1 - Foundation
- Concluído: criação da base do aplicativo em React + TypeScript + Vite.
- Concluído: desenvolvimento do workspace de treinamento com painel modular e vários painéis de trading.
- Concluído: ajustes de estilo, layout e semântica de candles (compra verde, venda vermelha).
- Concluído: verificação de compilação TypeScript sem erros.

### Sprint 2 - Integração e dados reais
- Implementar roteamento baseado em URL.
- Conectar módulos `dashboard`, `academy` e `analysis` a dados e APIs.
- Integrar SuperDOM e painel de Trading com uma engine de ordens e execução.
- Adicionar persistência de configurações e workspace.
- Desenvolver testes de unidade, integração e regressão.

### Backlog
- Replay com dados históricos. Parcial concluído: Fase 3 integrou projections aos painéis de leitura e FlowAnalysis.
- Broker Flow Analyzer. Parcial concluído: Fase 5 migrou Broker History para `brokerFlowStore`, rankings, filtros, modos de tabela e detalhe de corretora.
- UX/UI Premium. Parcial concluído: Fase UX 1 criou Design System, App Shell, TopBar e StatusBar.
- Estabilizacao UX 1 concluida: suite completa, CSV real e carga classificados; baseline registrado em `docs/standards/TESTING_BASELINE.md`.
- UX 2 Estrutural concluida: Header global, StatusBar diagnostica e ReplayToolbar compacta com vocabulario oficial de estados.
- UX 3 Parcial concluida: SuperDOM e Times & Trades modernizados sem alterar core, FIFO ou MatchingEngine.
- Grafico 8P Atemporal corrigido: historico visivel em janela deslizante, auto-follow horizontal, drag historico e zoom preservando viewport.
- Importação de arquivos de mercado. Parcial concluído: parser CSV, validação e `MarketTrade[]`.
- Heatmap e visualizações avançadas.
- Missões e treinamento guiado.
- IA assistente de trading e avaliação comportamental.
