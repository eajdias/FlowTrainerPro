# FLOW_MARKET_DYNAMICS.md
## Fenômenos Naturais da Microestrutura de Mercado

*Este documento descreve os fenômenos que emergem naturalmente do funcionamento de uma Bolsa de Valores. São eventos observáveis que surgem da interação entre participantes — independentemente de quem os produz.*

*Subordinado a: `FLOWTRAINER_VISION.md` e `FLOW_MARKET_MICROSTRUCTURE.md`*

---

## Propósito

A microestrutura explica COMO a Bolsa funciona.
Este documento explica O QUE acontece dentro dela.

Cada fenômeno descrito aqui é independente dos participantes que o produzem. Um rompimento pode ser causado por um institucional, por um algoritmo ou por uma cascata de stops. O fenômeno é o mesmo — a causa pode variar.

O detalhamento de QUEM produz cada fenômeno ficará para `FLOW_PLAYER_LIBRARY.md`.

---

## 1. Acumulação

### O que é
Período em que um ou mais participantes constroem uma posição grande de forma gradual, sem deslocar o preço significativamente. O preço permanece em uma faixa estreita enquanto volume é absorvido silenciosamente.

### Como surge
Um player com objetivo de posição grande não pode comprar tudo de uma vez (moveria o preço contra si). Ele fragmenta suas compras ao longo do tempo, comprando na oferta (passivamente) ou agredindo lotes pequenos.

### Sinais no DOM
- Ordens de compra reaparecem no mesmo nível repetidamente (defesa)
- Volume no bid permanece estável ou cresce apesar de agressões vendedoras
- Spread permanece apertado (há liquidez sendo fornecida)

### Sinais no Times & Trades
- Volume de execução elevado porém preço praticamente estático
- Agressões vendedoras frequentes que NÃO deslocam o preço
- Repetição de uma mesma corretora no lado comprador

### Sinais no Broker History
- Uma corretora acumula volume comprador consistente sem que o preço caia
- Delta positivo crescendo para um broker específico

### Sinais no Volume Profile
- Concentração de volume em uma faixa estreita (ZIM se formando)
- POC estável no mesmo nível por período prolongado

### Impacto na formação do preço
- Preço fica contido em uma faixa (suporte firme)
- Quando a acumulação termina, tende a haver um movimento direcional forte (rompimento)

### Interpretação para o aluno
Acumulação indica que alguém está construindo posição com paciência. O preço não se move agora, mas quando esse player terminar de acumular, o movimento tende a ser explosivo na direção da acumulação.

---

## 2. Distribuição

### O que é
O oposto da acumulação. Um participante que já possui posição grande está vendendo gradualmente sem deslocar o preço para baixo prematuramente.

### Como surge
O player precisa desfazer uma posição grande. Se vender tudo de uma vez, o preço despenca antes de completar a venda. Então distribui ao longo do tempo, vendendo em rallies.

### Sinais no DOM
- Ordens de venda reaparecem consistentemente nos mesmos níveis superiores
- Bids são consumidos mas asks se repõem rapidamente
- Profundidade do ask permanece robusta apesar de compras

### Sinais no Times & Trades
- Agressões compradoras que não sustentam o preço acima
- Volume alto com preço que não consegue fazer novas máximas
- Mesma corretora aparecendo repetidamente no lado vendedor

### Sinais no Broker History
- Um broker acumulando volume vendedor enquanto preço permanece estável ou sobe levemente
- Delta negativo crescente para um broker específico

### Sinais no Volume Profile
- Volume se concentra em uma faixa superior (topo)
- POC se forma no topo do range

### Impacto na formação do preço
- Preço fica contido por cima (resistência firme)
- Quando a distribuição termina, tende a haver queda acentuada

### Interpretação para o aluno
Distribuição é o espelho da acumulação. Alguém está saindo da posição com cuidado. O preço parece forte mas na verdade está sendo sustentado artificialmente enquanto o player descarrega.

---

## 3. Rompimento (Breakout)

### O que é
Momento em que o preço ultrapassa um nível de suporte ou resistência que vinha contendo o mercado. Representa uma mudança de equilíbrio — um lado venceu.

### Como surge
A liquidez passiva em um nível é completamente consumida por agressões. Quando o nível zera, o preço avança para o próximo, gerando deslocamento.

### Sinais no DOM
- Liquidez no nível de resistência/suporte sendo consumida rapidamente
- Novos níveis de ask/bid aparecendo mais distantes (book se afastando)
- Spread se alargando momentaneamente durante o rompimento

### Sinais no Times & Trades
- Concentração de agressões em uma direção (múltiplas execuções consecutivas no mesmo lado)
- Volume por execução aumentando (lotes grandes agredindo)
- Velocidade de execuções acelerando

### Sinais no Broker History
- Brokers institucionais dominando o lado agressor
- Volume concentrado em poucos participantes (coordenação)

### Sinais no Volume Profile
- Volume baixo na região do rompimento (preço passou rápido)
- Volume alto na região anterior (onde o mercado ficou parado antes do rompimento)

### Impacto na formação do preço
- Deslocamento rápido de preço
- Múltiplos níveis consumidos em sequência
- Novo best bid/ask se forma significativamente distante do anterior

### Interpretação para o aluno
Rompimento genuíno é acompanhado por FLUXO real (volume, velocidade, participação institucional). O aluno deve confirmar que há demanda real por trás do movimento — não apenas ausência de liquidez.

---

## 4. Falso Rompimento (False Breakout)

### O que é
O preço ultrapassa momentaneamente um nível importante mas NÃO sustenta. Reverte rapidamente para dentro da faixa anterior. É uma armadilha que captura participantes que entraram no rompimento.

### Como surge
Pode ocorrer por:
- Busca deliberada por stops posicionados além do nível
- Liquidez insuficiente para sustentar o novo preço
- Player institucional usando o rompimento para executar ordens na direção oposta

### Sinais no DOM
- Liquidez desaparece no nível rompido mas reaparece rapidamente
- Book do lado oposto se reconstrói agressivamente após o rompimento
- Novas ordens grandes surgem contra a direção do rompimento

### Sinais no Times & Trades
- Agressões iniciais na direção do rompimento seguidas por agressões MAIORES na direção oposta
- Volume de continuação fraco (poucas execuções após o rompimento)
- Reversão com velocidade maior que o próprio rompimento

### Sinais no Broker History
- Broker que iniciou o rompimento opera volume pequeno
- Brokers institucionais aparecem na direção oposta após o falso rompimento

### Sinais no Volume Profile
- Volume mínimo na região além do nível rompido (preço passou mas ninguém negociou lá)
- Volume alto na reversão

### Impacto na formação do preço
- Ida e volta rápida. Preço ultrapassa, ativa stops, e retorna.
- O resultado é uma extensão momentânea seguida de retorno ao range.

### Interpretação para o aluno
Nem todo rompimento é real. O aluno deve verificar se existe FLUXO sustentando o novo preço. Se o volume seca após o rompimento e agressões surgem na direção oposta, provavelmente é falso.

---

## 5. Absorção

### O que é
Fenômeno em que um participante passivo absorve grande volume de agressões sem permitir que o preço se mova. O agressor está atacando mas o preço NÃO anda porque alguém está fornecendo liquidez infinita (ou quase) naquele nível.

### Como surge
Um player com grande interesse em comprar/vender coloca ordens limitadas que se renovam automaticamente (ou manualmente) no mesmo preço, absorvendo todas as agressões contrárias.

### Sinais no DOM
- Volume no nível absorvedor permanece estável ou CRESCE apesar de agressões contínuas
- O nível nunca é zerado — ordens reaparecem imediatamente
- Pode existir renovação visível (volume diminui e volta instantaneamente)

### Sinais no Times & Trades
- Enorme volume de execuções no mesmo preço
- Muitas agressões em uma direção que não deslocam o preço
- Uma mesma corretora aparecendo repetidamente como passiva

### Sinais no Broker History
- Um broker acumulando volume imenso na direção passiva
- Desproporção entre agressão e resultado (muita agressão, zero deslocamento)

### Sinais no Volume Profile
- ZIM se formando exatamente no nível da absorção
- POC tendendo a fixar neste preço

### Impacto na formação do preço
- Preço fica travado. Não importa quanta agressão aconteça, ele não anda.
- Quando o agressor desiste (exaure), o preço tende a mover na direção do absorvedor.

### Interpretação para o aluno
Absorção é um dos sinais mais poderosos de Order Flow. Indica que existe um participante com convicção forte defendendo um nível. Quando a absorção termina, geralmente há movimento explosivo na direção oposta às agressões.

---

## 6. Exaustão

### O que é
Momento em que o fluxo que sustentava um movimento direcional perde intensidade. O preço continua tentando avançar mas com cada vez menos força. Os últimos agressores estão entrando em um movimento que está prestes a parar.

### Como surge
Os participantes que sustentavam o movimento já executaram suas ordens ou estão satisfeitos com o preço alcançado. Novos agressores são cada vez mais fracos e em menor quantidade.

### Sinais no DOM
- Liquidez no lado oposto começa a aumentar (resistência se formando)
- Ordens agressoras diminuem em tamanho e frequência
- Spread pode começar a alargar

### Sinais no Times & Trades
- Volume por execução diminuindo
- Frequência de agressões desacelerando
- Lotes cada vez menores
- Participantes de menor porte dominando as últimas agressões (varejo entrando atrasado)

### Sinais no Broker History
- Institucionais param de agredir
- Varejo domina as últimas agressões (sinal clássico de exaustão)

### Sinais no Volume Profile
- Volume decrescente nos últimos preços atingidos
- Extensão fina no extremo do perfil

### Impacto na formação do preço
- Desaceleração progressiva do deslocamento
- Preço pode ficar "pendurado" em um extremo sem sustentação
- Alta probabilidade de reversão ou pullback

### Interpretação para o aluno
Exaustão é o sinal de que o movimento acabou. O aluno deve observar: quem está agredindo agora? Se são lotes pequenos de varejo — os últimos a chegar — o movimento provavelmente já terminou.

---

## 7. Defesa de Preço

### O que é
Quando um participante demonstra intenção clara e repetida de impedir que o preço ultrapasse um determinado nível. Ele renova ordens passivas continuamente para absorver toda agressão contrária.

### Como surge
Um institucional possui interesse estratégico em manter o preço acima ou abaixo de determinado nível (pode estar acumulando, protegendo posição ou executando mandato).

### Sinais no DOM
- Ordem grande que se renova no mesmo nível repetidas vezes
- O nível é parcialmente consumido mas volume volta rapidamente
- Pode existir "layering" (múltiplos níveis de defesa escalonados)

### Sinais no Times & Trades
- Muitas execuções no mesmo preço sem deslocamento
- Mesma corretora aparecendo como passiva múltiplas vezes

### Sinais no Broker History
- Um broker dominante no lado passivo com volume desproporcional

### Sinais no Volume Profile
- Concentração de volume no nível defendido

### Impacto na formação do preço
- O preço fica "preso" contra o nível de defesa
- Pode criar piso (bid defense) ou teto (ask defense)

### Interpretação para o aluno
Defesa de preço indica convicção de um participante grande. Operar contra uma defesa ativa é extremamente arriscado. O aluno deve respeitar a defesa até que ela seja rompida com fluxo real.

---

## 8. Busca por Liquidez (Liquidity Hunt)

### O que é
Movimento deliberado de preço para atingir uma região onde existem muitas ordens stop ou ordens limitadas posicionadas (liquidez resting). O objetivo é executar contra essa liquidez e depois reverter.

### Como surge
Participantes sofisticados sabem onde stops costumam estar (abaixo de suportes, acima de resistências). Eles provocam um movimento até esses níveis para acionar os stops, executar contra eles e reverter.

### Sinais no DOM
- Liquidez some rapidamente no caminho do hunt (níveis cancelados com medo)
- Após atingir a zona de stops, liquidez reaparece agressivamente na direção oposta

### Sinais no Times & Trades
- Aceleração súbita de execuções em uma direção (stops sendo ativados)
- Imediatamente seguida por agressões fortes na direção oposta

### Sinais no Broker History
- Institucional aparece do lado oposto imediatamente após a zona de stops ser atingida

### Sinais no Volume Profile
- Pico pontual de volume no nível dos stops (muita gente executou ali involuntariamente)
- Volume baixo na ida até o nível (movimento rápido, poucos participantes genuínos)

### Impacto na formação do preço
- Ida rápida até a zona de liquidez → execução em massa → reversão imediata
- O preço retorna ao range anterior

### Interpretação para o aluno
O mercado frequentemente "busca" liquidez antes de se mover. Se o aluno perceber que o movimento foi rápido, com pouco volume genuíno e atingiu uma zona óbvia de stops, deve desconfiar de que é um hunt e não um rompimento.

---

## 9. Rejeição

### O que é
O preço tenta atingir um nível mas é rapidamente rejeitado — volta com velocidade para a região anterior. Indica que existe interesse forte em não permitir que o preço permaneça naquela região.

### Como surge
Ao atingir um nível específico, agressores do lado oposto aparecem imediatamente com volume suficiente para empurrar o preço de volta.

### Sinais no DOM
- Ao atingir o nível, ordens agressoras surgem instantaneamente do lado oposto
- Liquidez passiva desaparece no nível de rejeição (ninguém quer ficar ali)

### Sinais no Times & Trades
- Poucas execuções no nível de rejeição
- Execuções grandes e rápidas na direção da reversão

### Sinais no Broker History
- Player institucional agredindo na direção oposta exatamente no nível de rejeição

### Sinais no Volume Profile
- Volume mínimo no ponto de rejeição (preço passou rápido, ninguém negociou)
- Volume alto na reversão

### Impacto na formação do preço
- Wick / cauda / sombra — preço visita um nível mas não permanece

### Interpretação para o aluno
Rejeição é um sinal de que aquele nível tem interesse contrário forte. O aluno deve observar QUEM rejeitou e com QUANTO volume.

---

## 10. Consolidação (Lateralização)

### O que é
Período em que o preço oscila dentro de uma faixa definida sem tendência direcional clara. Compradores e vendedores estão em equilíbrio temporário.

### Como surge
Após um movimento direcional, o mercado entra em equilíbrio quando oferta e demanda se equivalem no range atual. Ninguém possui convicção suficiente para forçar saída da faixa.

### Sinais no DOM
- Liquidez equilibrada em ambos os lados
- Book simétrico (bid e ask com volumes semelhantes)
- Spread estável e apertado

### Sinais no Times & Trades
- Agressões alternadas (compra/venda/compra/venda)
- Volume moderado sem dominância clara
- Ausência de sequências longas em um único lado

### Sinais no Broker History
- Nenhum broker domina significativamente
- Deltas próximos de zero para a maioria

### Sinais no Volume Profile
- Volume se concentra uniformemente na faixa (ZIM horizontal)
- POC central dentro do range

### Impacto na formação do preço
- Preço respeita limites superior e inferior do range
- Tentativas de sair falham repetidamente

### Interpretação para o aluno
Consolidação é preparação. O mercado está decidindo. O aluno deve esperar pela resolução (rompimento) e não operar dentro do range sem motivo claro.

---

## 11. Expansão de Volatilidade

### O que é
Momento em que o mercado sai de um estado de baixa volatilidade (consolidação) para alta volatilidade (movimento direcional). Os deslocamentos de preço por tick aumentam significativamente.

### Como surge
Um catalisador (notícia, agressão institucional, cascata de stops) rompe o equilíbrio da consolidação. A energia acumulada durante o range é liberada.

### Sinais no DOM
- Book fica raso rapidamente (ordens canceladas com medo)
- Spread se alarga
- Renovação de liquidez cessa temporariamente

### Sinais no Times & Trades
- Volume explode
- Frequência de execuções dispara
- Lotes grandes em sequência rápida

### Sinais no Broker History
- Institucionais aparecem agredindo concentradamente

### Sinais no Volume Profile
- Volume muda de formato: de horizontal (range) para vertical (direcional)

### Impacto na formação do preço
- Múltiplos níveis consumidos rapidamente
- Preço pode se deslocar vários pontos em segundos

### Interpretação para o aluno
Expansão é o momento de maior oportunidade e risco. O aluno deve estar preparado antes da expansão (durante a consolidação) e não correr atrás do movimento depois que já aconteceu.

---

## 12. Contração de Volatilidade

### O que é
Oposto da expansão. O mercado gradualmente reduz a amplitude dos movimentos. Os deslocamentos ficam menores, o volume cai, a atividade diminui.

### Como surge
Após um movimento forte, os participantes perdem convicção. Ninguém quer agredir. O mercado "descansa".

### Sinais no DOM
- Book engorda (muita liquidez, pouca agressão)
- Spread aperta ao máximo
- Ordens grandes aparecem em ambos os lados (defesa mútua)

### Sinais no Times & Trades
- Volume diminui progressivamente
- Lotes menores
- Frequência reduzida

### Sinais no Volume Profile
- Volume se comprime em faixa cada vez menor

### Impacto na formação do preço
- Preço anda cada vez menos por tick
- Range se estreita

### Interpretação para o aluno
Contração precede expansão. Quanto mais o mercado se comprime, mais violento tende a ser o rompimento. O aluno deve se preparar durante a contração.

---

## 13. Pullback

### O que é
Correção temporária dentro de uma tendência. O preço retrocede parcialmente antes de retomar a direção original. É a "respiração" do movimento.

### Como surge
Participantes que lucraram no movimento realizam parcialmente (profit taking). Ou novos participantes do lado oposto tentam reverter — mas não possuem fluxo suficiente.

### Sinais no DOM
- Liquidez retorna no lado oposto ao pullback (compras reaparecem no bid durante pullback de alta)
- Agressões do pullback são menores que as do movimento original

### Sinais no Times & Trades
- Volume do pullback é inferior ao volume do impulso
- Participantes menores dominam o pullback

### Sinais no Broker History
- Institucionais param de agredir durante o pullback (esperam)
- Varejo domina o lado do pullback

### Sinais no Volume Profile
- Pouco volume na região do pullback (preço passou rápido)
- Volume concentrado no nível onde o pullback para (nova defesa)

### Impacto na formação do preço
- Retrocesso parcial (tipicamente 30-60% do impulso)
- Retomada da tendência com renovação de fluxo

### Interpretação para o aluno
Pullback é a oportunidade de entrada dentro de uma tendência. O aluno deve verificar: o pullback tem volume? Se não, é apenas respiração e a tendência provavelmente continua.

---

## 14. Testes de Suporte e Resistência

### O que é
O preço revisita um nível previamente relevante (onde houve absorção, defesa, ZIM ou rejeição anterior) para "testar" se a presença que existia antes ainda está ativa.

### Como surge
O mercado possui memória. Níveis onde houve grande atividade no passado tendem a ser revisitados. O teste verifica se o interesse permanece.

### Sinais no DOM
- Ao se aproximar do nível, ordens passivas começam a aparecer (defesa retornando)
- Ou: nenhuma defesa aparece (nível perdeu importância)

### Sinais no Times & Trades
- Volume no teste é comparado ao volume original
- Teste com volume MENOR que o original: defesa mais fraca
- Teste com defesa ATIVA: nível permanece válido

### Sinais no Volume Profile
- Volume previamente acumulado naquele nível é visível no VP
- Novo volume sendo adicionado (teste gerando negócios)

### Impacto na formação do preço
- Se o teste falha (defesa ausente): preço ultrapassa → rompimento
- Se o teste é bem-sucedido (defesa ativa): preço rejeita → reversão

### Interpretação para o aluno
O aluno deve avaliar: o nível que está sendo testado ainda tem participante defendendo? Se sim, é suporte/resistência válido. Se não, é vulnerável.

---

## 15. Mudanças de Contexto

### O que é
Momento em que o caráter do mercado muda fundamentalmente. O que era tendência vira lateralização. O que era calmo vira volátil. O que era compradores dominantes vira vendedores dominantes.

### Como surge
Mudanças de contexto acontecem quando:
- O player dominante atinge seu objetivo e para de atuar
- Um novo player entra com convicção oposta
- Um evento externo muda a dinâmica
- Exaustão de um lado permite que o outro assuma

### Sinais no DOM
- Mudança na estrutura do book (de assimétrico para simétrico, ou vice-versa)
- Novos participantes colocando liquidez em níveis antes vazios

### Sinais no Times & Trades
- O lado agressor dominante muda
- Volume muda de compra para venda (ou vice-versa)
- Novo broker aparece dominando

### Sinais no Broker History
- Delta muda de direção para os players dominantes
- Novo líder no ranking

### Sinais no Volume Profile
- POC começa a migrar
- Novo range de valor se formando

### Impacto na formação do preço
- Comportamento do preço muda (de direcional para lateral, de lateral para direcional)
- Estratégias que funcionavam param de funcionar

### Interpretação para o aluno
Identificar mudanças de contexto é a habilidade mais avançada. O aluno deve continuamente se perguntar: "O que mudou? Quem estava dominando e quem domina agora?" A capacidade de perceber essa transição separa amadores de profissionais.

---

## 16. Resumo de Fenômenos e suas Assinaturas

| Fenômeno | DOM | TT | VP | Preço |
|----------|-----|----|----|-------|
| Acumulação | Defesa repetida | Vol alto, preço estático | ZIM formando | Contido |
| Distribuição | Resistência renovada | Compras não sustentam | ZIM no topo | Contido por cima |
| Rompimento | Liquidez consumida | Agressões sequenciais | Volume baixo na região | Desloca rápido |
| Falso Rompimento | Book reconstrói | Volume seca após romper | Mínimo no extremo | Ida e volta |
| Absorção | Nível não zera | Muito volume, preço parado | ZIM pontual | Travado |
| Exaustão | Agressores diminuem | Lotes menores, mais lentos | Volume fino no extremo | Desacelera |
| Defesa | Ordem renovada | Mesmo broker passivo | Concentração local | Piso/teto |
| Liquidity Hunt | Book some → volta | Stops ativados + reversão | Pico pontual | Ida rápida + volta |
| Rejeição | Agressão oposta surge | Poucos negócios no nível | Volume mínimo | Volta imediata |
| Consolidação | Book simétrico | Alternância compra/venda | Horizontal | Range |
| Expansão Vol. | Book raso | Explosão de volume | Vertical | Multi-nível |
| Contração Vol. | Book gordo | Volume baixo | Comprimido | Range estreito |
| Pullback | Defesa retorna | Volume inferior ao impulso | Pouco volume na correção | Retrocede parcial |
| Teste S/R | Defesa reativa | Volume comparativo | VP indica nível | Confirma ou rompe |
| Mudança Contexto | Estrutura muda | Lado dominante troca | POC migra | Comportamento muda |

---

## 17. Conclusão

Estes fenômenos são a linguagem do mercado.

Eles NÃO são setups. Não são sinais de compra ou venda. São eventos observáveis que o aluno deve aprender a reconhecer, contextualizar e interpretar.

O FlowTrainerPro deverá ser capaz de reproduzir TODOS esses fenômenos de forma realista, permitindo que o trader os observe repetidamente até que sua percepção seja natural.

O próximo documento (`FLOW_PLAYER_LIBRARY.md`) detalhará QUEM produz cada um desses fenômenos e COMO os diferentes participantes reagem a eles.

---

*Documento criado em Julho de 2026.*
*Versão 1.0 — aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md, FLOW_MARKET_MICROSTRUCTURE.md*
