import { describe, expect, it, beforeEach } from 'vitest';
import { parseCsvTrades } from '../../src/core/marketData/import';
import { HistoricalReplayEngine } from '../../src/core/marketData/replay';
import { initHistoricalMarketDataProjection } from '../../src/core/marketData/projections';
import { useHistoricalTradeStore } from '../../src/store/historicalTradeStore';
import { useHistoricalLastPriceStore } from '../../src/store/historicalLastPriceStore';

const CSV = [
  'ATIVO;DATA;HORARIO;Corretora Compradora;Valor da Negociacao;Qd Lts;Corretora Vendedora;Agressor',
  'WDOFUT;13/07/2026;09:00:03;308 - CLEAR;5.159,00;1;39 - AGORA;RLP',
  'WDOFUT;13/07/2026;09:00:02;85 - BTG;5.160,00;2;3 - XP;Vendedor',
  'WDOFUT;13/07/2026;09:00:01;3 - XP;5.159,50;5;114 - ITAU;Comprador',
].join('\n');

describe('replay QA (live vs replay determinism)', () => {
  beforeEach(() => {
    // Sem eventBus.clear(): as inscrições dos stores são feitas no import do
    // módulo; o vitest isola módulos por arquivo, então não há vazamento.
    // init é idempotente (primeira chamada liga, demais são no-op).
    useHistoricalTradeStore.getState().reset();
    useHistoricalLastPriceStore.getState().reset();
    initHistoricalMarketDataProjection();
  });

  it('mesmo CSV gera mesmos IDs e ordem crescente', () => {
    const a = parseCsvTrades(CSV);
    const b = parseCsvTrades(CSV);
    expect(a.trades.map((t) => t.tradeId)).toEqual(b.trades.map((t) => t.tradeId));
    expect(a.trades.map((t) => t.timestamp)).toEqual(
      [...a.trades.map((t) => t.timestamp)].sort((x, y) => x - y),
    );
    expect(a.trades[0]?.aggressor).toBe('BUY');
  });

  it('replay alimenta projections e stores historicos', () => {
    const parsed = parseCsvTrades(CSV);
    const engine = new HistoricalReplayEngine();
    engine.load(parsed.trades, 'qa-session');

    let stepped = 0;
    while (engine.step()) stepped += 1;
    expect(stepped).toBe(3);

    const trades = useHistoricalTradeStore.getState();
    expect(trades.totalTrades).toBe(3);
    expect(trades.sessionId).toBe('qa-session');
    expect(useHistoricalLastPriceStore.getState().price).toBe(parsed.trades[2]?.price);
  });

  it('seek reposiciona sem duplicar projecao', () => {
    const parsed = parseCsvTrades(CSV);
    const engine = new HistoricalReplayEngine();
    engine.load(parsed.trades, 'qa-seek');
    engine.step();
    engine.seek(0);
    expect(engine.getState().currentIndex).toBe(0);
    expect(engine.getState().remainingTrades).toBe(3);
  });
});
