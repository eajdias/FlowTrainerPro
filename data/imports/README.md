# Arquivos CSV de importacao

Coloque nesta pasta arquivos CSV reais para validacao local, por exemplo:

```txt
data/imports/WDOFUT_F_0_Trade_13-07-2026.csv
```

Arquivos reais de mercado nao devem ser commitados. O `.gitignore` ignora `data/imports/*.csv`.

Formato suportado nesta fase:

- encoding UTF-8 ou ISO-8859-1 / Latin-1;
- delimitador `;`;
- cabecalho com as colunas `ATIVO`, `DATA`, `HORARIO`, `Corretora Compradora`, `Valor da Negociacao`, `Qd Lts`, `Corretora Vendedora`, `Agressor`;
- data `DD/MM/YYYY`;
- horario `HH:mm:ss`;
- preco no padrao pt-BR, como `5.159,50`.

Para validar:

```bash
npm run validate:trade-csv -- data/imports/WDOFUT_F_0_Trade_13-07-2026.csv
```
