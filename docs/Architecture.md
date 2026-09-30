# Architecture

Este documento apresenta a arquitetura atual do FlowTrainerPro e serve como ponto de entrada para os detalhes técnicos da plataforma.

## Estado Atual
- Front-end React + TypeScript com Vite.
- Navegação interna gerenciada por `src/core/AppRouter.tsx` com estado local.
- Workspace de treinamento integrado ao módulo `training` e renderizado por `src/modules/training/TrainingModule.tsx`.
- TrainingModule exibe status de mercado ao vivo e controles de engine via `useFlowEngine` e `useMarketStore`.
- WorkspaceManager agora monta painéis como janelas flutuantes arrastáveis e redimensionáveis em `src/workspace/WorkspaceManager/WorkspaceManager.tsx`.
- Painéis registrados via `src/workspace/PanelRegistry.ts`.
- Layout inicial do workspace definido em `src/workspace/defaultWorkspaces.ts` com posições de painel no canvas.
- Build validada com `npm run build`.

## Principais Componentes
- `src/core/AppRouter.tsx`: roteamento por estado entre módulos.
- `src/core/AppShell.tsx`: layout da aplicação com sidebar e área de conteúdo.
- `src/modules/training/TrainingModule.tsx`: canvas principal do workspace de treinamento.
- `src/modules/training/WorkspaceLayout/WorkspaceLayout.tsx`: grid aplicada ao workspace de painéis.
- `src/workspace/WorkspaceManager/WorkspaceManager.tsx`: monta painéis ativos e gerencia modo docked/floating.
- `src/workspace/PanelRegistry.ts`: registro centralizado dos painéis disponíveis.
- `src/workspace/defaultWorkspaces.ts`: configurações padrão de workspaces e distribuição de painéis.
- `src/panels/SuperDOMPanel/SuperDOM.tsx`: SuperDOM interativo de entrada de ordens.
- `src/panels/PriceLadderPanel/PriceLadder.tsx`: novo painel de livro de ofertas por nível de preço.
- `src/panels/ReplayToolbar/ReplayToolbar.tsx`: toolbar inferior de controle de replay e ações de trade.

## Observações
- A pasta `src/router/` está presente, mas não é utilizada pela aplicação atual.
- A aplicação usa navegação por estado local em vez de roteamento via URL/React Router.
- Documentação detalhada de arquitetura fica em `docs/architecture/FOUNDATION.md`.
