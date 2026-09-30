import { describe, expect, it } from 'vitest';
import { normalizeAggressor, parseBroker, parseCsvTrades, parsePtBrNumber } from '../../src/core/marketData/import';

const header = 'ATIVO;DATA;HORARIO;Corretora Compradora;Valor da Negociação;Qd Lts;Corretora Vendedora;Agressor';
const line = (row: string) => parseCsvTrades(`${header}\n${row}`, { now: () => 0 });

describe('CsvTradeParser', () => {
  it('processa BUY valido', () => {
    const result = line('WDOFUT;13/07/2026;09:00:48;147 - ATIVA INVESTIMENTOS S.A. CTCV;5.159,50;54;8 - UBS BRASIL CCTVM S/A;Comprador');
    expect(result.diagnostics.validTradeCount).toBe(1);
    expect(result.trades[0].aggressor).toBe('BUY');
    expect(result.trades[0].price).toBe(5159.5);
    expect(result.trades[0].quantity).toBe(54);
    expect(result.trades[0].buyerBroker.code).toBe(147);
  });

  it('processa SELL valido', () => {
    expect(line('WDOFUT;13/07/2026;09:00:49;8 - UBS BRASIL CCTVM S/A;5.160,00;10;147 - ATIVA INVESTIMENTOS S.A. CTCV;Vendedor').trades[0].aggressor).toBe('SELL');
  });

  it('processa RLP, Direto, Leilao e UNKNOWN sem forcar direcao', () => {
    expect(normalizeAggressor('RLP')).toBe('RLP');
    expect(normalizeAggressor('Direto')).toBe('DIRECT');
    expect(normalizeAggressor('Leilão')).toBe('AUCTION');
    expect(normalizeAggressor('Outro')).toBe('UNKNOWN');
  });

  it('parseia preco pt-BR e quantidade', () => {
    expect(parsePtBrNumber('5.159,50')).toBe(5159.5);
    expect(line('WDOFUT;13/07/2026;09:00:48;147 - ATIVA;5.159,50;54;8 - UBS;Comprador').trades[0].quantity).toBe(54);
  });

  it('ignora linha vazia e conta diagnostico', () => {
    const result = parseCsvTrades(`${header}\n\n;;;;;;;\nWDOFUT;13/07/2026;09:00:48;147 - ATIVA;5.159,50;54;8 - UBS;Comprador\n`, { now: () => 0 });
    expect(result.diagnostics.blankLineCount).toBe(3);
    expect(result.diagnostics.validTradeCount).toBe(1);
    expect(result.diagnostics.invalidLineCount).toBe(0);
  });

  it('aceita espacos extras', () => {
    expect(line(' WDOFUT ; 13/07/2026 ; 09:00:48 ; 147 - ATIVA ; 5.159,50 ; 54 ; 8 - UBS ; Comprador ').trades[0].asset).toBe('WDOFUT');
  });

  it('parseia corretora com codigo, sem codigo e nome com hifen', () => {
    expect(parseBroker('147 - ATIVA INVESTIMENTOS S.A. CTCV').code).toBe(147);
    expect(parseBroker('Mesa Sem Codigo').code).toBeNull();
    expect(parseBroker('999 - BANCO TESTE - MESA A').name).toBe('BANCO TESTE - MESA A');
  });

  it('registra linhas invalidas sem interromper', () => {
    const result = parseCsvTrades(`${header}\nWDOFUT;99/07/2026;09:00:49;8 - UBS;5.160,00;10;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;99:00:49;8 - UBS;5.160,00;10;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;09:00:49;8 - UBS;preco;10;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;09:00:49;8 - UBS;5.160,00;qtd;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;09:00:49;8 - UBS;5.160,00`, { now: () => 0 });
    expect(result.diagnostics.invalidLineCount).toBe(5);
    expect(result.diagnostics.validTradeCount).toBe(0);
    expect(result.diagnostics.invalidLines[0].rawLine.length).toBeGreaterThan(0);
  });
});
