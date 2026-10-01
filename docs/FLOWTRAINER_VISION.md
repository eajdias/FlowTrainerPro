# FLOWTRAINER_VISION.md
## Constituição Oficial do FlowTrainerPro

*Este documento é a referência máxima do projeto. Toda decisão de produto, arquitetura e implementação deve estar alinhada com o que está escrito aqui. Em caso de dúvida, este documento prevalece.*

---

## 1. Manifesto

O FlowTrainerPro existe porque o mercado financeiro brasileiro carece de uma ferramenta dedicada exclusivamente ao treinamento de leitura de fluxo de ordens.

Plataformas operacionais existem. Replays existem. Simuladores de gráficos existem.

Nenhuma delas foi projetada desde o início como um ambiente de aprendizado para Order Flow.

O trader que deseja aprender leitura de fluxo profissional enfrenta um problema estrutural: ele precisa arriscar capital real para adquirir experiência. Não existe um ambiente seguro, controlado e didático onde possa observar, praticar e errar sem consequências financeiras.

O FlowTrainerPro resolve esse problema.

Ele reproduz o comportamento de uma Bolsa de Valores com fidelidade suficiente para que o trader desenvolva percepção, leitura e disciplina antes de operar com dinheiro real.

Não estamos construindo um software para executar ordens reais. Estamos construindo uma plataforma para formar operadores capazes de interpretar o mercado por conta própria.

---

## 2. Nossa Missão

Desenvolver a capacidade do trader de interpretar o mercado.

Não ensinamos setups. Não ensinamos indicadores. Não ensinamos fórmulas.

Ensinamos o trader a ler:

- A intenção dos participantes.
- O contexto em que as ordens são colocadas.
- A reação do mercado diante de agressões.
- A diferença entre aparência e realidade no livro de ofertas.
- O comportamento dos grandes players institucionais.
- A dinâmica de oferta e demanda em tempo real.

A missão do FlowTrainerPro é formar operadores que pensam. Não operadores que seguem regras mecânicas.

O mercado é um leilão contínuo entre participantes com objetivos diferentes. Nossa plataforma existe para tornar esse leilão compreensível.

---

## 3. Nossa Visão

O FlowTrainerPro será reconhecido como a plataforma de referência para treinamento de leitura de fluxo de ordens no Brasil.

Nos próximos anos, ele deverá:

- Reproduzir cenários de mercado com fidelidade profissional.
- Possuir uma biblioteca de situações educacionais cobrindo desde conceitos básicos até operações institucionais.
- Avaliar automaticamente o desempenho do aluno e adaptar a dificuldade.
- Permitir que escolas e mentores utilizem a plataforma como ferramenta pedagógica.
- Oferecer um ambiente onde qualquer pessoa possa praticar leitura de fluxo sem risco financeiro.

Nosso diferencial não será visual. Será a fidelidade do simulador.

Enquanto outras plataformas reproduzem preços, nós reproduzimos comportamento.

---

## 4. Nossos Princípios

Estes princípios são invioláveis. Nenhuma decisão de produto ou engenharia pode contradizê-los.

**4.1.** O mercado é um leilão contínuo entre compradores e vendedores. Toda a arquitetura deve respeitar essa natureza.

**4.2.** Fluxo é causa. Preço é consequência. O preço nunca é gerado arbitrariamente. Ele nasce exclusivamente do casamento entre ordens.

**4.3.** O livro de ofertas representa intenções. O Times & Trades representa execuções. Esses dois conceitos jamais podem ser misturados em nenhuma parte do sistema.

**4.4.** Toda funcionalidade deve reproduzir comportamento real da Bolsa. Se algo não acontece na B3, não deve acontecer no simulador.

**4.5.** Fidelidade é mais importante que efeitos visuais. Preferimos um painel simples que mostra informação correta a um painel bonito que mostra informação incorreta.

**4.6.** O aluno aprende interpretando contexto. Não decorando padrões. A plataforma deve estimular raciocínio, não memorização.

**4.7.** O trader é apenas mais um participante do mercado. Ele entra na mesma fila, obedece às mesmas regras e compete pelos mesmos preços que qualquer outro player.

**4.8.** Cada ferramenta possui uma responsabilidade única. Nenhuma ferramenta deve duplicar a função de outra.

**4.9.** Todo dado exibido em tela deve possuir uma origem rastreável no motor de mercado. Nenhum número pode ser inventado para fins visuais.

**4.10.** O sistema deve permanecer consistente em todos os cenários, incluindo ausência de liquidez, excesso de agressão ou comportamento inesperado dos players.

---

## 5. Filosofia de Engenharia

O FlowTrainerPro é desenvolvido seguindo um processo estruturado. Nenhuma funcionalidade é implementada por impulso.

O fluxo obrigatório é:

```
Ideia
  ↓
Discussão (alinhamento conceitual)
  ↓
Documentação oficial (aprovada antes de qualquer código)
  ↓
Aprovação do responsável
  ↓
Implementação (incremental, validada a cada etapa)
  ↓
Teste (funcional e arquitetural)
  ↓
Validação (o responsável confirma que funciona conforme documentado)
  ↓
Liberação (a funcionalidade passa a fazer parte do projeto)
```

Regras adicionais:

- Nenhuma funcionalidade pode ser implementada sem documentação prévia aprovada.
- Toda implementação deve ser incremental. Mudanças grandes devem ser divididas em sprints pequenas e validáveis.
- O sistema deve permanecer funcional após cada sprint. Nunca devemos quebrar o que já funciona para implementar algo novo.
- A documentação é parte obrigatória do projeto. Código sem documentação é código incompleto.
- Toda decisão arquitetural relevante deve ser registrada e justificada.

---

## 6. Filosofia de Simulação

O FlowTrainerPro não gera números aleatórios.

Nosso objetivo é reproduzir comportamento.

Isso significa que:

- Cada movimento de preço deve possuir uma causa identificável.
- Cada execução no Times & Trades deve ter um motivo (um player decidiu agredir).
- Cada mudança no livro de ofertas deve ter uma explicação (um player adicionou, cancelou ou reposicionou uma ordem).
- Cada player possui objetivos próprios, perfil comportamental e restrições que guiam suas decisões.
- O mercado deve parecer vivo. Mesmo quando nenhum negócio está sendo executado, o livro deve mudar constantemente com entradas, cancelamentos e reposicionamentos.
- A liquidez deve ser finita e realista. Se um nível for consumido, ele desaparece. Se ninguém coloca oferta, o nível fica vazio.
- As fases do mercado (tendência, lateralização, absorção, rompimento, exaustão) devem emergir naturalmente do comportamento dos players, não de scripts artificiais.

O simulador ideal é aquele que, ao ser observado por um trader experiente, parece indistinguível de um mercado real.

---

## 7. Filosofia de Ensino

O FlowTrainerPro é, antes de tudo, uma plataforma educacional.

Não queremos ensinar o aluno onde comprar ou vender. Queremos ensiná-lo a pensar como um trader profissional.

Isso significa desenvolver as seguintes capacidades:

**Contexto.** O aluno deve aprender a avaliar o ambiente de mercado antes de tomar qualquer decisão. Mercado em tendência é diferente de mercado lateral. Mercado com liquidez é diferente de mercado raso.

**Intenção.** O aluno deve aprender a distinguir entre o que está visível no livro e o que realmente vai acontecer. Nem toda ordem grande é real. Nem todo volume é legítimo.

**Liquidez.** O aluno deve entender onde existe liquidez, onde ela está sendo consumida e onde ela está sendo defendida.

**Agressão.** O aluno deve reconhecer quando um participante está tomando iniciativa e cruzando o spread para executar imediatamente.

**Absorção.** O aluno deve identificar quando um grande participante está absorvendo agressões sem deixar o preço se mover.

**Exaustão.** O aluno deve perceber quando o fluxo está perdendo força e uma reversão pode estar próxima.

**Defesa.** O aluno deve reconhecer quando um player institucional está defendendo um nível de preço de forma consistente.

**Rompimentos.** O aluno deve distinguir entre rompimentos genuínos e falsos rompimentos (armadilhas de liquidez).

**Comportamento dos participantes.** O aluno deve aprender a identificar padrões de atuação das diferentes corretoras e categorias de players (institucional, estrangeiro, varejo, HFT).

A avaliação do aluno nunca será binária (certo/errado). Será contextual — considerando o momento, a qualidade da leitura e a coerência da decisão com o cenário apresentado.

---

## 8. Arquitetura da Documentação

Este documento é a Constituição. Ele define o que somos e para onde vamos.

A partir dele, serão criados documentos especializados que detalham cada aspecto do projeto:

| Documento | Responsabilidade |
|-----------|-----------------|
| `FLOWTRAINER_VISION.md` | Visão, missão, princípios, filosofias (este documento) |
| `FLOW_MARKET_MICROSTRUCTURE.md` | Como o motor de mercado funciona (OrderBook, Matching, Events) |
| `FLOW_MARKET_BEHAVIOR_ENGINE.md` | Como os players se comportam e tomam decisões **(não escrito — futuro)** |
| `FLOW_TRAINING_ENGINE.md` | Como o sistema de treinamento avalia o aluno |
| `FLOW_MARKET_SCENARIOS.md` | Biblioteca de cenários e como são construídos |
| `FLOW_PLAYER_LIBRARY.md` | Perfis comportamentais dos participantes do mercado |
| `FLOW_AI_DECISION_ENGINE.md` | Como a IA futura observará e orientará o aluno |

Todos esses documentos deverão respeitar obrigatoriamente a visão estabelecida aqui. Nenhum documento técnico pode contradizer os princípios fundamentais.

A hierarquia é clara:

```
FLOWTRAINER_VISION.md (Constituição — prevalece sobre tudo)
  ↓
Documentos especializados (detalham áreas específicas)
  ↓
Código-fonte (implementa o que está documentado)
```

---

## 9. Declaração Final

O FlowTrainerPro não é apenas um software.

É uma plataforma construída para reproduzir, ensinar e explicar o funcionamento do mercado financeiro com o maior grau possível de fidelidade.

Ele existe para que traders possam desenvolver competência real em um ambiente seguro. Para que possam errar sem perder dinheiro. Para que possam repetir situações até dominá-las. Para que possam evoluir do desconhecimento à proficiência através da prática deliberada.

Acreditamos que o mercado ensina quem sabe observar. E construímos o FlowTrainerPro para tornar essa observação possível, acessível e progressiva.

Cada linha de código que escrevemos está a serviço deste propósito.

---

*Documento criado em Julho de 2026.*
*Versão 1.0 — aprovação pendente.*
