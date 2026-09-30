# FLOW_PLAYER_LIBRARY.md
## Biblioteca Oficial de Perfis dos Participantes do Mercado

*Este documento cataloga QUEM causa os fenômenos de mercado e POR QUÊ. Cada participante possui objetivos próprios, perfil comportamental e restrições que guiam suas decisões, conforme exige o princípio 6 da Constituição.*

*Este documento descreve **motivação e comportamento** dos participantes. Ele NÃO descreve:*
- *os fenômenos em si (o QUE acontece) — isso é responsabilidade de `FLOW_MARKET_PHENOMENA.md`;*
- *o algoritmo de decisão em runtime (o COMO o simulador executa) — isso será responsabilidade de `FLOW_MARKET_BEHAVIOR_ENGINE.md`;*
- *as regras da microestrutura (ordens, matching, book) — isso é responsabilidade de `FLOW_MARKET_MICROSTRUCTURE.md`.*

*Subordinado a: `FLOWTRAINER_VISION.md`, `FLOW_MARKET_MICROSTRUCTURE.md`*

> **Status:** rascunho v0.1 — aprovação pendente. Conforme a Filosofia de Engenharia (Constituição, Seção 5), este documento deve ser discutido e aprovado antes de guiar qualquer código.

---

## 1. Propósito e fronteiras

A Constituição estabelece a cadeia causal fundamental (princípio 4.2):

```
Participantes decidem  →  Ordens são enviadas  →  Matching cruza  →  Preço se forma
   (ESTE documento)         (MICROSTRUCTURE)        (MICROSTRUCTURE)   (consequência)
                                        ↓
                          Fenômenos observáveis emergem
                              (MARKET_PHENOMENA)
```

`FLOW_MARKET_PHENOMENA.md` cataloga os fenômenos como entidades independentes — sem atribuir causa a participantes. Este documento fecha a lacuna: descreve **os agentes cujas decisões, somadas, produzem aqueles fenômenos**.

A regra de ouro é o princípio 6: *"As fases do mercado devem emergir naturalmente do comportamento dos players, não de scripts artificiais."* Portanto, este documento não define "quando ocorre uma absorção" — define **quem tem tendência a absorver, por qual motivo, e sob quais restrições**. A absorção emerge quando um participante com esse perfil encontra as condições certas.

### O que é um participante
Um participante é um agente autônomo do mercado com quatro atributos obrigatórios:

1. **Objetivo** — o que ele quer alcançar (ex.: construir posição comprada de N contratos ao melhor preço médio).
2. **Perfil comportamental** — como ele tende a agir para alcançar o objetivo (agressivo/passivo, fragmentado/único, etc.).
3. **Restrições** — o que o limita (capital, urgência, tolerância a slippage, horário, mandato).
4. **Estado** — onde ele está em relação ao objetivo agora (quanto já executou, preço médio atual, tempo decorrido).

Nenhuma decisão de um participante pode ser aleatória. Toda ordem enviada deve ser explicável por estes quatro atributos (princípios 4.9 e 6).

---

## 2. Ancoragem no código existente

Este documento formaliza — e dá sentido de mercado — a estrutura comportamental que **já existe** no código, em `src/core/marketIdentity/`. Não inventamos vocabulário novo; damos significado ao que está implementado.

| Conceito deste documento | Tipo no código | Arquivo |
|--------------------------|----------------|---------|
| Categoria do participante | `BrokerCategory` | `models/Broker.ts` |
| Estilo de agressão | `AggressionStyle` | `models/BrokerProfile.ts` |
| Padrão de execução | `ExecutionPattern` | `models/BrokerProfile.ts` |
| Faixa de lote típica | `BrokerProfile.lotRange` | `models/BrokerProfile.ts` |
| Tendências comportamentais | `BrokerProfile.tendencies` | `models/BrokerProfile.ts` |
| Identidade completa | `BrokerIdentity` (visual + comportamental) | `models/BrokerIdentity.ts` |

`BrokerCategory` define hoje seis categorias no código: `institutional`, `foreign`, `retail`, `hft`, `market_maker`, `other`. Por decisão deste documento (Seção 13.4), será acrescentada uma sétima — `hedger` — deixando de usar `other` para esse papel. Este documento descreve o comportamento de cada categoria, mas a fonte de verdade do comportamento é o **perfil individual de cada corretora** (Seção 13.1).

`AggressionStyle` já define: `aggressive`, `passive`, `mixed`, `distributed`.

`ExecutionPattern` já define: `single_large`, `fragmented`, `iceberg`, `sweep`, `absorption`, `defense`.

`tendencies` já define probabilidades 0..1 para: `absorbs`, `defends`, `usesIceberg`, `sweeps`.

> **Consequência de design:** o `FLOW_MARKET_BEHAVIOR_ENGINE.md` (a implementar) será o motor que lê um `BrokerProfile` + objetivo + estado e decide a próxima ordem. Este documento é a especificação do *conteúdo* desses perfis; o Behavior Engine é a *máquina* que os executa.

---

## 3. Estrutura de cada perfil

Cada participante é descrito com o mesmo esqueleto, para consistência:

```
Categoria (código: BrokerCategory)
Objetivo típico (o que quer)
Horizonte (intradiário, semanal, estrutural)
Estilo de agressão (código: AggressionStyle)
Padrões de execução (código: ExecutionPattern[])
Faixa de lote (código: lotRange)
Tendências (código: tendencies)
Restrições (o que o limita)
Fenômenos que tende a CAUSAR (referência a MARKET_PHENOMENA)
Como o aluno deve interpretar
Erros comuns de interpretação
```

---

> **Nota sobre as Seções 4–9 (arquétipos de categoria):** por decisão 13.1, o comportamento executado pelo simulador é sempre o **perfil individual** da corretora (`data/brokers.ts`), não uma média da categoria. As descrições abaixo são **arquétipos de referência** — úteis para leitura pedagógica e para preencher/validar perfis individuais — mas nunca substituem o `BrokerProfile` específico da corretora que estiver atuando.

## 4. Institucionais (`institutional`)

*Bancos, fundos e tesourarias nacionais. Exemplos de identidade visual: BTG, Itaú, Bradesco, Santander.*

### Objetivo típico
Construir ou desmontar posições grandes com o melhor preço médio possível, sem revelar intenção. Executam mandatos (alocação de fundo, hedge de tesouraria) que exigem volume alto ao longo do tempo.

### Horizonte
Intradiário a estrutural. Frequentemente não têm pressa — têm tamanho.

### Estilo de agressão
`mixed` a `passive`. Preferem fornecer liquidez (comprar na oferta, vender na demanda) para não pagar spread nem sinalizar urgência. Cruzam o spread apenas quando precisam garantir execução.

### Padrões de execução
`iceberg`, `fragmented`, `absorption`, `defense`. Escondem tamanho real, fragmentam a posição e defendem níveis onde estão construindo.

### Faixa de lote
Alta. `lotRange.avg` elevado; capazes de `max` muito acima da média do mercado.

### Tendências
`absorbs` alto, `defends` alto, `usesIceberg` alto, `sweeps` baixo (só varrem quando há urgência real).

### Restrições
- Não podem mover o preço contra si mesmos durante a construção (senão pioram o próprio preço médio).
- Mandato define tamanho-alvo e, às vezes, prazo.
- Aversão a sinalizar intenção ao mercado.

### Fenômenos que tende a CAUSAR
Acumulação, Distribuição, Absorção (compradora/vendedora), Defesa de Preço, e — ao concluir a posição e parar de segurar — Rompimento Verdadeiro na direção construída. (Ver `FLOW_MARKET_PHENOMENA.md`, Seções 2, 3, 10–11, 14, 6.)

### Como o aluno deve interpretar
Volume alto com preço parado + defesa que se renova = institucional se posicionando. O movimento subsequente tende a ser na direção dele. A pergunta-chave do aluno: *quem está absorvendo e há quanto tempo?*

### Erros comuns de interpretação
- Confundir a defesa institucional com "resistência natural" e operar contra ela.
- Achar que o volume alto durante a acumulação é "briga equilibrada" (o fluxo real é direcional).

---

## 5. Estrangeiros (`foreign`)

*Players internacionais operando no mercado brasileiro. Exemplos: JP Morgan, Goldman, UBS, Merrill, Morgan Stanley, Citi.*

### Objetivo típico
Alocação macro e arbitragem entre mercados. Frequentemente movem o mercado com convicção quando entram, pois trazem fluxo grande e direcional ligado a decisões globais (câmbio, juros, risco país).

### Horizonte
Intradiário a estrutural, tipicamente guiado por teses macro.

### Estilo de agressão
`mixed`, com episódios `aggressive` marcantes. Quando decidem entrar, podem varrer níveis.

### Padrões de execução
`single_large`, `sweep`, `fragmented`. Tanto conseguem "quebrar" um nível de uma vez quanto distribuir ao longo da sessão.

### Faixa de lote
Alta, comparável ou superior aos institucionais.

### Tendências
`sweeps` mais alto que o institucional nacional; `absorbs`/`defends` moderados; `usesIceberg` moderado.

### Restrições
- Sensíveis a câmbio e ao horário de sobreposição com mercados externos.
- Podem inverter fluxo rapidamente diante de evento macro.

### Fenômenos que tende a CAUSAR
Expansão de Volatilidade, Rompimento Verdadeiro, Aceleração, Mudança de Contexto, e Distribuição/Acumulação quando montam posição estrutural. (Ver Seções 4, 6, 22, 19, 2–3.)

### Como o aluno deve interpretar
Fluxo estrangeiro concentrado costuma anteceder movimentos de maior amplitude. O aluno deve pesar a presença estrangeira no Broker History como sinal de convicção, não de ruído.

### Erros comuns de interpretação
- Tratar um sweep estrangeiro como "exagero passageiro" e operar contra sem confirmação.
- Ignorar o contexto macro que explica a mudança de comportamento.

---

## 6. Varejo (`retail`)

*Traders individuais. Exemplos: XP, Clear, Rico, e afins.*

### Objetivo típico
Capturar movimentos de curto prazo. Operam volumes menores, frequentemente reativos ao que já aconteceu (entram tarde, no momentum).

### Horizonte
Intradiário curto, muitas vezes reativo.

### Estilo de agressão
`aggressive`, porém em lotes pequenos. Cruzam o spread com frequência por impaciência ou por stops.

### Padrões de execução
`single_large` (relativo ao seu porte, mas pequeno para o mercado), sem iceberg, sem defesa sustentada.

### Faixa de lote
Baixa. `lotRange` pequeno.

### Tendências
`absorbs` baixo, `defends` baixo, `usesIceberg` ~0, `sweeps` baixo.

### Restrições
- Capital limitado; sensíveis a drawdown.
- Stops concentrados em níveis óbvios (abaixo de suportes, acima de resistências) — tornam-se alvo de Busca por Liquidez.
- Tendem a agir depois que o movimento já é visível.

### Fenômenos que tende a CAUSAR
São mais frequentemente **vítimas** do que causadores. Contribuem para Exaustão (quando o fluxo final é dominado por lotes pequenos de varejo) e alimentam Falso Rompimento e Busca por Liquidez (seus stops são o combustível). (Ver Seções 12–13, 7, 16.)

### Como o aluno deve interpretar
Quando as últimas agressões de um movimento são lotes pequenos de varejo, o movimento provavelmente acabou (exaustão). Qualidade do fluxo importa mais que direção.

### Erros comuns de interpretação
- O próprio aluno agir como varejo: entrar no momentum tardio confundindo-o com força.
- Ler volume de varejo alto como "interesse comprador genuíno".

---

## 7. HFT / Alta Frequência (`hft`)

*Algoritmos de altíssima frequência.*

### Objetivo típico
Capturar micro-ineficiências: latência, desequilíbrios momentâneos de book, arbitragem de curtíssimo prazo. Não carregam posição direcional relevante ao fim do dia.

### Horizonte
Milissegundos a segundos.

### Estilo de agressão
`distributed`. Muitas ordens minúsculas, entradas e cancelamentos altíssimos.

### Padrões de execução
`fragmented`, `sweep` (quando detectam desequilíbrio), e cancelamento massivo.

### Faixa de lote
Baixa por ordem, altíssima em frequência.

### Tendências
`sweeps` situacional; `usesIceberg` baixo; caracterizam-se mais por velocidade e cancelamento do que por absorver/defender.

### Restrições
- Aversão a inventário (não querem terminar posicionados).
- Recuam (cancelam em massa) quando a volatilidade dispara — contribuindo para book raso.

### Fenômenos que tende a CAUSAR
Contribuem para Perda de Liquidez (cancelamento em massa) e para a aparência de book "vivo" mesmo sem execuções. Podem amplificar Expansão de Volatilidade ao sumirem justamente quando o mercado acelera. (Ver Seções 15, 4.)

### Como o aluno deve interpretar
Book que engorda e some rapidamente sem execução costuma ser HFT. O aluno deve distinguir liquidez "real" (que será defendida) de liquidez que evapora ao primeiro sinal de agressão.

### Erros comuns de interpretação
- Confiar em profundidade de book que é majoritariamente HFT (ela some quando você mais precisa).
- Confundir alta frequência de atualização do DOM com atividade de negociação (execução).

---

## 8. Market Makers (`market_maker`)

*Formadores de mercado que cotam os dois lados continuamente.*

### Objetivo típico
Capturar o spread fornecendo liquidez em ambos os lados. Lucram com o giro, não com direção.

### Horizonte
Contínuo; neutro em direção.

### Estilo de agressão
`passive` por natureza (postam limitadas nos dois lados). Tornam-se `aggressive` apenas para gerenciar inventário indesejado (hedge).

### Padrões de execução
`defense` (mantêm cotações), reposicionamento constante.

### Faixa de lote
Moderada e consistente nos dois lados.

### Tendências
`defends` alto (mantêm presença); `absorbs` moderado; recuam quando o risco de inventário fica alto.

### Restrições
- Precisam de mercado relativamente calmo para prosperar; sofrem em expansão de volatilidade.
- Gerenciamento de inventário é a restrição dominante.

### Fenômenos que tende a CAUSAR
Sustentam Mercado Lateral e Contração de Volatilidade (fornecem liquidez que segura o range). Ao se afastarem, contribuem para Expansão de Volatilidade. (Ver Seções 1, 5, 4.)

### Como o aluno deve interpretar
Mercado lateral com book simétrico e spread apertado costuma indicar market makers no controle. A saída deles é um sinal precoce de que a volatilidade vai aumentar.

### Erros comuns de interpretação
- Interpretar a simetria do book como "indecisão do mercado" quando é apenas market making.
- Não perceber o momento em que os MMs se retiram (transição para expansão).

---

## 9. Hedgers (`hedger`)

*Participantes protegendo posições em outros mercados (ex.: produtor protegendo commodity, gestor fazendo hedge de carteira). Por decisão 13.4, `hedger` é uma categoria própria em `BrokerCategory` (não mais `other`).*

### Objetivo típico
Reduzir risco de uma exposição existente, não obter lucro direcional no ativo negociado. O fluxo é motivado por necessidade externa, não por leitura do book.

### Horizonte
Ligado ao ciclo da exposição que estão protegendo.

### Estilo de agressão
`mixed`, frequentemente indiferente ao timing fino — executam porque precisam, não porque o momento é ótimo.

### Padrões de execução
`fragmented` ou `single_large`, conforme a urgência do hedge.

### Restrições
- O gatilho é externo ao mercado observado (evento no ativo protegido).
- Podem agir "contra o óbvio" porque sua motivação não é a leitura de fluxo.

### Fenômenos que tende a CAUSAR
Fluxo de hedge pode gerar Agressão inesperada, contribuir para Rompimento ou Absorção sem "motivo visível" no próprio book — lembrando ao aluno que nem todo fluxo é especulativo.

### Como o aluno deve interpretar
Nem todo grande fluxo tem intenção direcional sobre o ativo. Quando um movimento não "fecha" com o contexto de fluxo, hedge é uma explicação plausível.

### Erros comuns de interpretação
- Superinterpretar fluxo de hedge como sinal direcional forte.

---

## 10. O trader (aluno) como participante

O princípio 4.7 é categórico: *"O trader é apenas mais um participante do mercado."* Ele entra na mesma fila (FIFO), obedece às mesmas regras e não possui privilégio de matching.

Consequências para este documento:
- O aluno **não** tem um perfil pré-definido aqui — ele é dirigido por decisões humanas em tempo real.
- Mas está sujeito às mesmas mecânicas: suas ordens limitadas fornecem liquidez, suas ordens a mercado agridem, e seus stops podem ser alvo de Busca por Liquidez como os de qualquer varejo.
- A avaliação do aluno (responsabilidade do futuro `FLOW_TRAINING_ENGINE.md`) julgará a **coerência** das decisões dele com o contexto de participantes descrito aqui — nunca de forma binária (princípio 7).

---

## 11. Como os perfis produzem os fenômenos (mapa de causalidade)

Este mapa liga participante → fenômeno. É o inverso do "Mapa de Relações" da `FLOW_MARKET_PHENOMENA.md` (que liga fenômeno → fenômeno).

```
INSTITUCIONAL (passivo, iceberg, defende)
  → ACUMULAÇÃO / DISTRIBUIÇÃO / ABSORÇÃO / DEFESA DE PREÇO
  → (ao concluir) ROMPIMENTO na direção construída

ESTRANGEIRO (convicção macro, sweep)
  → EXPANSÃO DE VOLATILIDADE / ROMPIMENTO / ACELERAÇÃO / MUDANÇA DE CONTEXTO

VAREJO (reativo, lotes pequenos, stops óbvios)
  → alimenta EXAUSTÃO / é combustível de FALSO ROMPIMENTO e BUSCA POR LIQUIDEZ

HFT (distribuído, cancela em massa)
  → PERDA DE LIQUIDEZ / amplifica EXPANSÃO ao recuar

MARKET MAKER (passivo dos dois lados)
  → sustenta MERCADO LATERAL / CONTRAÇÃO; sua saída → EXPANSÃO

HEDGER (motivação externa)
  → AGRESSÃO / ROMPIMENTO "sem motivo visível" no book
```

Nenhuma dessas setas é um script. São **tendências**: o Behavior Engine deve fazer o fenômeno emergir quando as condições e as `tendencies` do participante coincidem.

Como nesta fase há **um participante ativo por vez** (decisão 13.3), a passagem do bastão entre um participante que conclui seu objetivo e o próximo que assume é exatamente o que materializa a **Mudança de Contexto** (`FLOW_MARKET_PHENOMENA.md`, Seção 19). O aluno percebe o regime mudar porque a intenção dominante mudou de dono.

---

## 12. Conformidade com a Constituição — dívida atual identificada

> Esta seção registra, de forma rastreável (princípio 4.9), uma divergência conhecida entre a implementação atual e a Constituição, para orientar o realinhamento. Ela **não** é uma especificação de implementação — apenas documenta o gap.

O `SyntheticMarketProvider` atual (`src/market/providers/SyntheticMarketProvider.ts`) gera o preço por `bias + ruído` via PRNG e atribui broker/volume de forma aleatória, **sem** que as decisões partam de objetivos, perfis e restrições dos participantes. Isso conflita com:

- **Princípio 4.2** — "Fluxo é causa. Preço é consequência. O preço nunca é gerado arbitrariamente." (Hoje o preço é gerado diretamente, não emerge de matching.)
- **Princípio 6** — "O FlowTrainerPro não gera números aleatórios (...) cada player possui objetivos próprios, perfil comportamental e restrições." (Hoje há `rand()` no caminho crítico da formação de preço.)

O caminho de realinhamento (a ser detalhado e aprovado em `FLOW_MARKET_BEHAVIOR_ENGINE.md`) é:

```
Estado atual:   PRNG → preço  → tick sintético → painéis
Estado alvo:    Participantes (este doc) → Ordens → MatchingEngine → preço emerge → painéis
```

Recomenda-se que qualquer construção da Etapa 2 que dependa de comportamento de players aguarde este realinhamento; funcionalidades de pura interação do usuário com o book (SuperDOM interativo, OrderManager) podem prosseguir em paralelo, pois não dependem do modelo de participantes.

---

## 13. Decisões de modelagem (aprovadas)

As quatro decisões abaixo foram tomadas e passam a orientar este documento e a implementação futura.

### 13.1. Granularidade: por corretora individual
O comportamento é modelado **por corretora individual**, não por categoria. Cada corretora possui seu próprio `BrokerProfile` (já implementado em `src/core/marketIdentity/data/brokers.ts`), com `aggressionStyle`, `lotRange`, `tendencies` e `executionPatterns` próprios.

A categoria (`BrokerCategory`) continua existindo como **agrupamento descritivo** (para leitura pedagógica e filtros), mas a fonte de verdade do comportamento é o perfil individual da corretora. Exemplos reais já no código:
- **JP MORGAN** (`foreign`): `aggressive`, lote avg 250 / max 800, `sweeps` 0.45, padrões `iceberg`+`sweep`+`single_large`+`absorption`.
- **UBS** (`foreign`): `aggressive`, lote avg 350 / max 1000, `absorbs` 0.50, `usesIceberg` 0.55.
- **CLEAR** (`retail`): `distributed`, lote avg 20 / max 100, tendências ~0.05, apenas `fragmented`.

Consequência: as Seções 4–9 descrevem os **arquétipos de categoria** como referência de leitura, mas o simulador deve executar o perfil da corretora específica sorteada/escolhida para atuar, não uma média da categoria.

### 13.2. Objetivo e estado: novo modelo `ParticipantState`
O `BrokerProfile` cobre *como* uma corretora tende a agir, mas não *o que ela quer agora* nem *onde está* em relação a isso. Fica decidido criar um novo modelo **`ParticipantState`** (a ser especificado e implementado via `FLOW_MARKET_BEHAVIOR_ENGINE.md`), contendo ao menos:

```
ParticipantState
├── brokerId            // qual corretora este estado representa
├── objective           // ex.: { side: 'buy', targetSize: 5000, priceLimit?: number }
├── executedSize        // quanto do objetivo já foi executado
├── averagePrice        // preço médio acumulado até agora
├── startedAt           // quando começou a perseguir o objetivo
├── constraints         // urgência, tolerância a slippage, prazo
└── status              // 'building' | 'holding' | 'unwinding' | 'done'
```

O `BrokerProfile` (estático, identidade) e o `ParticipantState` (dinâmico, sessão) são complementares: o Behavior Engine lê **perfil + estado + condições de mercado** para decidir a próxima ordem.

### 13.3. Concorrência: um participante ativo por vez
Nesta fase, o simulador terá **apenas um participante ativo por vez** dirigindo o fluxo dominante. Isso simplifica a emergência dos fenômenos (fica claro *quem* está causando o quê) e é didaticamente mais legível para o aluno.

Implicações:
- Há um único `ParticipantState` "ativo" a cada momento; os demais players entram como pano de fundo (liquidez ambiente), não como agentes com objetivo próprio.
- A transição entre participantes ativos (um conclui seu objetivo, outro assume) é, ela própria, o que produz a **Mudança de Contexto** (`FLOW_MARKET_PHENOMENA.md`, Seção 19).
- Escalar para múltiplos participantes simultâneos é trabalho futuro explícito, fora do escopo atual.

### 13.4. Hedger vira categoria própria
`hedger` passa a ser uma **categoria própria** em `BrokerCategory`, deixando de usar `other`. Isso exige uma alteração de código rastreável (ver Seção 14.1).

---

## 14. Pendências de implementação decorrentes das decisões

> Registradas aqui para rastreabilidade (princípio 4.9). Nenhuma deve ser implementada antes da aprovação deste documento e da especificação do `FLOW_MARKET_BEHAVIOR_ENGINE.md`.

### 14.1. Adicionar `hedger` a `BrokerCategory`
Em `src/core/marketIdentity/models/Broker.ts`, incluir `'hedger'` na união `BrokerCategory`. Reavaliar quais corretoras (se alguma) devem ser reclassificadas de `other` para `hedger` em `data/brokers.ts`. Verificar consumidores de `BrokerCategory` (ex.: `SyntheticMarketProvider`, filtros de UI) para tratar a nova categoria sem quebrar (princípio da Constituição: nunca quebrar o que já funciona).

### 14.2. Criar o modelo `ParticipantState`
Novo modelo (provavelmente em `src/core/participant/` ou similar), especificado em detalhe pelo `FLOW_MARKET_BEHAVIOR_ENGINE.md`. É o estado dinâmico que falta hoje.

### 14.3. Realinhar a formação de preço (dívida da Seção 12)
Substituir a geração de preço por PRNG do `SyntheticMarketProvider` por preço que **emerge** das ordens do participante ativo passando pelo MatchingEngine. Este é o item que reconcilia o motor com os princípios 4.2 e 6.

---

## 15. Conclusão

Este documento define os agentes cujas decisões, somadas e casadas pelo MatchingEngine, fazem os fenômenos de `FLOW_MARKET_PHENOMENA.md` emergirem — cumprindo o compromisso declarado naquele documento ("Quem CAUSA os fenômenos será documentado em `FLOW_PLAYER_LIBRARY.md`") e na `FLOW_MARKET_MICROSTRUCTURE.md`.

Ele fecha a lacuna conceitual entre "o que o código já modela" (`BrokerProfile`) e "o que a Constituição exige" (comportamento com objetivo, perfil e restrição). É a especificação de conteúdo que o futuro `FLOW_MARKET_BEHAVIOR_ENGINE.md` executará em runtime.

Enquanto não aprovado, permanece como rascunho e não deve guiar implementação.

---

*Documento criado em Julho de 2026.*
*Versão 0.1 — rascunho, aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md, FLOW_MARKET_MICROSTRUCTURE.md*
