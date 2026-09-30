# FLOW_BROKER_COLORS.md
## Especificação Oficial de Coloração das Corretoras

*Este documento define as regras oficiais de cor para cada corretora exibida no FlowTrainerPro. Toda implementação visual de brokers deve seguir obrigatoriamente esta especificação.*

*Subordinado a: `FLOWTRAINER_VISION.md`*

---

## 1. Conceito

Cada corretora possui uma **cor primária** que a identifica visualmente em todos os painéis da plataforma (Times & Trades, Broker History, SuperDOM futuro).

Algumas corretoras possuem uma **cor secundária** que é ativada quando o lote de uma única ordem atinge ou ultrapassa **250 contratos**. Isso permite ao trader identificar visualmente quando uma corretora está operando com agressividade incomum.

---

## 2. Regra de Cor

```
SE lote da ordem < 250 contratos:
  → exibir COR PRIMÁRIA

SE lote da ordem >= 250 contratos E corretora possui cor secundária:
  → exibir COR SECUNDÁRIA

SE corretora NÃO possui cor secundária:
  → sempre exibir COR PRIMÁRIA (independente do lote)
```

---

## 3. Paleta de Cores

| Grupo | Cor Primária (hex) | Cor Secundária (hex) |
|-------|-------------------|---------------------|
| AMARELO | `#F5C400` | — |
| AZUL CLARO | `#4FC3F7` | — |
| VERDE | `#2ECC8A` | — |
| VERMELHO | `#E03A3A` | — |
| Secundária VERMELHO | — | `#E03A3A` |
| Secundária VERDE | — | `#2ECC8A` |

---

## 4. Tabela Completa de Corretoras

### Grupo AMARELO

| Nº | Corretora | Cor Primária | Cor Secundária |
|----|-----------|-------------|----------------|
| 120 | GENIAL | AMARELO `#F5C400` | VERMELHO `#E03A3A` |
| 1618 | IDEAL | AMARELO `#F5C400` | — |
| 16 | JP MORGAN | AMARELO `#F5C400` | VERDE `#2ECC8A` |
| 8 | UBS | AMARELO `#F5C400` | VERDE `#2ECC8A` |

---

### Grupo AZUL CLARO

| Nº | Corretora | Cor Primária | Cor Secundária |
|----|-----------|-------------|----------------|
| 88 | CAPITAL | AZUL CLARO `#4FC3F7` | VERDE `#2ECC8A` |
| 308 | CLEAR | AZUL CLARO `#4FC3F7` | — |
| 90 | EASYINVEST | AZUL CLARO `#4FC3F7` | — |
| 174 | ELITE | AZUL CLARO `#4FC3F7` | — |
| 115 | HCOMMCOR | AZUL CLARO `#4FC3F7` | VERMELHO `#E03A3A` |
| 262 | MIRAE | AZUL CLARO `#4FC3F7` | VERMELHO `#E03A3A` |
| 1982 | MODAL | AZUL CLARO `#4FC3F7` | — |
| 23 | NECTON | AZUL CLARO `#4FC3F7` | — |
| 93 | NOVA FUTURA | AZUL CLARO `#4FC3F7` | VERMELHO `#E03A3A` |
| 3701 | ORAMA | AZUL CLARO `#4FC3F7` | — |
| 386 | RICO | AZUL CLARO `#4FC3F7` | — |
| 107 | TERRA | AZUL CLARO `#4FC3F7` | VERMELHO `#E03A3A` |
| 4090 | TORO | AZUL CLARO `#4FC3F7` | — |
| 29 | UNILETRA | AZUL CLARO `#4FC3F7` | — |
| 3 | XP | AZUL CLARO `#4FC3F7` | VERMELHO `#E03A3A` |

---

### Grupo VERDE

| Nº | Corretora | Cor Primária | Cor Secundária |
|----|-----------|-------------|----------------|
| 147 | ATIVA | VERDE `#2ECC8A` | — |
| 122 | BGC LIQUIDEZ | VERDE `#2ECC8A` | — |
| 77 | CITIGROUP | VERDE `#2ECC8A` | — |
| 45 | CREDIT | VERDE `#2ECC8A` | — |
| 238 | GOLDMAN | VERDE `#2ECC8A` | — |
| 13 | MERRILL | VERDE `#2ECC8A` | — |
| 40 | MORGAN | VERDE `#2ECC8A` | — |
| 127 | TULLETT | VERDE `#2ECC8A` | — |

---

### Grupo VERMELHO

| Nº | Corretora | Cor Primária | Cor Secundária |
|----|-----------|-------------|----------------|
| 39 | AGORA | VERMELHO `#E03A3A` | — |
| 4 | ALFA | VERMELHO `#E03A3A` | — |
| 72 | BRADESCO | VERMELHO `#E03A3A` | — |
| 85 | BTG | VERMELHO `#E03A3A` | — |
| 6003 | C6 | VERMELHO `#E03A3A` | — |
| 74 | COINVALORES | VERMELHO `#E03A3A` | — |
| 131 | FATOR | VERMELHO `#E03A3A` | — |
| 15 | GUIDE | VERMELHO `#E03A3A` | — |
| 735 | ICAP | VERMELHO `#E03A3A` | — |
| 1130 | INTL | VERMELHO `#E03A3A` | — |
| 114 | ITAU | VERMELHO `#E03A3A` | — |
| 129 | PLANNER | VERMELHO `#E03A3A` | — |
| 92 | RENASCENCA | VERMELHO `#E03A3A` | — |
| 59 | SAFRA | VERMELHO `#E03A3A` | — |
| 27 | SANTANDER | VERMELHO `#E03A3A` | — |
| 58 | SOCOPA | VERMELHO `#E03A3A` | — |
| 21 | VOTORANTIM | VERMELHO `#E03A3A` | — |

---

## 5. Regras de Implementação

### 5.1. Onde as cores são exibidas

| Painel | Como usa a cor |
|--------|---------------|
| Times & Trades | Cor da corretora compradora e vendedora |
| Broker History | Dot e borda lateral de cada linha |
| SuperDOM (futuro) | Indicador visual de quem está no nível |
| Volume Profile (futuro) | Footprint por broker |

### 5.2. Regra do lote ≥ 250

A cor secundária SOMENTE é ativada quando:
- A corretora possui cor secundária definida (nem todas possuem)
- O lote de UMA ÚNICA ORDEM é ≥ 250 contratos
- Não conta soma de ordens — é por ordem individual

### 5.3. Consistência

- A mesma corretora SEMPRE exibe a mesma cor (dentro das regras de lote)
- A cor NÃO muda por lado (compra/venda) — muda apenas por lote
- A cor é a mesma em TODOS os painéis simultaneamente

---

## 6. Função de Resolução (pseudocódigo)

```
function resolveColor(brokerId, orderSize):
  broker = registry.get(brokerId)
  
  if broker.secondaryColor exists AND orderSize >= 250:
    return broker.secondaryColor
  
  return broker.primaryColor
```

Esta função deve ser chamada em TODO lugar onde uma cor de corretora é exibida.

---

## 7. Observações

- **TORO (4090)** consta na imagem de referência mas pode estar inativa — manter no registro como AZUL CLARO sem secundária.
- **UNILETRA (29)** — AZUL CLARO sem secundária.
- Corretoras do grupo VERDE são predominantemente estrangeiras e institucionais.
- Corretoras do grupo VERMELHO são predominantemente bancos brasileiros e institucionais locais.
- Corretoras do grupo AZUL CLARO são predominantemente varejo e algumas estrangeiras.
- Corretoras do grupo AMARELO são poucas e incluem grandes estrangeiras (JP Morgan, UBS).

---

## 8. Manutenção

Para adicionar, remover ou alterar uma corretora:
1. Atualizar ESTE documento
2. Atualizar `src/core/marketIdentity/data/brokers.ts`
3. Nunca alterar cores em código avulso — sempre via BrokerRegistry

---

*Documento criado em Julho de 2026.*
*Versão 1.0 — aprovação pendente.*
*Subordinado a: FLOWTRAINER_VISION.md*
