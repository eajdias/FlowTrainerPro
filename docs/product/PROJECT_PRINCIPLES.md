# PROJECT PRINCIPLES

## Manifesto
"O mercado é o professor.
O FlowTrainerPro é a sala de aula."

Este princípio significa que o software não é o ator principal no trade; ele é o ambiente onde o trader pratica, observa e aprende. O Market Behavior é o conteúdo, e o FlowTrainerPro é o espaço que torna esse conteúdo acessível e compreensível.

## Os Princípios Fundamentais

### Princípio 1
O treinamento está acima da operação.

O FlowTrainerPro existe para desenvolver a habilidade do trader, não para executar operações reais. Cada recurso deve apoiar a prática deliberada e a construção de competência.

### Princípio 2
O Replay é o centro da plataforma.

A capacidade de revisar e repetir acontecimentos de mercado é fundamental para a aprendizagem. O sistema deve permitir que o trader estude o fluxo de ordens, identifique padrões e repita situações.

### Princípio 3
O mercado ensina.

O software apenas cria o ambiente para o aprendizado. O comportamento do mercado é a fonte de verdade, e o FlowTrainerPro organiza esse comportamento para que o trader o entenda.

### Princípio 4
A leitura de fluxo é prioridade.

A plataforma deve privilegiar informações de Order Flow e evitar dependência de indicadores tradicionais. O foco é interpretar ordens, volume, preços e execução.

### Princípio 5
Nenhuma funcionalidade deve tomar decisões pelo trader.

O software deve desenvolver habilidade, nunca substituir o raciocínio humano. Recursos que automatizem decisões corroem o propósito pedagógico do projeto.

### Princípio 6
Realismo acima de efeitos visuais.

Toda interface deve representar fielmente o comportamento do mercado. Animações e efeitos visuais não podem comprometer a precisão e a utilidade do ambiente de treino.

### Princípio 7
Toda interface deve servir ao aprendizado.

Não implementar recursos apenas por aparência. Cada elemento deve ter propósito didático e contribuir para o entendimento do fluxo de ordens.

### Princípio 8
Arquitetura desacoplada.

As Engines não dependem da Interface. A Interface depende das Engines. A lógica de mercado e os provedores de dados devem permanecer independentes dos componentes visuais.

### Princípio 9
Toda funcionalidade deve ser documentada.

Nenhuma Sprint será considerada concluída sem documentação. A documentação é parte obrigatória do desenvolvimento e garante que futuras decisões respeitem os princípios do produto.

### Princípio 10
O sistema deve evoluir continuamente.

A arquitetura deve permitir crescimento sem necessidade de reescrita. Novas capacidades devem ser integradas com incrementalismo e modularidade.

## Regras de Desenvolvimento
- Nunca criar funcionalidades sem objetivo pedagógico.
- Nunca adicionar dependências sem necessidade.
- Priorizar simplicidade.
- Priorizar desempenho.
- Priorizar clareza do código.
- Escrever código desacoplado.
- Criar documentação para novas arquiteturas.
- Preservar compatibilidade com o restante do sistema.

## Filosofia de Engenharia
- O produto deve ser modular.
- Engines concentram a lógica.
- Componentes React apenas representam estado.
- Dados de mercado devem possuir provedores independentes.
- Replay, dados sintéticos e dados reais devem compartilhar a mesma arquitetura.

## Declaração Final
O objetivo do FlowTrainerPro não é criar um trader automático, nem prever o mercado. Seu objetivo é desenvolver traders capazes de compreender o comportamento do mercado através da prática, repetição, análise e feedback.
