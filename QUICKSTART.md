# Guia rápido — testar o FlowTrainerPro em 5 minutos

## O que é

Um **simulador de pregão** para treinar leitura de fluxo do Mini Dólar (WDO) sem arriscar
dinheiro real. Você vê o livro de ofertas se mexendo, clica para comprar/vender e recebe
nota pelo seu desempenho — como um videogame de trading com professor junto.

## Pré-requisitos

- **Node.js 20 ou maior** instalado ([nodejs.org](https://nodejs.org) — baixe a versão LTS).
  Confira no terminal: `node --version`.

## Passo a passo

```bash
# 1. Entrar na pasta e instalar (só na primeira vez, ~1 min)
cd FlowTrainerPro
npm install

# 2. Ligar o programa
npm run dev
```

Abra no navegador: **http://localhost:5173/**

## Primeiros 2 minutos dentro do app

1. Na **view Main**, abra a sidebar (se colapsada) e escolha uma missão (ex.: *Canal + Rompimento Comprador*), leia o briefing.
2. No topo da tela (**cockpit**), aperte **▶** — o mercado começa a se mexer.
3. No painel **SuperDOM**, clique num preço da coluna verde para **comprar** (ou use
   **Shift+clique** para comprar a mercado). O `✕` cancela, **ZERAR** fecha tudo.
4. Use **⏩ +1min/+5min** no topo para avançar a sessão; aperte **⏹** para ver sua **nota e o recado do coach**.
5. As tabs da sidebar (**Missões · Mesa · Estudo**) mostram progresso, indicadores da sessão e materiais de estudo — sem sair da mesa.

## De onde vêm os dados

- **Mercado da tela:** gerado pelo próprio programa (simulação, sem internet).
- **Histórico real:** tab **Estudo** da sidebar mostra sessões de WDO e PETR4 (já incluídas em `data/materials/`).
  Novos dados entram pelo pipeline API → DuckDB → JSON (`npm run materials`, `npm run materials:wdo`); validação de CSV avulso: `npm run validate:trade-csv -- <arquivo>`.

## Glossário mínimo

| Palavra | Significado simples |
|---|---|
| SuperDOM | Tabela de preços onde você clica para operar |
| Times & Trades | Lista de quem comprou/vendeu agora há pouco |
| Book | Fila de intenções de compra e venda |
| Candle 8P | Barrinha que resume a briga de um trecho de preço |
| Slip | Quanto o preço "andou" contra você na execução |
| Replay | Rever o mercado que já passou, em câmera lenta ou rápida |

## Deu errado?

| Sintoma | Solução |
|---|---|
| `localhost:5173` não abre | Veja se o terminal mostra `Local: http://localhost:5173/`; porta ocupada → feche outro `npm run dev` |
| Painéis vazios ("Sem execuções") | Aperte **▶ Iniciar** — sem kernel ligado não há mercado |
| `npm install` falha | Rode `node --version` (precisa 20+); apague `node_modules` e tente de novo |
