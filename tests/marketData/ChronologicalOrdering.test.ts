import { describe, expect, it } from 'vitest';
import { parseCsvTrades } from '../../src/core/marketData/import';

const header = 'ATIVO;DATA;HORARIO;Corretora Compradora;Valor da Negociação;Qd Lts;Corretora Vendedora;Agressor';

describe('Market trade chronological ordering', () => {
  it('inverte arquivo descendente para ordem cronologica crescente', () => {
    const result = parseCsvTrades(`${header}\nWDOFUT;13/07/2026;15:22:38;147 - ATIVA;5.159,50;54;8 - UBS;Comprador\nWDOFUT;13/07/2026;15:22:35;8 - UBS;5.158,50;10;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;09:00:48;3 - XP;5.133,50;2;85 - BTG;Comprador`, { now: () => 0 });
    expect(result.trades.map((t) => t.tradeTime)).toEqual(['09:00:48', '15:22:35', '15:22:38']);
    expect(result.trades.map((t) => t.chronologicalSequence)).toEqual([1, 2, 3]);
  });

  it('preserva estabilidade em arquivo ascendente', () => {
    const result = parseCsvTrades(`${header}\nWDOFUT;13/07/2026;09:00:48;3 - XP;5.133,50;2;85 - BTG;Comprador\nWDOFUT;13/07/2026;15:22:35;8 - UBS;5.158,50;10;147 - ATIVA;Vendedor`, { now: () => 0 });
    expect(result.trades.map((t) => t.sourceSequence)).toEqual([1, 2]);
  });

  it('para mesmo segundo em arquivo descendente usa sourceSequence desc como desempate', () => {
    const result = parseCsvTrades(`${header}\nWDOFUT;13/07/2026;09:00:48;147 - ATIVA;5.159,50;1;8 - UBS;Comprador\nWDOFUT;13/07/2026;09:00:48;8 - UBS;5.159,50;2;147 - ATIVA;Vendedor\nWDOFUT;13/07/2026;09:00:47;85 - BTG;5.159,00;3;3 - XP;Comprador`, { now: () => 0 });
    expect(result.trades.map((t) => t.quantity)).toEqual([3, 2, 1]);
  });

  it('gera tradeId deterministico e sem duplicar em duas execucoes', () => {
    const content = `${header}\nWDOFUT;13/07/2026;09:00:48;147 - ATIVA;5.159,50;1;8 - UBS;Comprador`;
    const first = parseCsvTrades(content, { now: () => 0 });
    const second = parseCsvTrades(content, { now: () => 0 });
    expect(first.trades[0].tradeId).toBe(second.trades[0].tradeId);
    expect(new Set(first.trades.map((t) => t.tradeId)).size).toBe(first.trades.length);
  });
});
