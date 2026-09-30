# Modules

Este documento lista os módulos principais da aplicação e seu estado atual.

- `dashboard`: interface inicial e visão geral da aplicação.
- `academy`: conteúdo de aprendizado e módulos de ensino.
- `training`: workspace de treinamento ativo com painel de trading, status de mercado, controles de engine e janelas flutuantes de painel.
- `analysis`: relatórios e análises de performance.

No momento, o módulo `training` está integrado à aplicação e contém o workspace com todos os painéis principais.

### Training module
- Implementado em `src/modules/training/TrainingModule.tsx`.
- Usa `useFlowEngine` e `useMarketStore` para exibir mercado ao vivo e controle de execução.
- O workspace usa `src/workspace/WorkspaceManager/WorkspaceManager.tsx` para renderizar janelas arrastáveis e redimensionáveis.
- Layout inicial dos painéis configurado em `src/workspace/defaultWorkspaces.ts`.
