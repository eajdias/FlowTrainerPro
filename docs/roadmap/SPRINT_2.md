# Sprint 2 — Integração e Mercado Vivo

## Status: EM PROGRESSO

---

## Etapa 1 — Mercado Vivo nos Painéis ✅ CONCLUÍDA

### Entregas:
- `SyntheticMarketProvider` reescrito com:
  - Atribuição de broker por tick (37 corretoras reais)
  - Cores resolvidas via BrokerRegistry (regra de lote grande)
  - Market phases (trend_up, trend_down, sideways)
  - Volume proporcional ao tipo de corretora (institucional > varejo)
- `marketStore` (Zustand) expandido com:
  - `brokerActivity[]` — ranking live de corretoras por delta
  - `volumeProfile[]` com POC automático
  - `trades[]` com broker, cor e side
  - `priceLevels[]` com bid/ask/delta por nível
- Painéis conectados ao store:
  - **TimesAndTrades** — stream live com corretora colorida
  - **PriceLadder** — bid/ask por nível (já estava parcial)
  - **VolumeProfile** — acumulado com POC/VAH/VAL calculados
  - **BrokerHistory** — ranking de corretoras por volume/delta
  - **SuperDOM** — ladder live com delta
- **ReplayToolbar** — Play/Pause/Reset funcional via useFlowEngine
- **Build limpa** — `npx tsc --noEmit` passa

---

## Etapa 2 — Operação Real (PRÓXIMA)

### Objetivos:
- [ ] SuperDOM interativo: click em bid/ask → ordem
- [ ] OrderManager processa intents → posição
- [ ] PnL em tempo real no SuperDOM
- [ ] Botão FLATTEN funcional
- [ ] BUY/SELL no toolbar funcional
- [ ] Painel de posições abertas/fechadas

### Dependências:
- TradingInteractionEngine (já existe como esqueleto)
- OrderManager (já existe)
- TradeEngine (já existe no kernel)

---

## Etapa 3 — Treinamento Guiado

### Objetivos:
- [ ] ScenarioLibrary com cenários pré-definidos
- [ ] TrainingEngine observa e avalia
- [ ] Missões com objetivos e pontuação
- [ ] Feedback ao final da sessão
- [ ] Progressão por níveis

---

## Critérios de aceite Sprint 2:
- `npx tsc --noEmit` sem erros
- Painéis mostram dados live ao clicar Iniciar
- Corretoras com cores reais da B3
- Layout arrastável e redimensionável
- Documentação atualizada
