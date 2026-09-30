# FlowTrainerPro Engineering Handbook

## 1. Objetivo
Este documento define o padrão técnico e o processo de evolução do FlowTrainerPro. Todas as implementações devem respeitar a visão do produto, os princípios do projeto, a arquitetura e o roadmap definidos pelo time.

Toda nova funcionalidade deve seguir:
- Product Vision
- Project Principles
- Architecture
- Roadmap

## 2. Estrutura da Documentação
A documentação está organizada em pastas que refletem seu propósito.

- `docs/product/`
  - contém a visão do produto e os princípios do projeto.
- `docs/architecture/`
  - contém a documentação da arquitetura, engines, módulos e infraestrutura.
- `docs/roadmap/`
  - contém a evolução planejada do projeto, Sprints e backlog.
- `docs/standards/`
  - contém manuais, padrões e guias de engenharia.

## 3. Organização das Sprints
Uma Sprint deve ser organizada em etapas claras:
- Objetivo
- Tasks
- Implementação
- Documentação
- Validação
- Conclusão

Cada Sprint deve entregar valor alinhado ao roadmap e deve ser documentada de forma que qualquer membro da equipe possa entender o escopo e o resultado.

## 4. Organização das Tasks
Cada task deve seguir o padrão:
- TASK ID (ex: TASK S2-001)
- Objetivo
- Contexto
- Requisitos
- Restrições
- Critérios de aceite
- Relatório final

Esse padrão garante clareza na execução e na avaliação do trabalho.

## 5. Padrões de Código
O código do FlowTrainerPro deve obedecer aos seguintes princípios:
- Código limpo
- Responsabilidade única
- Baixo acoplamento
- Alta coesão
- Sem duplicação
- Preferir composição
- Interfaces antes de implementações
- TypeScript fortemente tipado
- Evitar `any`
- Componentes pequenos

## 6. Arquitetura
Princípios obrigatórios de arquitetura:
- Engines concentram lógica.
- React apenas representa estado.
- Providers fornecem dados.
- UI nunca implementa regra de negócio.
- Todo módulo deve possuir responsabilidade clara.

## 7. Documentação
Regras de documentação:
- Toda nova arquitetura deve possuir documentação.
- Toda Sprint deve ser registrada.
- Toda decisão importante deve ser documentada.
- Nenhuma funcionalidade importante deve existir sem documentação.

## 8. Fluxo de Desenvolvimento
O fluxo oficial de desenvolvimento é:
- Ideia
↓
- Task
↓
- Arquitetura
↓
- Implementação
↓
- Validação
↓
- Documentação
↓
- Sprint
↓
- Roadmap

## 9. Participação das IAs
Papéis definidos:
- Product Owner: responsável pela visão.
- Software Architect: responsável pela arquitetura.
- Software Engineer: responsável pela implementação.

As IAs não devem tomar decisões de produto sem aprovação. Mudanças arquiteturais devem ser justificadas e alinhadas com o roadmap.

## 10. Critérios de Qualidade
Toda entrega deve:
- compilar.
- não quebrar funcionalidades existentes.
- possuir tipagem.
- possuir documentação.
- respeitar Product Vision.
- respeitar Project Principles.

## 11. Filosofia de Engenharia
A filosofia de engenharia do FlowTrainerPro é:
- o código deve servir ao treinamento.
- a arquitetura deve permitir crescimento.
- o replay é o núcleo da plataforma.
- as Engines representam o domínio.
- a interface apenas comunica com o usuário.
- sempre priorizar simplicidade e escalabilidade.

## 12. Regra de Replay Historico
Negocio historico importado representa mercado observado, nao execucao do simulador.

Implementacoes de replay historico devem:
- emitir `historical:trade:executed`;
- projetar leitura por `market:trade:observed`;
- manter `MarketTrade` imutavel;
- preservar timestamps historicos;
- usar source mode exclusivo;
- evitar loops sincronicos longos;
- proteger `MatchingEngine`, FIFO, posicao, stops e P&L.

Elas nao devem emitir `matching:execution:created`, chamar `MatchingEngine`, usar Zustand no core ou converter automaticamente `RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` em lado direcional.

## 13. Regra de Analise de Corretoras
Analise de corretoras deve produzir evidencias quantitativas, nao conclusoes sobre intencao.

Implementacoes como `BrokerFlowAnalyzer` nao podem:

- alimentar UI via `matching:execution:created`;
- recalcular metricas de dominio dentro de componentes React;
- misturar RLP, DIRECT, AUCTION ou UNKNOWN com agressao direcional;
- afirmar intencao, posicao real ou causalidade de corretora.

Broker Flow visual deve seguir `brokerFlowStore` + `useBrokerFlow` + seletores especificos.
- afirmar posicao real;
- afirmar estoque;
- afirmar manipulacao;
- tratar corretora como pessoa;
- gerar sinal operacional;
- alterar ordens, posicao, stops, P&L, FIFO ou matching.

## 14. Regra de Interface
Novos componentes visuais devem utilizar o Design System oficial em `src/ui/designSystem`.

Evitar novos valores hardcoded de cor, tipografia, espacamento, radius, sombra ou movimento sem justificativa documentada.

Componentes React de UI nao devem conter regra de dominio.

Controles globais devem utilizar vocabulario, icones, estados e semantica consistentes em toda a aplicacao.

Regras adicionais:
- nao colocar acoes de trading dentro do transporte global de replay;
- nao criar botao visual sem handler homologado;
- nao permitir troca destrutiva de source mode por clique acidental;
- exibir tooltips para estado, atalho e motivo de indisponibilidade;
- manter Header, StatusBar e ReplayToolbar como camada de apresentacao, sem alterar engines ou stores de dominio.
- modernizacoes de paineis de mercado devem preservar handlers homologados, FIFO, MatchingEngine, posicao, stops e P&L;
- filas exibidas na UI devem vir de API read-only autoritativa, nunca de recalculo visual;
- Times & Trades deve manter `RLP`, `DIRECT`, `AUCTION` e `UNKNOWN` separados de BUY/SELL.

## 15. Declaração Final
O objetivo da engenharia é construir uma plataforma de treinamento em Order Flow robusta, modular, documentada e preparada para evolução contínua.
