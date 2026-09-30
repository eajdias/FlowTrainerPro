# FLOW_MARKET_MICROSTRUCTURE.md
## Especificação Oficial da Microestrutura de Mercado

*Este documento define, com precisão técnica, como uma Bolsa de Valores funciona e como o FlowTrainerPro deve reproduzir esse comportamento. Toda implementação relacionada ao motor de mercado deve seguir obrigatoriamente esta especificação.*

*Subordinado à Constituição: `FLOWTRAINER_VISION.md`*

---

## 1. O que é uma Bolsa de Valores

Uma Bolsa de Valores é um ambiente de **leilão contínuo** onde compradores e vendedores negociam ativos financeiros através de ordens.

O leilão é contínuo porque funciona ininterruptamente durante o horário de pregão. Não existe um leiloeiro central. O cruzamento acontece automaticamente quando existe compatibilidade entre uma ordem de compra e uma de venda.

**O preço é consequência das negociações. Jamais o contrário.**

O preço não sobe porque "o mercado decidiu subir". O preço sobe porque um comprador aceitou pagar mais caro do que o último negócio. E ele pagou mais caro porque não havia vendedores disponíveis no preço anterior — a liquidez foi consumida.

Toda a lógica do FlowTrainerPro nasce desta premissa: o preço é um efeito. A causa são as ações dos participantes.

---

## 2. Participantes do Mercado

O mercado é composto por diversos participantes com objetivos, estratégias e comportamentos distintos.

Categorias principais:
- **Institucionais** — bancos, fundos, tesourarias (operam grandes volumes com objetivos estratégicos)
- **Estrangeiros** — players internacionais que operam no mercado brasileiro
- **Varejo** — traders individuais (operam volumes menores, frequentemente fragmentados)
- **HFT / Market Makers** — algoritmos que fornecem liquidez e capturam spread
- **Hedgers** — participantes protegendo posições em outros mercados

Todos interagem através do mesmo Livro de Ofertas. Nenhum participante possui acesso privilegiado ao mecanismo de matching.

O detalhamento completo dos perfis comportamentais está documentado em `FLOW_PLAYER_LIBRARY.md`.

---

## 3. Tipos de Ordens

### 3.1. Ordem Limitada

**O que é:** Uma declaração de intenção. O participante informa o preço máximo que aceita pagar (compra) ou o preço mínimo que aceita receber (venda).

**Como entra no sistema:** É adicionada ao Livro de Ofertas no nível de preço especificado.

**Quando permanece no book:** Sempre que não existe contraparte disponível no preço solicitado ou melhor.

**Quando executa:** Se no momento da entrada já existir uma contraparte com preço compatível, o MatchingEngine cruza imediatamente (a ordem limitada funciona como agressora neste caso).

**Quando é cancelada:** Quando o participante decide voluntariamente retirá-la. Ou quando o sistema a invalida (timeout, fim de sessão).

**O que causa no DOM:** Adição de volume no nível de preço correspondente.

**O que NÃO causa:** Nenhuma execução. Nenhuma mudança no Last Price. Nenhum registro no Times & Trades.

**Componentes impactados:** OrderBookEngine, SuperDOM (via `book:update`).

---

### 3.2. Ordem a Mercado

**O que é:** Uma ordem de execução imediata. O participante aceita qualquer preço disponível para executar agora.

**Como entra no sistema:** Vai diretamente ao MatchingEngine. Nunca fica resting no book.

**Quando executa:** Imediatamente, contra as ordens limitadas resting no lado oposto do book.

**O que causa:** Execução. Redução ou remoção de ordens no OrderBook. Geração de `trade:executed`. Atualização do Last Price.

**O que NÃO causa:** Não adiciona volume ao book. Não aparece como intenção no DOM.

**Componentes impactados:** MatchingEngine, OrderBookEngine (reduz/remove), Times & Trades, Volume Profile, Broker History, Last Price, SuperDOM (book perde liquidez).

---

### 3.3. Ordem Stop

**O que é:** Uma ordem condicionada. Fica inativa até que o preço de mercado atinja um valor definido (trigger). Quando o trigger é atingido, transforma-se automaticamente em uma **Ordem a Mercado**.

**Quando fica ativa:** Ao atingir o preço de trigger.

**O que causa quando ativada:** Tudo que uma Ordem a Mercado causa.

**O que NÃO causa enquanto inativa:** Nada. Não aparece no DOM. Não afeta o book. É invisível para outros participantes.

---

### 3.4. Ordem Stop Limit

**O que é:** Semelhante ao Stop, mas ao ser ativada transforma-se em uma **Ordem Limitada** (não a mercado).

**Diferença fundamental:** Após ativação, pode NÃO executar se o preço já tiver passado do limite definido. A ordem resting no book, sem garantia de execução.

---

## 4. Livro de Ofertas (DOM)

### 4.1. O que é o DOM

O Livro de Ofertas (Depth of Market — DOM) é a estrutura central de uma Bolsa de Valores. Ele contém todas as ordens limitadas que estão aguardando execução.

É a **única visualização de intenções** no mercado.

### 4.2. O que o DOM representa

- Ordens limitadas de compra (Bids) em cada nível de preço
- Ordens limitadas de venda (Asks) em cada nível de preço
- A quantidade total de contratos em cada nível
- A profundidade do mercado (quantos níveis possuem liquidez)
- O spread (diferença entre melhor compra e melhor venda)

### 4.3. O que o DOM NÃO representa

- Negócios executados
- Volume histórico
- Agressões
- Direção do mercado
- Intenção real dos participantes (ordens podem ser spoofing)

### 4.4. Estrutura do DOM

```
ASKS (ofertas de venda) — preço crescente para cima
─────────────────────────────────────────────
5.072,00  │         │  420 contratos ← ask
5.071,50  │         │  180 contratos ← ask
5.071,00  │         │  250 contratos ← ask (MELHOR VENDA / Best Ask)
─────────────────────────────────────────────
                SPREAD = 1,00
─────────────────────────────────────────────
5.070,00  │  300 contratos  │         ← bid (MELHOR COMPRA / Best Bid)
5.069,50  │  150 contratos  │         ← bid
5.069,00  │  500 contratos  │         ← bid
─────────────────────────────────────────────
BIDS (ofertas de compra) — preço decrescente para baixo
```

### 4.5. Conceitos fundamentais

**Bid (Compra):** Ordens de participantes dispostos a comprar. Ficam abaixo do preço atual. Preço mais alto = melhor compra (Best Bid).

**Ask (Venda):** Ordens de participantes dispostos a vender. Ficam acima do preço atual. Preço mais baixo = melhor venda (Best Ask).

**Spread:** Diferença entre Best Ask e Best Bid. Representa o custo implícito de executar imediatamente. Spread menor = mercado mais líquido.

**Melhor Compra (Best Bid):** O preço mais alto que alguém está disposto a pagar agora.

**Melhor Venda (Best Ask):** O preço mais baixo que alguém está disposto a aceitar agora.

**Profundidade:** Quantos níveis de preço possuem ordens resting. Profundidade maior = mais liquidez disponível.

### 4.6. Prioridade por Preço

Ordens com melhor preço sempre têm prioridade absoluta:
- Para compra: preço mais ALTO tem prioridade (paga mais = quer mais)
- Para venda: preço mais BAIXO tem prioridade (aceita menos = quer vender logo)

### 4.7. Prioridade por Tempo (FIFO)

Entre ordens no MESMO preço, a que chegou PRIMEIRO é executada primeiro.

```
Nível 5.070,00 (Bid):
  Posição 1: BTG — 200 contratos (chegou 10:01:00) ← será executada primeiro
  Posição 2: XP  — 50 contratos  (chegou 10:01:05)
  Posição 3: Itaú — 100 contratos (chegou 10:01:12)
```

Se um vendedor agredir 250 contratos:
- BTG recebe 200 (preenchido totalmente — sai da fila)
- XP recebe 50 (preenchido totalmente — sai da fila)
- Itaú NÃO é atingido (sobrou 0 para ele)

### 4.8. Operações no DOM

**Inclusão:** Player adiciona ordem limitada → volume do nível aumenta → `book:update`

**Cancelamento:** Player retira ordem → volume diminui ou nível desaparece → `book:update`

**Alteração de tamanho:** Player modifica quantidade → volume muda → `book:update` (mantém posição na fila se diminuir; perde posição se aumentar — depende da bolsa)

**Reposicionamento:** Player cancela em um preço e coloca em outro → PERDE posição na fila do novo preço → dois `book:update`

### 4.9. DOM como ferramenta operacional

O SuperDOM do FlowTrainerPro será a principal ferramenta de interação do trader.

Através dele o usuário poderá:
- Enviar ordem limitada de compra (click no lado bid)
- Enviar ordem limitada de venda (click no lado ask)
- Enviar ordem a mercado (hotkey)
- Cancelar ordens existentes
- Arrastar ordens para outro preço (reposicionamento)
- Visualizar sua posição na fila

---

## 5. Matching Engine

### 5.1. O que é

O Matching Engine é o mecanismo central da Bolsa que cruza (casa) ordens de compra e venda quando existe compatibilidade de preço.

É o **único componente capaz de produzir execuções** (negócios realizados).

### 5.2. Como duas ordens são casadas

Um casamento (match) acontece quando:
- Existe uma ordem de compra com preço ≥ ao preço de uma ordem de venda

Ou seja: um comprador aceita pagar o que o vendedor quer receber (ou mais).

### 5.3. Quem agride e quem fornece liquidez

**Agressor:** O participante que envia uma ordem a mercado (ou ordem limitada que cruza imediatamente). Ele TOMA liquidez do book.

**Passivo:** O participante que tinha uma ordem limitada resting no book. Ele FORNECE liquidez.

A diferença é fundamental:
- Agressor paga o spread (custo de execução imediata)
- Passivo recebe o spread (recompensa por fornecer liquidez)

### 5.4. Como nasce uma execução

```
1. Ordem de mercado de COMPRA (100 contratos) chega ao MatchingEngine
2. MatchingEngine consulta o OrderBook: melhor ask = 5.071,00 (250 contratos)
3. No nível 5.071,00, a primeira ordem na fila pertence ao UBS (250 contratos)
4. Match: 100 contratos executados @ 5.071,00
5. Execution criada: { agressor: BTG, passivo: UBS, preço: 5.071,00, size: 100, side: buy }
6. OrderBook atualizado: UBS agora tem 150 contratos restantes neste nível
```

### 5.5. Como uma execução altera o Book

- A ordem passiva tem seu `remainingSize` reduzido pelo tamanho da execução.
- Se `remainingSize` chegar a zero, a ordem é removida da fila.
- Se o nível ficar completamente vazio, ele desaparece do book.
- O best ask (ou best bid) pode mudar se o melhor nível for consumido.

---

## 6. Execuções (Trades)

### 6.1. O que é um Trade

Um Trade é um negócio realizado. Representa a transferência efetiva de contratos entre dois participantes a um preço específico.

### 6.2. Como nasce

Um Trade nasce exclusivamente quando o MatchingEngine cruza uma ordem agressora contra uma ordem passiva. Não existe outra forma de gerar um Trade.

### 6.3. O que um Trade altera

| Componente | Como é alterado |
|------------|-----------------|
| **Last Price** | Atualiza para o preço da execução |
| **Times & Trades** | Nova linha adicionada com todos os dados do negócio |
| **Broker History** | Atualiza volumes de compra/venda da corretora agressora e passiva |
| **Volume Profile** | Acumula o tamanho da execução no nível de preço correspondente |
| **OrderBook** | Reduz ou remove a ordem passiva que foi consumida |
| **SuperDOM** | Reflete a mudança do book (menos liquidez no nível) |

### 6.4. Sem execução, nada muda

Se nenhum Trade é gerado:
- Last Price permanece o mesmo
- Times & Trades não recebe novas linhas
- Volume Profile não cresce
- Broker History não muda

O Book pode mudar milhares de vezes (ordens entrando e saindo) sem que nenhum Trade aconteça.

---

## 7. Formação do Preço

### 7.1. Como o preço sobe

O preço sobe quando um comprador agride (envia ordem a mercado de compra) e consome todas as ofertas de venda disponíveis no melhor nível.

```
Antes:
  Best Ask = 5.071,00 (80 contratos)
  Next Ask = 5.071,50 (150 contratos)

Comprador agride 80 contratos:
  → Execução @ 5.071,00 (nível zerado)
  → Last Price = 5.071,00
  → Best Ask agora = 5.071,50

Outro comprador agride 50:
  → Execução @ 5.071,50 (nível reduzido para 100)
  → Last Price = 5.071,50
```

### 7.2. Como o preço desce

Mesma lógica, mas com vendedores agredindo bids:
```
Vendedor agride → consome best bid → preço cai para o próximo nível
```

### 7.3. Consumo de múltiplos níveis

Quando a ordem agressora é maior que a liquidez do melhor nível, o MatchingEngine avança para o próximo nível:

```
Best Ask = 5.071,00 (80 contratos)
Next Ask = 5.071,50 (150 contratos)
Next Ask = 5.072,00 (200 contratos)

Comprador agride 400 contratos:
  → 80 @ 5.071,00 (nível zerado)
  → 150 @ 5.071,50 (nível zerado)
  → 170 @ 5.072,00 (nível reduzido para 30)
  → Last Price = 5.072,00

Deslocamento total: 1,00 ponto em uma única agressão.
```

### 7.4. O que NÃO move o preço

- Colocar uma ordem limitada grande (é apenas intenção)
- Cancelar ordens
- Reposicionar ordens
- Aumentar volume em um nível
- Qualquer mudança no book que não envolva cruzamento

---

## 8. Volume

### 8.1. O que é volume

Volume é a quantidade total de contratos que foram efetivamente negociados (executados) em um determinado período ou nível de preço.

### 8.2. Como é calculado

Volume = soma de todas as Executions.size em um intervalo.

Cada execução contribui uma vez para o volume. Se BTG compra 100 de UBS, o volume aumenta em 100 (não 200).

### 8.3. O que volume representa

- Atividade real de negociação
- Interesse confirmado (alguém pagou para executar)
- Liquidez que foi efetivamente transferida

### 8.4. O que volume NÃO representa

- Intenção (ordens resting não são volume)
- Interesse potencial (volume vem de execução, não de placement)
- Liquidez disponível (isso é o book, não o volume)

### 8.5. Diferenças críticas

| Conceito | Significado | Onde está |
|----------|-------------|-----------|
| Volume negociado | Contratos executados | Executions / TT |
| Liquidez disponível | Contratos oferecidos mas não executados | OrderBook / DOM |
| Quantidade no Book | Total de ordens resting em um nível | OrderBook / DOM |

Esses três conceitos JAMAIS devem ser confundidos no sistema.

---

## 9. Liquidez

### 9.1. Liquidez Passiva

Ordens limitadas resting no book. Estão disponíveis para serem consumidas por agressores.

- **Onde está:** OrderBook (DOM)
- **Quem fornece:** Players que colocam ordens limitadas
- **O que a remove:** Execuções (agressões consomem) ou cancelamentos

### 9.2. Liquidez Ativa

Ordens a mercado sendo enviadas. Estão ativamente consumindo liquidez passiva.

- **Onde está:** MatchingEngine (durante o processamento)
- **Quem fornece:** Players que enviam ordens a mercado
- **O que resulta:** Execuções

### 9.3. Liquidez Consumida

Quando um agressor executa contra ordens resting, essas ordens (parcial ou totalmente) são removidas do book.

- **Efeito no DOM:** Volume do nível diminui ou nível desaparece
- **Efeito no TT:** Nova execução registrada
- **Efeito no preço:** Se o nível inteiro for consumido, preço avança

### 9.4. Liquidez Adicionada

Quando um player coloca uma nova ordem limitada, ele está adicionando liquidez.

- **Efeito no DOM:** Volume do nível aumenta
- **Efeito no TT:** Nenhum
- **Efeito no preço:** Nenhum

### 9.5. Liquidez Removida (Cancelamento)

Quando um player cancela uma ordem, ele está removendo liquidez sem que ela tenha sido executada.

- **Efeito no DOM:** Volume diminui
- **Efeito no TT:** Nenhum
- **Efeito no preço:** Nenhum (mas torna o nível mais vulnerável a agressões futuras)

---

## 10. Agressões

### 10.1. Compra Agressora

Um participante envia uma ordem a mercado de **compra**. Ele cruza o spread e executa contra as ordens de venda resting (asks).

- **Agressor:** Comprador
- **Passivo:** Vendedores que tinham ordens limitadas
- **Efeito no book:** Asks perdem volume
- **Efeito no preço:** Sobe se o melhor nível for consumido
- **Registro no TT:** Lado agressor = COMPRA

### 10.2. Venda Agressora

Um participante envia uma ordem a mercado de **venda**. Ele cruza o spread e executa contra as ordens de compra resting (bids).

- **Agressor:** Vendedor
- **Passivo:** Compradores que tinham ordens limitadas
- **Efeito no book:** Bids perdem volume
- **Efeito no preço:** Desce se o melhor nível for consumido
- **Registro no TT:** Lado agressor = VENDA

### 10.3. Como surgem

Agressões surgem quando um participante decide que quer execução IMEDIATA e aceita pagar o spread por isso. Motivações típicas:
- Urgência (precisa de posição agora)
- Stop ativado (ordem condicional vira mercado)
- Momentum (quer entrar antes que o preço escape)
- Algorithmic sweep (executa grande volume rapidamente)

### 10.4. Como aparecem no Times & Trades

Cada execução gerada por uma agressão aparece como uma linha no TT:
```
10:15:01.234 | BTG | COMPRA | 5.071,00 | 120 contratos
```

### 10.5. Como afetam o Book

- Volume do nível consumido diminui
- Se o nível zerar, desaparece
- Spread pode aumentar se níveis intermediários forem consumidos
- Best Bid/Ask pode mudar

---

## 11. Times & Trades

### 11.1. O que mostra

O Times & Trades (TT) mostra exclusivamente negócios que foram realizados. Cada linha representa uma execução que efetivamente aconteceu.

### 11.2. O que NÃO mostra

- Ordens resting (intenções)
- Cancelamentos
- Ordens que não executaram
- Liquidez disponível

### 11.3. Como é alimentado

Exclusivamente pelo evento `trade:executed`. Cada Execution produzida pelo MatchingEngine gera uma linha no TT.

### 11.4. Informações registradas por linha

| Campo | Descrição |
|-------|-----------|
| Timestamp | Momento exato da execução |
| Preço | Nível de preço onde o negócio ocorreu |
| Quantidade | Número de contratos negociados |
| Lado Agressor | COMPRA ou VENDA (quem iniciou a agressão) |
| Corretora Compradora | Broker que ficou comprado |
| Corretora Vendedora | Broker que ficou vendido |

---

## 12. Broker History

### 12.1. Como registrar execuções por participante

O Broker History agrupa execuções por corretora, mostrando o volume comprado e vendido por cada uma.

### 12.2. Fonte de dados

Exclusivamente `trade:executed`. Para cada execução:
- A corretora agressora é registrada no lado correspondente à agressão
- A corretora passiva é registrada no lado oposto

### 12.3. O que NUNCA pode alimentar o Broker History

- Ordens resting (o fato de uma corretora ter ordens no book NÃO aparece aqui)
- Cancelamentos
- Intenções

O Broker History responde apenas: "Quem realmente comprou e vendeu?"

---

## 13. Volume Profile

### 13.1. Como acumula volume

O Volume Profile mantém um acumulador por nível de preço. A cada `trade:executed`, ele soma o `size` da execução ao nível de preço correspondente.

```
Execução: 100 @ 5.071,00 → volumeProfile[5071.00] += 100
Execução: 50 @ 5.071,00  → volumeProfile[5071.00] += 50
Total neste nível: 150
```

### 13.2. Como nasce uma ZIM

Uma ZIM (Zona de Intensa Negociação) surge quando um nível de preço acumula volume significativamente maior que seus vizinhos.

Critério: se o volume em um nível excede X% da média dos outros níveis, esse nível é marcado como zona de concentração.

### 13.3. Como identificar concentração

- **POC (Point of Control):** Nível com maior volume acumulado
- **VAH (Value Area High):** Limite superior da região com 70% do volume
- **VAL (Value Area Low):** Limite inferior dessa região
- **ZIM:** Faixa contínua de preços com volume anormalmente alto

### 13.4. Volume Profile representa HISTÓRICO

O VP mostra o que JÁ aconteceu. Não mostra o que está acontecendo agora (isso é TT) nem o que pode acontecer (isso é Book).

**Nunca utilizar ordens resting para formar Volume Profile.**

---

## 14. Eventos do Sistema

### 14.1. Lista de eventos fundamentais

| Evento | Publicado por | Consumido por |
|--------|--------------|---------------|
| `book:update` | OrderBookEngine | SuperDOM |
| `trade:executed` | MatchingEngine | Times & Trades, Volume Profile, Broker History, Last Price, FlowAnalysisEngine, Statistics |
| `price:updated` | Derivado de trade:executed | Header, painéis que mostram último preço |

### 14.2. Quem publica

- **OrderBookEngine** publica `book:update` em toda mutação (add, remove, reduce)
- **MatchingEngine** publica `trade:executed` em cada cruzamento

### 14.3. Quem consome

| Painel/Engine | Eventos que consome |
|---------------|-------------------|
| SuperDOM | `book:update` (e exclusivamente este) |
| Times & Trades | `trade:executed` |
| Volume Profile | `trade:executed` |
| Broker History | `trade:executed` |
| FlowAnalysisEngine | `trade:executed` + `book:update` |
| Last Price | `trade:executed` (preço da execução) |

---

## 15. Arquitetura Oficial do Fluxo

```
┌─────────────────────────────────────────────────────────┐
│              PLAYERS (decisões de participantes)          │
│  Institucional, Varejo, HFT, Estrangeiro                 │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
     Ordem Limitada              Ordem a Mercado
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────────┐
│   OrderBookEngine   │    │    MatchingEngine        │
│   (adiciona à fila) │    │    (cruza contra book)   │
└──────────┬──────────┘    └──────────┬──────────────┘
           │                          │
           │                          ├── Reduz/remove ordem do book
           │                          │
           ▼                          ▼
    ┌──────────────┐         ┌──────────────────┐
    │ book:update  │         │ trade:executed   │
    └──────┬───────┘         └────────┬─────────┘
           │                          │
           ▼                    ┌─────┼──────┬──────────┬──────────┐
     ┌──────────┐              ▼     ▼      ▼          ▼          ▼
     │ SuperDOM │         Times &  Volume  Broker    Last       Flow
     │ (DOM)    │         Trades   Profile History   Price    Analysis
     └──────────┘
```

---

## 16. Regras Fundamentais

Estas regras são obrigatórias e invioláveis:

1. O DOM jamais mostrará volume negociado. Mostra apenas ordens resting.
2. O Times & Trades jamais mostrará ordens resting. Mostra apenas execuções.
3. O Volume Profile jamais utilizará intenções. Acumula apenas execuções.
4. O preço somente muda através de execuções. Nunca por mudanças no book.
5. O Book pode mudar milhares de vezes sem alterar o Last Price.
6. Nenhum painel poderá assumir responsabilidades de outro.
7. Cada componente possuirá sua própria fonte de verdade conforme definido na Seção 14.
8. O MatchingEngine é o ÚNICO que produz execuções.
9. O OrderBookEngine é a ÚNICA fonte de verdade para ordens resting.
10. O trader obedece às mesmas regras que qualquer player (FIFO, sem privilégios).
11. Cancelar e recolocar ordem PERDE posição na fila.
12. O sistema deve permanecer estável com book vazio, agressões gigantes ou ausência de liquidez.

---

## 17. Conclusão

Este documento representa a especificação oficial da microestrutura de mercado para o FlowTrainerPro.

Toda implementação futura relacionada ao motor de mercado — incluindo OrderBook, MatchingEngine, geração de ordens, comportamento de players, visualização de dados e interação do usuário — deverá seguir obrigatoriamente as definições aqui estabelecidas.

Qualquer funcionalidade proposta que contradiga estas regras deve ser recusada ou redesenhada antes de ser implementada.

A fidelidade ao funcionamento real de uma Bolsa de Valores é o alicerce sobre o qual todo o FlowTrainerPro é construído.

---

*Documento criado em Julho de 2026.*
*Versão 2.0 — aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md*
