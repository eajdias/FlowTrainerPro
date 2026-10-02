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

1. Na rota **Training**, leia o quadro **Primeiros passos** e clique em **Começar**.
2. Escolha uma missão (ex.: *Canal + Rompimento Comprador*) e leia o briefing.
3. Role até a barra **Replay** e aperte **▶ Iniciar** — o mercado começa a se mexer.
4. No painel **SuperDOM**, clique num preço da coluna verde para **comprar** (ou use
   **Shift+clique** para comprar a mercado). O `✕` cancela, **ZERAR** fecha tudo.
5. Aperte **⏹ Finalizar** na Replay para ver sua **nota e o recado do coach**.

## De onde vêm os dados

- **Mercado ao vivo da tela:** gerado pelo próprio programa (simulação, sem internet).
- **Histórico real:** rota **Academy** mostra sessões de WDO e PETR4 (já incluídas).
  Para importar seu próprio CSV da B3: painel **Dados & Ativos** → Importar CSV.

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
