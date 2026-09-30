# Global Trading Controls

## Objetivo

Os controles globais do FlowTrainerPro organizam o contexto operacional sem alterar engines, stores de dominio ou regras de mercado.

A regra principal e:

> Controles globais devem utilizar vocabulario, icones, estados e semantica consistentes em toda a aplicacao.

## Header

O Header concentra apenas informacoes globais:

- marca do produto;
- ativo carregado, quando houver fluxo homologado;
- source mode;
- sessao;
- ultimo preco;
- estado global;
- acoes globais de importacao, configuracao, layout e ajuda.

Quando nao existe ativo carregado por um fluxo homologado, o Header mostra `Nenhum ativo` e nao exibe simbolo falso.

## Source Mode

Vocabulário oficial:

| Modo interno | Rotulo visual | Descricao |
|---|---|---|
| `SYNTHETIC` | `SYNTHETIC` | Mercado gerado pelo simulador. |
| `SCENARIO` | `SCENARIO` | Cenario didatico controlado. |
| `HISTORICAL_FILE` | `HISTORICAL` | Replay baseado em negocios historicos importados. |
| `LIVE_FUTURE` | `LIVE FUTURE` | Fonte reservada para integracao futura com mercado ao vivo. |

A troca de fonte nao deve ocorrer por clique acidental. Modos nao ativos ficam visiveis como contexto e indisponiveis ate existir fluxo dedicado.

## Sessao

Vocabulário oficial de estado:

- `IDLE`;
- `READY`;
- `RUNNING`;
- `PAUSED`;
- `STOPPED`;
- `COMPLETED`;
- `ERROR`.

O objetivo e evitar sinonimos conflitantes como `PLAYING`, `ACTIVE` e `RUNNING` para a mesma situacao visual.

## ReplayToolbar

A ReplayToolbar e uma barra compacta dedicada a transporte, velocidade e progresso.

Controles implementados:

- `PLAY`;
- `PAUSE`;
- `STOP`;
- `RESET`;
- velocidades `0.5x`, `1x`, `2x`, `4x`, `8x`, `16x`;
- horario atual;
- progresso visual;
- contador de eventos/trades processados.

Nao fazem parte da ReplayToolbar:

- compra;
- venda;
- flatten;
- editor de cenarios;
- botoes sem handler real homologado;
- seek por arrastar.

## Velocidade

A velocidade altera apenas os proximos eventos do replay/simulador e preserva o indice atual.

Atalhos seguros:

- `Space`: alterna Play/Pause fora de inputs;
- `+`: aumenta velocidade fora de inputs;
- `-`: reduz velocidade fora de inputs.

`Ctrl+R` nao e usado para reset por conflito com refresh do navegador.

## Progresso

A barra de progresso e somente visual nesta fase. Seek por clique ou arraste nao foi habilitado porque exige contrato seguro especifico.

## StatusBar

A StatusBar informa diagnostico discreto:

- Kernel;
- Fonte;
- Replay;
- Sessao;
- Trades/eventos processados;
- Flow;
- Broker Flow;
- warnings;
- versao.

Ela nao deve competir visualmente com os paineis de mercado.

## Erros e Warnings

Warnings globais aparecem como texto curto na StatusBar com tooltip. Erros nao devem depender apenas do console e nao devem usar `alert()` do navegador.

## Responsividade

Comportamento esperado:

- Header permanece em uma linha;
- source modes nao ativos podem reduzir para icones ou ocultar progressivamente;
- navegacao secundaria pode ocultar em largura menor;
- StatusBar oculta diagnosticos secundarios;
- ReplayToolbar mantem transporte e velocidade ativa visiveis.

## Limitacoes

- A biblioteca oficial de icones ainda nao esta instalada no projeto; nesta fase foram usados rotulos compactos e acessiveis, sem emoji.
- Importacao historica aparece como acao global, mas o fluxo visual dedicado ainda pertence a fase posterior.
- Seek por timeline nao foi implementado.
- Step forward/back nao foi exibido porque nao existe handler homologado na toolbar atual.
