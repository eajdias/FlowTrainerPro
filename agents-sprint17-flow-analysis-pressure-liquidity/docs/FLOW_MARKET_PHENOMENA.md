# FLOW_MARKET_PHENOMENA.md
## Biblioteca Oficial de Fenômenos de Mercado

*Este documento cataloga todos os fenômenos que ocorrem dentro de um mercado financeiro. Cada fenômeno é tratado como entidade independente — sem atribuição a participantes específicos.*

*Quem CAUSA os fenômenos será documentado em `FLOW_PLAYER_LIBRARY.md`.*
*Como o simulador REPRODUZ os fenômenos será documentado em `FLOW_MARKET_BEHAVIOR_ENGINE.md`.*

*Subordinado a: `FLOWTRAINER_VISION.md`, `FLOW_MARKET_MICROSTRUCTURE.md`*

---

## Estrutura de cada fenômeno

```
Causa (o que provoca o fenômeno)
  ↓
Fenômeno (o evento em si — observável)
  ↓
Consequência (o que resulta do fenômeno)
```

Esses três conceitos jamais devem ser misturados.

---

## 1. Mercado Lateral

### Definição
Estado em que o preço oscila dentro de uma faixa definida sem direção predominante. Compradores e vendedores estão em equilíbrio temporário.

### Como nasce
Após um movimento direcional, o fluxo dominante perde intensidade. Nenhum lado possui convicção para forçar saída da faixa. Oferta e demanda se equivalem.

### Como evolui
O preço continua respeitando os limites superior (resistência) e inferior (suporte) do range. Volume pode diminuir progressivamente conforme a lateralização se prolonga. A faixa pode estreitar (contração) ou manter-se estável.

### Como termina
Termina quando um lado acumula convicção suficiente para consumir toda a liquidez na extremidade da faixa (rompimento). Ou quando um evento externo muda o equilíbrio.

### Sinais no DOM
- Book simétrico (volumes semelhantes em bids e asks)
- Spread estável e apertado
- Liquidez equilibrada nos extremos do range
- Ordens grandes nos limites (defesas)

### Sinais no Times & Trades
- Agressões alternadas sem dominância (compra/venda/compra/venda)
- Volume moderado sem aceleração
- Ausência de sequências longas em um único lado
- Lotes variados sem padrão

### Sinais no Broker History
- Nenhum broker domina significativamente
- Deltas próximos de zero para a maioria
- Atividade distribuída uniformemente

### Sinais no Volume Profile
- Volume se distribui uniformemente dentro da faixa
- POC central ou flutuante
- Formato horizontal do perfil

### Como influencia o preço
- Preço respeita limites definidos
- Tentativas de sair falham repetidamente
- Volatilidade reduzida dentro do range

### Como influencia a liquidez
- Liquidez se acumula nas extremidades (defesas naturais)
- Interior do range possui liquidez moderada
- Book permanece profundo e estável

### Como influencia o comportamento dos demais participantes
- Agressores perdem convicção
- Market makers prosperam (capturam spread)
- Participantes direcionais aguardam resolução

### Como o aluno deve interpretar
O mercado lateral é preparação. Não é o momento de operar com convicção direcional. O aluno deve esperar pela resolução e identificar sinais de qual lado vencerá.

### Erros comuns de interpretação
- Operar rompimentos dentro do range (falsos sinais)
- Ignorar que lateralização precede expansão
- Não perceber quando o range está estreitando (sinal de resolução iminente)

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: exaustão, pullback, reversão
- Pode GERAR: rompimento verdadeiro, falso rompimento, acumulação, distribuição
- Pode CONTER: absorção, defesa, busca por liquidez

### Exemplos práticos
- Mercado lateraliza entre 5.069,00 e 5.080,00 por 40 ticks antes de romper para cima
- Preço testa ambas extremidades 3 vezes sem sair da faixa

---

## 2. Acumulação

### Definição
Construção gradual de posição compradora por um ou mais participantes, sem deslocar o preço significativamente para cima.

### Como nasce
Um participante decide construir posição grande de forma discreta. Compra gradualmente — absorvendo vendas ou comprando na oferta — para não alertar o mercado.

### Como evolui
O preço permanece contido em faixa estreita. Volume de execuções é alto mas deslocamento é mínimo. Cada tentativa de queda é absorvida. A base de compradores cresce silenciosamente.

### Como termina
Quando o acumulador completou sua posição (ou grande parte dela), ele pode:
- Parar de absorver → mercado rompe naturalmente
- Agredir ativamente → provocar o rompimento
- Ou ser interrompido por fluxo contrário superior

### Sinais no DOM
- Bid defense repetida no mesmo nível ou faixa
- Volume no bid permanece estável apesar de agressões vendedoras
- Ordens de compra reaparecem imediatamente após serem consumidas

### Sinais no Times & Trades
- Alto volume executado com pouco deslocamento de preço
- Agressões vendedoras frequentes que NÃO conseguem mover o preço
- Repetição de mesma corretora no lado comprador (passivo)

### Sinais no Broker History
- Um broker acumula volume comprador crescente
- Delta positivo crescendo para broker específico enquanto preço permanece lateral

### Sinais no Volume Profile
- ZIM se formando em faixa estreita (muito volume, pouco deslocamento)
- POC fixo no mesmo nível por período prolongado

### Como influencia o preço
- Preço fica contido por baixo (suporte firme que se renova)
- Impede quedas apesar de pressão vendedora
- Após conclusão, tende a gerar movimento explosivo para cima

### Como influencia a liquidez
- Liquidez vendedora é continuamente absorvida
- Liquidez compradora se renova constantemente
- O book aparenta equilíbrio mas o fluxo real é direcional

### Como influencia o comportamento dos demais participantes
- Vendedores se frustram (agridem mas preço não cai)
- Compradores menores ganham confiança ao ver defesa
- Market makers ajustam posicionamento próximo ao nível de defesa

### Como o aluno deve interpretar
Acumulação é PREPARAÇÃO para movimento. Preço parado + volume alto = alguém está se posicionando. O movimento subsequente tende a ser na direção da acumulação.

### Erros comuns de interpretação
- Confundir lateralização sem volume com acumulação
- Não perceber que a acumulação JÁ terminou (entrar atrasado)
- Ignorar que acumulação pode falhar se fluxo contrário for superior

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: mercado lateral, pullback, queda anterior
- Pode GERAR: rompimento verdadeiro, expansão de volatilidade, tendência de alta
- COEXISTE com: absorção compradora, defesa de preço

### Exemplos práticos
- BTG absorve 5.000 contratos de venda entre 5.069 e 5.070 durante 2 minutos sem deixar o preço cair abaixo de 5.069
- Após completar, preço explode de 5.070 para 5.082

---

## 3. Distribuição

### Definição
Desmontagem gradual de posição compradora (venda) sem deslocar o preço significativamente para baixo. Espelho da acumulação.

### Como nasce
Um participante que já possui posição grande decide realizá-la. Vende gradualmente em rallies para obter melhor preço médio de saída.

### Como evolui
Preço permanece em faixa superior. Cada tentativa de alta é contida por vendas renovadas. Volume é alto mas preço não consegue fazer novas máximas consistentes.

### Como termina
Quando o distribuidor completou a venda, a sustentação artificial desaparece. O preço, sem suporte comprador, cai com força.

### Sinais no DOM
- Ordens de venda se renovam nos mesmos níveis superiores
- Cada rally encontra liquidez vendedora imediata
- Profundidade do ask permanece robusta apesar de compras

### Sinais no Times & Trades
- Compras agressoras que NÃO sustentam o preço acima
- Volume alto sem novas máximas
- Mesma corretora no lado vendedor (passivo) repetidamente

### Sinais no Broker History
- Broker acumulando volume vendedor enquanto preço fica estável ou sobe levemente
- Delta negativo crescente para broker específico

### Sinais no Volume Profile
- ZIM se formando em região de topo
- POC no topo ou levemente abaixo

### Como influencia o preço
- Preço fica contido por cima (resistência que se renova)
- Não faz novas máximas apesar de demanda aparente
- Após conclusão, queda tende a ser acentuada

### Como influencia a liquidez
- Liquidez compradora é continuamente absorvida
- Ask se repõe constantemente
- Aparência de equilíbrio mas fluxo real é vendedor

### Como influencia o comportamento dos demais participantes
- Compradores tardios ficam presos em topos
- Vendedores espertos percebem a distribuição e vendem junto
- Volume aparenta interesse comprador mas resultado é vendedor

### Como o aluno deve interpretar
Distribuição é o oposto da acumulação. Preço parado no topo + volume alto + incapacidade de fazer novas máximas = alguém está saindo. Cuidado com armadilhas compradoras.

### Erros comuns de interpretação
- Interpretar volume alto como interesse comprador (pode ser o distribuidor vendendo)
- Comprar porque "o preço está subindo" sem perceber a distribuição em andamento
- Não verificar QUEM está no lado vendedor

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: tendência de alta, rompimento, aceleração
- Pode GERAR: reversão, queda, falso rompimento para cima
- COEXISTE com: absorção vendedora, defesa de preço (no ask)

### Exemplos práticos
- Após alta até 5.085, o preço lateraliza entre 5.082-5.085 enquanto Goldman vende 8.000 contratos ao longo de 3 minutos
- Quando termina, preço cai de 5.082 para 5.070 em 30 segundos

---

## 4. Expansão de Volatilidade

### Definição
Momento em que a amplitude dos movimentos de preço aumenta significativamente. O mercado sai de um estado de calma (contração) para agitação (expansão).

### Como nasce
Energia acumulada durante período de baixa volatilidade é liberada por um catalisador: agressão institucional, cascata de stops, notícia, ou simplesmente quebra de equilíbrio.

### Como evolui
Deslocamentos de preço por tick aumentam. Volume explode. Book fica raso (participantes cancelam por medo). Spread alarga. Execuções acontecem em velocidade elevada.

### Como termina
Quando o impulso se esgota (exaustão) ou quando nova resistência/suporte é encontrada. O mercado eventualmente retorna a estado de menor volatilidade.

### Sinais no DOM
- Book fica raso rapidamente (ordens canceladas)
- Spread se alarga
- Liquidez passiva desaparece dos níveis próximos
- Renovação de liquidez cessa temporariamente

### Sinais no Times & Trades
- Volume explode (picos de execução)
- Frequência de trades dispara
- Lotes grandes em sequência rápida
- Dominância clara de um lado

### Sinais no Broker History
- Institucionais concentram agressões
- Volume desproporcional em poucos participantes

### Sinais no Volume Profile
- Formato vertical (pouco volume por nível, muitos níveis percorridos)
- Volume se distribui ao longo do deslocamento

### Como influencia o preço
- Múltiplos níveis consumidos rapidamente
- Deslocamento pode ser de vários pontos em segundos
- Spread pode triplicar momentaneamente

### Como influencia a liquidez
- Liquidez passiva foge (cancelamentos em massa)
- Apenas agressores permanecem ativos
- Book pode ficar momentaneamente vazio em um lado

### Como influencia o comportamento dos demais participantes
- Market makers se afastam (risco de inventário)
- Traders com stop são ativados em massa
- Novos participantes entram tarde (momentum)

### Como o aluno deve interpretar
Expansão é onde o dinheiro é feito — mas também perdido. O aluno deve estar posicionado ANTES da expansão (durante a contração). Correr atrás da expansão geralmente resulta em entrada tardia.

### Erros comuns de interpretação
- Entrar na expansão quando ela já está na fase de exaustão
- Confundir book raso com "mercado sem liquidez" (a liquidez está sendo consumida rapidamente)
- Não perceber quando a expansão está terminando

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: contração de volatilidade, acumulação, distribuição
- Pode GERAR: tendência, rompimento, exaustão
- É o OPOSTO de: contração de volatilidade

### Exemplos práticos
- Após 50 ticks de lateralização entre 5.069 e 5.071, BTG agride 2.000 lotes e o preço vai de 5.071 para 5.082 em 8 ticks

---

## 5. Contração de Volatilidade

### Definição
Redução progressiva da amplitude dos movimentos de preço. O mercado fica cada vez mais estreito e silencioso.

### Como nasce
Após movimento forte, participantes perdem convicção. Ninguém agride. Oferta e demanda se equilibram em faixa cada vez menor.

### Como evolui
Range estreita progressivamente. Volume diminui. Spread aperta. Book engorda (muita liquidez, pouca agressão). Atividade cai.

### Como termina
Contrações prolongadas SEMPRE precedem expansões. Quanto mais o mercado se comprime, mais violento tende a ser o rompimento subsequente.

### Sinais no DOM
- Book gordo em ambos os lados (muita liquidez resting)
- Spread no mínimo possível
- Defesas em ambos os lados
- Ordens grandes fixas sem serem consumidas

### Sinais no Times & Trades
- Volume diminuindo tick a tick
- Lotes cada vez menores
- Frequência reduzida
- Sem dominância de lado

### Sinais no Broker History
- Atividade reduzida para todos
- Market makers dominam (capturando spread em mercado calmo)

### Sinais no Volume Profile
- Volume se concentra em faixa mínima
- POC fixo

### Como influencia o preço
- Range estreita
- Deslocamento por tick mínimo
- Preço anda cada vez menos

### Como influencia a liquidez
- Liquidez se acumula (ninguém consome)
- Book profundo e estável
- Combustível para o rompimento futuro

### Como influencia o comportamento dos demais participantes
- Institucionais podem estar acumulando silenciosamente
- Traders impacientes saem de posição
- Market makers operam com margens mínimas

### Como o aluno deve interpretar
Contração é o momento de se preparar. O aluno deve identificar em qual direção a resolução provavelmente virá (analisar quem está acumulando durante a contração).

### Erros comuns de interpretação
- Achar que "mercado parado" significa "nada vai acontecer"
- Não perceber acumulação/distribuição ocorrendo dentro da contração
- Ser pego desprevenido pelo rompimento

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: expansão anterior, exaustão
- SEMPRE GERA: expansão de volatilidade (eventualmente)
- PODE CONTER: acumulação ou distribuição silenciosa

### Exemplos práticos
- Mercado oscila apenas 1 ponto (5.074,50 a 5.075,50) durante 20 ticks com volume decrescente
- No tick 21, explosão de compras leva preço a 5.082

---

## 6. Rompimento Verdadeiro

### Definição
Momento em que o preço ultrapassa definitivamente um nível que vinha contendo o mercado. A liquidez passiva naquele nível é completamente consumida e o preço se estabelece no novo patamar.

### Como nasce
Fluxo agressor supera a liquidez defensora no nível. Pode ser gradual (pressão crescente) ou explosivo (agressão massiva).

### Como evolui
Preço ultrapassa o nível. Liquidez acima/abaixo é consumida em sequência. Novos participantes entram na direção do rompimento (momentum). O preço se afasta do nível rompido.

### Como termina
Quando encontra nova resistência/suporte significativo. Ou quando o fluxo agressor exaure. O nível rompido frequentemente vira novo suporte/resistência (inversão de papel).

### Sinais no DOM
- Liquidez no nível de resistência/suporte sendo consumida rapidamente até zerar
- Book se reconstrói mais distante (novos níveis de defesa surgem adiante)
- Spread pode alargar momentaneamente

### Sinais no Times & Trades
- Sequência de agressões no mesmo lado (múltiplas execuções consecutivas)
- Volume por execução crescente
- Velocidade de execuções acelerando
- Lotes grandes dominando

### Sinais no Broker History
- Institucionais dominam o lado agressor durante o rompimento
- Volume concentrado em poucos brokers (coordenação)

### Sinais no Volume Profile
- Volume BAIXO na região do rompimento (preço passou rápido, poucos negociaram)
- Volume ALTO na região anterior (acumulação/distribuição)

### Como influencia o preço
- Deslocamento rápido e decisivo
- Múltiplos níveis consumidos
- Novo patamar de preço estabelecido

### Como influencia a liquidez
- Liquidez defensora é destruída
- Nova liquidez se forma nos novos níveis
- Liquidez no nível rompido desaparece ou inverte função

### Como influencia o comportamento dos demais participantes
- Stops do lado oposto são ativados (combustível)
- Momentum traders entram na direção
- Participantes que defendiam o nível reconhecem a derrota

### Como o aluno deve interpretar
Rompimento genuíno possui: volume, velocidade, participação institucional e AUSÊNCIA de retorno rápido. Se o preço rompe e não volta — é real.

### Erros comuns de interpretação
- Confundir qualquer ultrapassagem de nível com rompimento (pode ser falso)
- Entrar no rompimento sem verificar volume e velocidade
- Não esperar a confirmação (pelo menos 2-3 ticks além do nível)

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: acumulação, contração de volatilidade, buildup de pressão
- Pode GERAR: tendência, expansão, continuação
- É diferente de: falso rompimento (que reverte)

### Exemplos práticos
- Resistência em 5.080 com 600 contratos. BTG agride 1.200. Nível zerado. Preço vai a 5.083 e não volta. Rompimento confirmado.

---

## 7. Falso Rompimento

### Definição
O preço ultrapassa momentaneamente um nível importante mas NÃO sustenta. Reverte rapidamente para dentro da faixa anterior. Armadilha para quem entrou no rompimento.

### Como nasce
Pode ser intencional (busca por liquidez/stops) ou orgânico (fluxo insuficiente para sustentar). O preço atinge uma zona de stops, ativa-os, e agressores na direção oposta dominam.

### Como evolui
Ultrapassagem rápida do nível → ativação de stops → reversão agressiva → preço retorna ao range. O falso rompimento frequentemente atinge apenas 1-3 ticks além do nível antes de reverter.

### Como termina
Quando o preço se estabiliza de volta dentro da faixa anterior. Os participantes que entraram no "rompimento" estão presos — gerando combustível para o movimento oposto.

### Sinais no DOM
- Nível rompido se reconstrói RAPIDAMENTE (liquidez volta)
- Agressões na direção oposta surgem imediatamente após a ultrapassagem
- Book se fortalece do lado da reversão

### Sinais no Times & Trades
- Poucas execuções além do nível (passou rápido, volume baixo)
- Volume de REVERSÃO superior ao volume do rompimento
- Velocidade da reversão maior que a do rompimento

### Sinais no Broker History
- O broker que "rompeu" operou volume pequeno
- Institucionais aparecem na DIREÇÃO OPOSTA após o falso rompimento

### Sinais no Volume Profile
- Volume mínimo na região além do nível (ninguém negociou lá sustentadamente)
- Volume concentrado na reversão

### Como influencia o preço
- Ida e volta rápida
- Preço ultrapassa → ativa stops → retorna
- Resultado: extensão momentânea seguida de retorno completo

### Como influencia a liquidez
- Stops são consumidos (liquidez removida)
- Nova liquidez aparece na direção da reversão
- O nível rompido se torna mais forte (quem estava ali foi confirmado)

### Como influencia o comportamento dos demais participantes
- Quem entrou no rompimento fica preso → será stop futuramente (mais combustível)
- Quem reconhece o falso rompimento entra na reversão com confiança
- Defensor do nível é recompensado

### Como o aluno deve interpretar
Se o preço rompe com POUCO volume, POUCA velocidade e reverte RÁPIDO — é falso. O aluno deve verificar: quem agrediu? Com quanto? E o que aconteceu nos 3 ticks seguintes?

### Erros comuns de interpretação
- Entrar cegamente em todo rompimento sem validar
- Não ter stop adequado para caso de falso rompimento
- Não perceber que o falso rompimento gera oportunidade na DIREÇÃO OPOSTA

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: mercado lateral, busca por liquidez
- Pode GERAR: reversão, continuação da lateralização, movement trap
- É diferente de: rompimento verdadeiro (que não volta)

### Exemplos práticos
- Preço rompe 5.080 atingindo 5.081. Apenas 80 contratos executados acima. Imediatamente Goldman vende 1.500 contratos. Preço volta a 5.076 em 5 ticks.

---

## 8. Pullback

### Definição
Correção temporária dentro de uma tendência ativa. O preço retrocede parcialmente antes de retomar a direção original. É a "respiração" natural do movimento.

### Como nasce
Participantes que lucraram realizam parcialmente (profit taking). Ou contrapartes tentam reverter com fluxo insuficiente. Ou liquidez se esgota momentaneamente.

### Como evolui
Retrocesso parcial (tipicamente 30-60% do impulso). Volume do pullback é INFERIOR ao do impulso original. Defesas reaparecem na direção da tendência.

### Como termina
Quando fluxo na direção original retorna. Novas agressões resumem a tendência. O pullback é absorvido e o preço retoma.

### Sinais no DOM
- Defesas reaparecem na direção da tendência durante o pullback
- Agressões do pullback são de lotes menores
- Book se reconstrói no lado da tendência

### Sinais no Times & Trades
- Volume do pullback inferior ao do impulso
- Lotes menores e menos frequentes
- Participantes menores dominam o pullback (varejo)

### Sinais no Broker History
- Institucionais PAUSAM durante pullback (não agridem)
- Varejo domina o fluxo contrário (sinal de fraqueza do pullback)

### Sinais no Volume Profile
- Pouco volume na região do pullback (preço corrigiu rápido)
- Volume concentrado no nível onde pullback para (nova defesa)

### Como influencia o preço
- Retrocesso parcial (NÃO retorna ao início do movimento)
- Novas mínimas/máximas mais altas/baixas que as anteriores mantidas

### Como influencia a liquidez
- Liquidez retorna gradualmente na direção da tendência
- Nível onde pullback para vira novo suporte/resistência

### Como influencia o comportamento dos demais participantes
- Traders tendenciais usam como oportunidade de entrada
- Contra-tendência percebe que não possui fluxo para reverter

### Como o aluno deve interpretar
Pullback é a melhor oportunidade de entrada em uma tendência. Mas o aluno deve verificar: o pullback tem volume significativo? Se não, a tendência provavelmente continua.

### Erros comuns de interpretação
- Confundir pullback com reversão (olhar volume e participantes)
- Entrar antes do pullback terminar (sem esperar confirmação de retomada)
- Ignorar pullbacks e entrar apenas em rompimentos (perde as melhores entradas)

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: rompimento, expansão, impulso
- Pode GERAR: continuação de tendência, nova onda impulsiva
- É diferente de: reversão (que NÃO retoma)

### Exemplos práticos
- Alta de 5.069 a 5.080 (impulso). Pullback até 5.076 com metade do volume. Retomada para 5.085.

---

## 9. Throwback

### Definição
Retorno do preço ao nível exato onde ocorreu o rompimento, para "testar" se o nível agora funciona como novo suporte (em alta) ou nova resistência (em baixa). É o teste de confirmação do rompimento.

### Como nasce
Após um rompimento, participantes que perderam a entrada ou que duvidam do rompimento testam o nível. O preço retorna ao ponto de quebra.

### Como evolui
Preço volta ao nível rompido. Se há defesa (o nível agora funciona como suporte/resistência), o preço é rejeitado e retoma a direção do rompimento. Se NÃO há defesa, o rompimento falhou.

### Como termina
- Teste bem-sucedido: preço rejeita no nível e retoma → confirmação do rompimento
- Teste falho: preço atravessa de volta → era falso rompimento

### Sinais no DOM
- Ao retornar ao nível, defesas aparecem (suporte que antes era resistência)
- Se defesa ausente: nível perdeu importância

### Sinais no Times & Trades
- Volume no throwback comparado ao volume do rompimento
- Se volume do throwback é MENOR: teste saudável, tendência continua
- Se volume do throwback é MAIOR: perigo, pode reverter

### Sinais no Broker History
- Broker que rompeu pode estar defendendo o nível agora (inversão de papel)

### Sinais no Volume Profile
- Volume do rompimento visível como concentração anterior
- Volume do throwback adicionando ao mesmo nível

### Como influencia o preço
- Retorno temporário ao nível → rejeição → retomada da tendência
- Ou: retorno → ultrapassagem → rompimento foi falso

### Como influencia a liquidez
- Se teste bem-sucedido: liquidez se acumula NO nível (confirmação)
- Se teste falho: liquidez se esgota (nível perdeu função)

### Como influencia o comportamento dos demais participantes
- Traders que perderam entrada no rompimento usam throwback como segunda chance
- Quem ficou contra o rompimento testa se o nível volta a funcionar como defesa

### Como o aluno deve interpretar
Throwback é a segunda chance de entrada. Se o nível rompido agora funciona como suporte/resistência → rompimento confirmado. Se não → saída imediata.

### Erros comuns de interpretação
- Entrar no throwback sem verificar se há defesa ativa
- Confundir throwback com reversão completa
- Não perceber que throwback com volume alto é sinal de perigo

### Relação com outros fenômenos
- SEMPRE precedido por: rompimento
- Pode GERAR: continuação de tendência (se teste OK) ou reversão (se teste falha)
- É diferente de: pullback (que não necessariamente retorna ao nível de rompimento)

### Exemplos práticos
- Rompimento em 5.080 com alta até 5.085. Preço volta a 5.080. Defesa ativa com 300 lotes. Preço sobe para 5.088. Throwback confirmado.

---

## 10. Absorção Compradora

### Definição
Fenômeno em que agressões vendedoras são absorvidas por comprador(es) passivo(s) sem que o preço caia. Enorme volume é executado mas o preço permanece estável ou sobe levemente.

### Como nasce
Comprador(es) com grande interesse posiciona(m) ordens limitadas que se renovam, consumindo toda a pressão vendedora.

### Como evolui
Vendedores agridem repetidamente. Volume de execuções é enorme. O preço NÃO cai (ou cai mínimamente). Vendedores se frustram e eventualmente param.

### Como termina
Quando vendedores desistem (exaurem). Nesse momento, o comprador que absorveu tem posição construída e o preço tende a subir sem oposição.

### Sinais no DOM
- Volume no bid permanece estável ou CRESCE apesar de agressões
- Nível de defesa nunca é zerado completamente
- Ordens se renovam imediatamente após serem consumidas

### Sinais no Times & Trades
- Volume ALTÍSSIMO de execuções no mesmo preço
- Lado agressor = VENDA mas preço NÃO desce
- Mesma corretora aparecendo como passiva múltiplas vezes

### Sinais no Broker History
- Um broker acumula volume comprador imenso
- Desproporção: muita agressão vendedora → zero deslocamento

### Sinais no Volume Profile
- ZIM exata no nível de absorção (muito volume, zero deslocamento)

### Como influencia o preço
- Trava o preço. Impede queda apesar de volume.
- Após conclusão: alta explosiva.

### Como influencia a liquidez
- Liquidez compradora é "infinita" (se renova)
- Liquidez vendedora é consumida progressivamente

### Como influencia o comportamento dos demais participantes
- Vendedores perdem confiança progressivamente
- Compradores menores ganham coragem ao ver defesa

### Como o aluno deve interpretar
Absorção compradora = sinal forte de alta futura. Volume enorme + preço parado + defesa renovada = alguém grande comprando tudo que vendem.

### Erros comuns de interpretação
- Interpretar volume vendedor alto como "sinal de venda" (é o oposto!)
- Não perceber a absorção e vender junto (será stop)
- Entrar cedo demais (antes da absorção confirmar)

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: queda anterior, mercado lateral, pullback
- Pode GERAR: rompimento para cima, tendência de alta, expansão
- COEXISTE com: defesa de preço, acumulação

### Exemplos práticos
- 3.000 contratos vendidos agressivamente em 5.069. Bid de 5.069 absorve tudo. Preço não cai de 5.069. Após 30 segundos de absorção, preço dispara para 5.078.

---

## 11. Absorção Vendedora

Espelho exato da Absorção Compradora, com direção invertida.

### Definição
Agressões compradoras são absorvidas por vendedor(es) passivo(s) sem que o preço suba.

### Como nasce
Vendedor(es) com grande interesse absorve(m) toda demanda compradora.

### Sinais
Todos iguais à Absorção Compradora, porém invertidos:
- Volume no ASK que não zera
- Agressões compradoras que NÃO movem o preço para cima
- Mesma corretora no lado vendedor passivo

### Resultado típico
Após exaustão dos compradores → preço despenca.

---

## 12. Exaustão Compradora

### Definição
Perda progressiva de intensidade do fluxo comprador. O preço continua tentando subir mas cada tentativa é mais fraca que a anterior.

### Como nasce
Os compradores que sustentavam a alta já completaram suas posições. Novos compradores são cada vez menores e menos frequentes. O impulso morre gradualmente.

### Como evolui
Volume por execução diminui. Frequência de agressões compradoras reduz. Deslocamento por tick fica menor. Os últimos compradores são varejo entrando atrasado.

### Como termina
Quando as agressões compradoras cessam completamente, vendedores percebem a fraqueza e iniciam pressão contrária. Reversão ou pullback significativo se segue.

### Sinais no DOM
- Agressões compradoras diminuem em tamanho
- Liquidez vendedora (asks) começa a crescer sem ser consumida
- Spread pode alargar (compradores desistem de cruzar)

### Sinais no Times & Trades
- Lotes cada vez menores no lado comprador
- Frequência desacelerando
- Participantes menores dominando as últimas compras

### Sinais no Broker History
- Institucionais param de comprar
- Varejo domina o fluxo comprador (sinal clássico de topo)

### Sinais no Volume Profile
- Volume decrescente nos últimos preços atingidos
- Extensão fina no extremo superior do perfil

### Como influencia o preço
- Desaceleração do movimento de alta
- Preço pode ficar "pendurado" sem sustentação
- Máximas marginais (cada nova máxima é mínima acima da anterior)

### Como influencia a liquidez
- Liquidez compradora se esgota
- Liquidez vendedora começa a se acumular
- Transição de domínio iminente

### Como influencia o comportamento dos demais participantes
- Vendedores ganham confiança
- Market makers começam a posicionar asks mais agressivos
- Compradores tardios ficam presos

### Como o aluno deve interpretar
Quem está comprando AGORA? Se são lotes pequenos de varejo — o movimento acabou. O aluno deve observar a QUALIDADE do fluxo, não apenas a direção.

### Erros comuns de interpretação
- Comprar na exaustão achando que "a tendência vai continuar"
- Não perceber que lotes pequenos = varejo atrasado = fim do movimento
- Ignorar a desaceleração progressiva

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: expansão, tendência de alta, rompimento
- Pode GERAR: pullback, reversão, lateralização
- É OPOSTO de: aceleração

### Exemplos práticos
- Após alta de 5.069 a 5.083 com lotes de 200-500, os últimos 2 pontos foram feitos com lotes de 10-30. Exaustão. Pullback para 5.078 se segue.

---

## 13. Exaustão Vendedora

Espelho da Exaustão Compradora com direção invertida.

### Definição
Perda progressiva de intensidade do fluxo vendedor. Preço tenta cair mas cada tentativa é mais fraca.

### Resultado típico
Compradores percebem fraqueza → agressão compradora → reversão para cima.

---

## 14. Defesa de Preço

### Definição
Comportamento repetido de renovação de liquidez passiva em um nível específico, impedindo que o preço o ultrapasse.

### Como nasce
Participante com interesse estratégico posiciona ordens renovadas continuamente para "segurar" o preço em um limite.

### Como evolui
Nível é parcialmente consumido mas se recompõe imediatamente. Pode durar dezenas de ticks. Agressores tentam quebrar mas falham repetidamente.

### Como termina
- Defensor atinge seu objetivo e retira → preço avança
- Agressor acumula fluxo suficiente para quebrar → rompimento
- Empate → lateralização

### Sinais completos
Todos já documentados na absorção/acumulação — defesa é o mecanismo comum a ambos.

### Relação com outros fenômenos
- COEXISTE com: absorção, acumulação, distribuição
- Pode GERAR: rompimento (se quebrada), lateralização (se mantida)

---

## 15. Perda de Liquidez

### Definição
Situação em que um lado do book perde profundidade significativa em pouco tempo. Participantes cancelam ordens por medo ou posicionamento.

### Como nasce
Medo (book assimétrico aparece → participantes fogem). Ou consumo real (agressão consome múltiplos níveis).

### Sinais no DOM
- Vários níveis desaparecem simultaneamente
- Book fica assimétrico (um lado gordo, outro raso)
- Spread alarga significativamente

### Resultado
- Preço se move facilmente na direção da liquidez ausente
- Deslocamento pode ser desproporcional ao volume que causou

### Relação com outros fenômenos
- Pode ser PRECEDIDO por: agressão grande, medo coletivo
- Pode GERAR: expansion de volatilidade, rompimento, flash move

---

## 16. Busca por Liquidez

### Definição
Movimento deliberado de preço até uma região onde se sabe que existem stops ou ordens condicionadas. Objetivo: executar contra essa liquidez e possivelmente reverter.

### Sinais
- Movimento rápido até zona óbvia de stops
- Volume baixo na ida (sem interesse genuíno)
- Stops ativados (explosão de volume pontual)
- Reversão imediata após atingir a zona

### Relação com outros fenômenos
- Frequentemente causa: falso rompimento
- Pode ser seguido por: reversão, continuação na direção oposta

---

## 17. Rejeição de Preço

### Definição
O preço atinge um nível e é imediatamente empurrado de volta. Indica interesse forte em NÃO permitir que o preço permaneça naquela região.

### Sinais
- Poucas execuções no nível rejeitado
- Agressão oposta imediata e com volume
- Book se fortalece contra a direção rejeitada

### Relação com outros fenômenos
- Pode CONFIRMAR: suporte/resistência, defesa de preço
- Pode GERAR: reversão, throwback confirmado

---

## 18. Aceitação de Preço

### Definição
O preço atinge um novo nível e PERMANECE ali. O mercado "aceita" o novo patamar. Diferente de rejeição — aqui não há pressão para voltar.

### Sinais
- Negócios acontecem no novo nível de forma sustentada
- Volume se acumula (VP cresce no novo preço)
- Book se reconstrói normalmente ao redor do novo preço

### Relação com outros fenômenos
- CONFIRMA: rompimento verdadeiro
- É OPOSTO de: rejeição

---

## 19. Mudança de Contexto

### Definição
Transição fundamental no caráter do mercado. O que era tendência vira lateralização. O que era comprador dominante vira vendedor dominante. O regime muda.

### Sinais
- Lado agressor dominante inverte
- Estrutura do book muda (de assimétrico para simétrico ou vice-versa)
- POC do VP começa a migrar
- Delta muda de sinal para brokers dominantes

### Relação com outros fenômenos
- PRECEDIDO por: exaustão, absorção, clímax
- GERA: novo regime (tendência oposta, lateralização, nova dinâmica)

---

## 20. Continuação de Tendência

### Definição
Após pausa (pullback, lateralização breve), o mercado retoma a direção anterior com fluxo renovado.

### Sinais
- Mesmo lado agressor retorna dominante
- Volume retorna aos níveis do impulso anterior
- Defesas na direção da tendência permanecem intactas

### Relação com outros fenômenos
- PRECEDIDO por: pullback, throwback, pausa
- CONFIRMA: tendência ativa permanece válida

---

## 21. Reversão

### Definição
Mudança definitiva de direção. O que era alta vira baixa (ou vice-versa). NÃO é temporário — é uma mudança de regime.

### Sinais
- Exaustão completa do lado que dominava
- Absorção do lado oposto
- Rompimento de suporte/resistência na nova direção
- Delta inverte para brokers dominantes

### Relação com outros fenômenos
- PRECEDIDO por: exaustão, distribuição/acumulação do lado oposto
- GERA: nova tendência na direção oposta

---

## 22. Aceleração

### Definição
Aumento da velocidade e intensidade do movimento direcional em curso. O mercado que já estava andando passa a andar MAIS rápido.

### Sinais
- Volume por tick aumenta
- Deslocamento por tick aumenta
- Novos participantes entram no lado dominante
- Stops do lado oposto sendo ativados em cascata

### Relação com outros fenômenos
- PRECEDIDO por: rompimento, continuação
- Pode GERAR: exaustão (quando aceleração não se sustenta)

---

## 23. Desaceleração

### Definição
Redução da velocidade e intensidade do movimento em curso. O mercado ainda anda na mesma direção mas cada vez mais devagar.

### Sinais
- Volume por tick diminui
- Deslocamento reduz progressivamente
- Participantes dominantes param de agredir
- Contraparte começa a aparecer

### Relação com outros fenômenos
- PRECEDIDO por: expansão, aceleração
- Pode GERAR: pullback, lateralização, exaustão, reversão

---

## 24. Mapa de Relações entre Fenômenos

```
CONTRAÇÃO DE VOLATILIDADE
  ↓ (energia acumulada)
ACUMULAÇÃO ou DISTRIBUIÇÃO (silenciosa)
  ↓ (posição construída)
EXPANSÃO DE VOLATILIDADE
  ↓
ROMPIMENTO VERDADEIRO
  ├── ACELERAÇÃO → EXAUSTÃO → PULLBACK → CONTINUAÇÃO
  ├── THROWBACK (teste) → CONFIRMAÇÃO → TENDÊNCIA
  └── ou FALSO ROMPIMENTO → REVERSÃO

MERCADO LATERAL
  ├── pode conter ABSORÇÃO + DEFESA (acumulação em andamento)
  ├── pode conter DISTRIBUIÇÃO (venda silenciosa)
  └── resolve em: ROMPIMENTO ou continua lateral

ABSORÇÃO
  ↓ (agressor exaure)
ROMPIMENTO na direção do absorvedor
  ↓
TENDÊNCIA

EXAUSTÃO
  ↓ (fluxo seca)
PULLBACK ou REVERSÃO ou LATERALIZAÇÃO

BUSCA POR LIQUIDEZ
  ↓ (stops ativados)
FALSO ROMPIMENTO
  ↓
REVERSÃO

DEFESA DE PREÇO
  ├── MANTIDA → preço respeita nível → LATERALIZAÇÃO
  └── QUEBRADA → ROMPIMENTO

PULLBACK
  ↓ (fluxo retorna)
CONTINUAÇÃO DE TENDÊNCIA

MUDANÇA DE CONTEXTO
  ↓ (novo regime)
NOVA TENDÊNCIA ou LATERALIZAÇÃO
```

---

## 25. Conclusão

Este documento catalogou 23 fenômenos de mercado como entidades independentes. Cada um possui causas, evolução, término e assinaturas observáveis em cada ferramenta.

O mapa de relações (Seção 24) demonstra como os fenômenos se conectam — um pode gerar, preceder ou coexistir com outro.

O FlowTrainerPro deverá ser capaz de reproduzir TODOS esses fenômenos de forma realista, emergindo naturalmente do comportamento dos participantes (documentados em `FLOW_PLAYER_LIBRARY.md`).

---

*Documento criado em Julho de 2026.*
*Versão 1.0 — aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md, FLOW_MARKET_MICROSTRUCTURE.md*
