# FLOW_MARKET_SCENARIOS.md
## Biblioteca Oficial de Cenários de Ensino

*Este documento define O QUE é um cenário de ensino no FlowTrainerPro, como ele é construído (pelo produto ou pelo aluno/mentor via upload), e como os três modos de consumo pedagógico funcionam.*

*Ele NÃO define:*
- *os fenômenos em si (o QUE acontece no mercado) — isso é `FLOW_MARKET_PHENOMENA.md`;*
- *quem causa os fenômenos (QUEM) — isso é `FLOW_PLAYER_LIBRARY.md`;*
- *como o aluno é avaliado (quiz, pontuação, coerência) — isso será `FLOW_TRAINING_ENGINE.md`;*
- *as regras de matching e book — isso é `FLOW_MARKET_MICROSTRUCTURE.md`.*

*Subordinado a: `FLOWTRAINER_VISION.md`, `FLOW_MARKET_MICROSTRUCTURE.md`, `FLOW_MARKET_PHENOMENA.md`, `FLOW_PLAYER_LIBRARY.md`*

> **Status:** rascunho v0.1 — aprovação pendente. Conforme a Filosofia de Engenharia (Constituição, Seção 5), este documento deve ser discutido e aprovado antes de guiar qualquer código.

---

## 1. Propósito

A Constituição (Seção 7, Filosofia de Ensino) exige que o aluno desenvolva contexto, intenção, liquidez, agressão, absorção e exaustão através de observação e prática — nunca de memorização. Até este documento, o FlowTrainerPro tinha o vocabulário (`FLOW_MARKET_PHENOMENA.md`) e os agentes (`FLOW_PLAYER_LIBRARY.md`), mas nenhum mecanismo que entregasse isso ao aluno de forma didática.

Este documento define esse mecanismo: o **Cenário**.

Um Cenário é um recorte de mercado — real ou proveniente do motor de simulação — associado a anotações pedagógicas que apontam onde um fenômeno catalogado ocorreu, por quê, e o que o aluno deve observar.

---

## 2. Ancoragem em dado real

Esta seção documenta, de forma rastreável (princípio 4.9), o que foi verificado a partir de um arquivo real de negócios (WDOFUT, B3, pregão contínuo) usado como referência de projeto para esta especificação.

### 2.1. Estrutura do dado disponível
O arquivo trazido como referência contém apenas **negócios executados** (Times & Trades), sem profundidade de book (nível 2). Colunas: `ATIVO`; `DATA`; `HORARIO`; `Corretora Compradora`; `Valor da Negociação`; `Qd Lts`; `Corretora Vendedora`; `Agressor`.

Isso confirma e delimita o escopo deste documento: cenários construídos a partir de CSV real podem reconstruir com fidelidade **Times & Trades, Volume Profile e Broker History**, mas **não** podem reconstruir o **DOM histórico** (não há dado de ofertas resting). Esse limite molda diretamente o Modo Replay Livre (Seção 6.3).

### 2.2. Achados que exigem tratamento explícito no pipeline de ingestão

**Ordem cronológica invertida.** O arquivo real vem do mais recente para o mais antigo. O pipeline de ingestão deve reordenar antes de qualquer replay.

**O campo `Agressor` tem mais valores do que `FLOW_MARKET_MICROSTRUCTURE.md` prevê hoje.** Além de Comprador/Vendedor (mapeáveis diretamente para COMPRA/VENDA, Seção 10 da Microstructure), o dado real trouxe:

- **RLP (Retail Liquidity Provider)** — mecanismo oficial da B3, comportamento assimilável a um `market_maker` (Seção 8 do `FLOW_PLAYER_LIBRARY.md`).
- **Leilão** — negócios de leilão (tipicamente abertura/fechamento), formados por mecanismo de price discovery diferente do double-auction contínuo (Seção 1 da Microstructure). Não devem ser misturados com negócios de pregão contínuo na mesma linha do tempo de um cenário de rompimento/absorção — geram ruído didático.
- **Direto** — negociação direta reportada à bolsa, fora do cruzamento contínuo do book.

Negócios **Direto** são, no dado observado, **100% cruzamentos internos da mesma corretora** (corretora compradora idêntica à vendedora — confirmado em todas as ocorrências do arquivo de referência). Isso significa que um negócio Direto não representa fluxo real de order flow entre participantes e **não deve alimentar** a leitura de agressão/absorção de um cenário — é ruído estrutural, não sinal.

**O código numérico da corretora no CSV bate com a coluna "Nº" do `FLOW_BROKER_COLORS.md`.** Ex.: `147 - ATIVA INVESTIMENTOS S.A. CTCV` → Nº 147 → Ativa. Isso resolve o mapeamento de identidade visual/comportamental na ingestão sem necessidade de heurística de nome.

### 2.3. Regra de ingestão derivada

```
Ingestão de CSV real:
  1. Reordenar cronologicamente (mais antigo → mais recente).
  2. Descartar ou marcar separadamente negócios tipo Leilão
     (não pertencem ao pregão contínuo).
  3. Descartar negócios tipo Direto onde corretora compradora == corretora vendedora
     (cruzamento interno, não é order flow observável).
  4. Extrair o código numérico do prefixo do nome da corretora e mapear via BrokerRegistry
     (fonte: FLOW_BROKER_COLORS.md / brokers.ts).
  5. Emitir cada linha restante como um evento trade:executed compatível com o contrato
     já definido na Seção 6 de FLOW_MARKET_MICROSTRUCTURE.md.
```

A partir do passo 5, o dado real se comporta exatamente como qualquer outro `trade:executed` do sistema — os painéis (TT, Volume Profile, Broker History) não precisam saber se a origem foi o `SyntheticMarketProvider` ou um CSV importado. Isso preserva o princípio 4.8 (responsabilidade única): a ingestão é a única camada que conhece a peculiaridade do dado real.

---

## 3. O que é um Cenário

Um Cenário é composto por:

```
Cenário
├── janela de mercado       // sequência ordenada de trade:executed (real ou sintética)
├── metadados               // ativo, data, duração, origem (real | sintético)
├── anotações[]             // ver Seção 4
└── quiz (opcional)         // referência ao FLOW_TRAINING_ENGINE.md
```

Um Cenário pode ter duas origens:

- **Curado** — construído pela equipe do produto (ou por um mentor autorizado), a partir de dado real ou de replay do motor sintético, com narrativa pedagógica explícita.
- **Anotado pelo usuário** — o aluno (ou instrutor) sobe um CSV próprio e marca trechos, conforme Seção 4. Não tem narrativa obrigatória — a anotação já é a narrativa.

Ambos compartilham a mesma estrutura de dados. A diferença está em **quem** escreveu a anotação e **com que propósito** (ensinar vs. estudar).

---

## 4. O que é uma Anotação

Uma anotação liga um trecho do cenário a um significado. Sua estrutura:

```
Anotação
├── timestampStart / timestampEnd   // janela do fenômeno observado
├── phenomenonId                    // referência FECHADA a uma seção de FLOW_MARKET_PHENOMENA.md
├── originEvent (opcional)          // negócio ou sequência que disparou o fenômeno
│     ├── brokerId
│     ├── side
│     ├── size
│     └── timestamp
├── note (opcional)                 // texto livre do autor da anotação
└── authorType                      // 'curated' | 'user'
```

### 4.1. Por que `phenomenonId` é vocabulário fechado, não texto livre
`FLOW_MARKET_PHENOMENA.md` já cataloga 24 fenômenos com definição, assinatura e critério de identificação (Seções 1–24 daquele documento). Se a anotação aceitasse texto livre, o mesmo fenômeno acabaria grafado de formas diferentes por autores diferentes ("absorção", "absorção compradora", "compra absorvendo") — quebrando qualquer possibilidade de filtrar, agregar ou avaliar cenários por fenômeno. `phenomenonId` deve ser um **enum gerado** a partir das seções daquele documento.

### 4.2. Exemplo real de anotação (dado observado, não inventado)
A partir do arquivo de referência, o seguinte trecho é candidato natural a virar um cenário anotado — não é um exemplo hipotético, é uma leitura de dado real:

```
Cenário: WDOFUT, 13/07/2026, 13:34:43–13:36:51 (pregão contínuo)

Anotação 1
  timestampStart: 13:34:52
  timestampEnd:   13:35:08
  phenomenonId:   ROMPIMENTO_VERDADEIRO (PHENOMENA.md, Seção 6)
  originEvent:    ITAU CV S/A, agressor comprador,
                  sequência de ~150 execuções entre 13:34:54 e 13:35:08
                  deslocando o preço de 5.156,50 para 5.160,00
  note:           "Repare a sequência de negócios no mesmo segundo (13:34:54) —
                   um único fluxo agressor consumindo múltiplos níveis em cascata,
                   não uma disputa equilibrada."

Anotação 2
  timestampStart: 13:35:08
  timestampEnd:   13:36:51
  phenomenonId:   CONTINUACAO_DE_TENDENCIA (PHENOMENA.md, Seção 20)
  originEvent:    TERRA INVESTIMENTOS, agressor comprador, lotes de 300-1800
  note:           "Preço continua de 5.160,00 até 5.163,00 com a corretora 107
                   dominando o lado comprador em blocos grandes — mesma direção,
                   novo participante assumindo o fluxo (ver PLAYER_LIBRARY.md, Seção 11:
                   troca de participante ativo)."
```

Esse par de anotações já ilustra por que a granularidade por corretora (decisão 13.1 do `FLOW_PLAYER_LIBRARY.md`) importa pedagogicamente: o aluno não vê "um comprador genérico", vê o Itaú abrindo o movimento e a Terra assumindo o bastão — exatamente o mapa de causalidade da Seção 11 daquele documento, com nome e sobrenome.

---

## 5. Vocabulário derivado da Constituição para o Modo Guiado

O Modo Guiado (ver Seção 6.1) precisa de um vocabulário de instrução ao aluno, além do vocabulário de fenômeno. Propõe-se:

| Instrução | Efeito na interface |
|-----------|---------------------|
| `observe` | Playback ativo, interação do usuário bloqueada |
| `highlight` | Realce visual no painel relevante (TT, VP, Broker History) na janela da anotação |
| `pause` | Playback para, aguarda o aluno confirmar que observou antes de continuar |
| `quiz` | Dispara avaliação (delegado ao `FLOW_TRAINING_ENGINE.md`) |

O exemplo do enunciado original do produto — *"olhe a boletada da UBS, não clique ainda, olhe como o mercado respondeu, depois responda o quiz"* — se traduz literalmente em: `observe` + `highlight` na janela da anotação + `pause` até o fim da janela + `quiz`.

---

## 6. Modos de consumo

### 6.1. Modo Guiado (passivo, narrado)
O aluno assiste a um Cenário Curado. Sem interação de ordem. Ao fim de uma ou mais anotações, o `FLOW_TRAINING_ENGINE.md` dispara um quiz referenciando o(s) `phenomenonId` observado(s).

Fonte de dado: real (CSV ingerido) ou sintética (captura de uma sessão do `SyntheticMarketProvider`/futuro Behavior Engine).

### 6.2. Modo Anotação (autoria)
O usuário sobe um CSV próprio. O pipeline da Seção 2.3 normaliza e ingere. O usuário navega o replay e cria anotações (Seção 4) manualmente, escolhendo `phenomenonId` a partir da lista fechada.

Este modo não avalia o aluno — ele produz conteúdo que pode alimentar o Modo Guiado (se promovido a Cenário Curado por um mentor) ou permanecer privado como estudo pessoal.

### 6.3. Modo Replay Livre (interativo)
O aluno navega um dia inteiro de dado real e pode enviar ordens a mercado a qualquer momento. Dado o limite identificado na Seção 2.1 (sem profundidade de book real), a regra de preenchimento é:

```
Regra de fill no Replay Livre:
  Ordem a mercado do aluno no instante T
    → preenchida ao preço do primeiro trade:executed real
      que ocorrer em T' >= T (a próxima execução genuína da fita)
    → nenhuma ordem limitada (resting) é aceita, pois não existe
      book real para ela entrar
```

Isso respeita o princípio 4.9 (nenhum número inventado): o preço de execução do aluno é sempre um preço que **genuinamente aconteceu** no mercado real, nunca um book sintético fabricado para a ocasião. A limitação — só ordem a mercado, sem limitada resting — é honesta e deve ser comunicada ao aluno como característica do modo, não escondida.

**Nota:** este modo NÃO depende do `FLOW_MARKET_BEHAVIOR_ENGINE.md` para funcionar sobre dado real. Ele voltaria a depender do Behavior Engine apenas se o produto decidir oferecer replay livre sobre cenários **sintéticos** (não reais) — porque aí sim seria necessário um book plausível não-aleatório para o aluno negociar contra.

---

## 7. Pendências de implementação

> Registradas para rastreabilidade (princípio 4.9). Nenhuma deve ser implementada antes da aprovação deste documento.

### 7.1. Pipeline de ingestão de CSV
Implementar os 5 passos da Seção 2.3. Local sugerido: `src/core/ingestion/` (a definir). Deve emitir eventos compatíveis com o contrato `trade:executed` existente sem exigir mudanças nos painéis consumidores.

### 7.2. Extensão do modelo de Agressor na Microstructure
`FLOW_MARKET_MICROSTRUCTURE.md`, Seção 10, deve ganhar um adendo cobrindo **RLP** e **Leilão** como tipos observados no mercado real, com sua semântica própria — não são exceções, são categorias legítimas que o documento ainda não previa.

### 7.3. Modelo de dados Cenário e Anotação
Implementar as estruturas da Seção 3 e 4, com `phenomenonId` como **enum gerado** (não à mão) a partir das seções de `FLOW_MARKET_PHENOMENA.md`, para evitar desalinhamento entre os dois documentos ao longo do tempo.

### 7.4. Motor de fill do Modo Replay Livre
Implementar a regra da Seção 6.3 sobre o MatchingEngine existente, tratando o dado histórico como liquidez passiva de referência (não editável), e a ordem do aluno como único agente ativo de fato.

---

## 8. Conclusão

Este documento fecha a lacuna entre "temos o vocabulário de fenômenos e os perfis de participantes" e "o aluno consegue efetivamente aprender com isso". Ele nasce ancorado em dado real (Seção 2), o que já revelou três lacunas concretas nos documentos anteriores (Agressor com mais tipos que o previsto, negócios Direto como ruído estrutural, ordem cronológica invertida) — validando a decisão de tratar dado real como insumo de especificação, não apenas de teste.

Os três modos de consumo (Guiado, Anotação, Replay Livre) atendem à visão original do produto sem exigir, na maior parte dos casos, que o `FLOW_MARKET_BEHAVIOR_ENGINE.md` esteja pronto primeiro — reduzindo a dependência que se assumia anteriormente.

Enquanto não aprovado, permanece como rascunho e não deve guiar implementação.

---

*Documento criado em Setembro de 2026.*
*Versão 0.1 — rascunho, aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md, FLOW_MARKET_MICROSTRUCTURE.md, FLOW_MARKET_PHENOMENA.md, FLOW_PLAYER_LIBRARY.md*
