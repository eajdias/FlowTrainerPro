import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDailyCotahist } from '../../src/core/marketData/history/daily';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const sample = () => readFileSync(join(dir, 'COTAHIST_SAMPLE.TXT'), 'latin1');

describe('history validation (spec 2)', () => {
  it('extrai candles de registros válidos', () => {
    const { candles, diagnostics } = parseDailyCotahist(sample());
    expect(candles.length).toBe(3);
    expect(diagnostics.valid).toBe(3);
    expect(candles[0]).toMatchObject({ symbol: 'PETR4', date: '2024-01-02' });
    expect(candles[0]?.o).toBeCloseTo(10.5, 8);
    expect(Object.isFrozen(candles[0])).toBe(true);
  });

  it('rejeita linha curta, preço e data inválidos com reasonCode', () => {
    const { candles, diagnostics } = parseDailyCotahist('CURTA\n');
    expect(candles.length).toBe(0);
    expect(diagnostics.invalid).toBe(1);
    expect(diagnostics.invalidLines[0]?.reasonCode).toBe('HIST_SHORT_LINE');
  });

  it('ordena, deduplica e conta fora de ordem', () => {
    const text = sample();
    const lines = text.split('\n');
    const doubled = [...lines, lines[2]!].join('\n');
    const { candles, diagnostics } = parseDailyCotahist(doubled);
    expect(candles.length).toBe(3);
    expect(diagnostics.duplicates).toBe(1);
    expect(diagnostics.outOfOrder).toBeGreaterThanOrEqual(0);
    const dates = candles.map((c) => c.date);
    expect([...dates].sort()).toEqual(dates);
  });
});
