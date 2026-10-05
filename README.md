# FlowTrainerPro

> Simulador de pregão para treinar leitura de Order Flow no Mini Dólar (WDO) — sem dinheiro real.

O mercado se mexe na tela, você clica para comprar/vender e recebe nota pelo desempenho,
com feedback de coach. Tudo simulado localmente: nenhum dado sai da sua máquina e
nenhuma ordem chega a uma corretora real.

**Stack:** React 19 · TypeScript 6 · Vite 8 · Zustand · Vitest · DuckDB (pipeline de dados históricos).

## Funcionalidades

- **SuperDOM fundido com Ladder** — 9 colunas, heatmap de profundidade, imbalance de liquidez, refs do dia (Máx/Mín/VWAP/Abertura)
- **Gráfico 8P** — candles de range-8 com agressão por candle
- **Volume Profile** — POC/VAH/VAL, zonas quentes, agressão × absorção
- **Times & Trades** — tape com filtros, large/medium trades, book por corretora
- **10 missões guiadas** — briefing, objetivos ao vivo, avaliação e feedback do coach
- **Replay histórico** — sessões reais de WDO/PETR4 em velocidade ajustável, com fast-forward
- **Workspaces** — Tape Reading, Scalping e DOM Puro, layout fluido que se adapta à sidebar

## Início rápido

```bash
npm install   # primeira vez (Node 20+)
npm run dev   # abre em http://localhost:5173/
```

Guia de 5 minutos (sem jargão): [`docs/quickstart.md`](docs/quickstart.md).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | suíte de testes (Vitest) |
| `npx tsc --noEmit` | typecheck |
| `npm run materials:wdo` | baixa série diária de WDO (brapi, gratuita) → DuckDB + JSON |
| `npm run materials -- --symbol PETR4` | gera material de estudo de um ativo |
| `npm run validate:trade-csv -- <arquivo>` | valida CSV avulso |

## Como funciona

Dois universos isolados, como em mesa real:

- **Mercado (simulação):** kernel com clock de 150 ms → gerador de fluxo → livro de ofertas → matching FIFO (price-time priority). Determinístico por seed.
- **Trader (você):** ordens entram por um único controlador; posição, stops e P&L reagem só a execuções reais. Replay histórico nunca toca posição, stops, P&L ou fila.

Engines concentram a lógica; o React apenas representa estado. Detalhes em
[`docs/architecture.md`](docs/architecture.md) e [`docs/modules.md`](docs/modules.md).

## Estrutura

```
src/
├── core/       # kernel de simulação, matching, market data, analytics
├── trader/     # controlador de ordens, execução, posição
├── training/   # missões, avaliação, coach
├── panels/     # painéis do desk (registry)
├── workspace/  # layout fluido, workspaces
├── store/      # estado global (Zustand)
└── assets/     # tema, design system
docs/           # documentação (índice em docs/README.md)
scripts/        # pipeline de dados históricos
data/materials/ # sessões de estudo incluídas (WDO, PETR4)
```

## Dados

Sem tempo real, sem tick a tick — só dados passados para estudo. O mercado da tela é
gerado pelo simulador; materiais históricos entram pelo pipeline
API → DuckDB → JSON. Ver [`data/README.md`](data/README.md).

## Qualidade

- `tsc` 0 erros · `vite build` ok
- 61 testes automatizados (20 arquivos), todos passando
- Convenções em [`docs/engineering-handbook.md`](docs/engineering-handbook.md); guia para agentes LLM em [`AGENTS.md`](AGENTS.md)

## Fora do escopo

- Não conecta a corretoras, não envia ordens reais, não exibe cotação ao vivo
- WDO intradiário segue pendente de fonte gratuita (diário via brapi incluso)

## Licença

MIT — ver [`LICENSE`](LICENSE).

## Autor

**Emmanuel Dias** — [github.com/eajdias](https://github.com/eajdias)
