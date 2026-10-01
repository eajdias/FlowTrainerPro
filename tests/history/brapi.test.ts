import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontContract,
  normalizeBrapiFuture,
  BrapiShapeError,
} from '../../src/core/marketData/history/brapi';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const sample = () => JSON.parse(readFileSync(join(dir, 'brapi-wdox26.json'), 'utf8')) as unknown;

describe('brapi WDO (spec 5)', () => {
  it('extrai o front contract da term-structure', () => {
    const term = {
      asset: 'WDO',
      contracts: [
        { symbol: 'WDOV26', expirationDate: '2026-10-01' },
        { symbol: 'WDOX26', expirationDate: '2026-11-03' },
        { symbol: 'WDON30', expirationDate: '2030-06-01' },
      ],
    };
    expect(parseFrontContract(term, '2026-10-01')).toBe('WDOV26');
    expect(parseFrontContract(term, '2026-10-02')).toBe('WDOX26');
  });

  it('normaliza barras reais com fallback de abertura', () => {
    const candles = normalizeBrapiFuture(sample());
    expect(candles.length).toBeGreaterThan(0);
    for (const c of candles) {
      expect(c.symbol).toBe('WDO');
      expect(c.o).toBeGreaterThan(0);
      expect(c.h).toBeGreaterThanOrEqual(c.l);
    }
    expect(Object.isFrozen(candles[0])).toBe(true);
  });

  it('descarta barras nulas e rejeita shape inválido', () => {
    expect(normalizeBrapiFuture({ future: { symbol: 'WDO', history: [{ date: 1 }] } }).length).toBe(0);
    expect(() => normalizeBrapiFuture({ nada: true })).toThrow(BrapiShapeError);
    expect(() => parseFrontContract({ asset: 'WDO', contracts: [] })).toThrow(BrapiShapeError);
  });
});
