import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openHistoryStore } from '../../src/core/marketData/history/store';
import type { DailyCandle } from '../../src/core/marketData/history/daily';

function candle(date: string, c: number): DailyCandle {
  return Object.freeze({ symbol: 'PETR4', date, o: c - 1, h: c + 1, l: c - 2, c, trades: 10, qty: 100, volume: 1000 });
}

describe('history store (spec 3)', () => {
  let dir: string;
  let store: Awaited<ReturnType<typeof openHistoryStore>> | null = null;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ftp-hist-'));
  });

  afterEach(async () => {
    await store?.close();
    store = null;
  });

  it('salva e lê por janela, ordenado', async () => {
    store = await openHistoryStore(join(dir, 'm.duckdb'));
    const r = await store.saveCandles([candle('2024-01-03', 11), candle('2024-01-02', 10)]);
    expect(r).toEqual({ inserted: 2, updated: 0 });
    const rows = await store.loadCandles('PETR4', '2024-01-01', '2024-12-31');
    expect(rows.map((c) => c.date)).toEqual(['2024-01-02', '2024-01-03']);
  });

  it('re-save é idempotente (atualiza, não duplica)', async () => {
    store = await openHistoryStore(join(dir, 'm.duckdb'));
    await store.saveCandles([candle('2024-01-02', 10)]);
    const r = await store.saveCandles([candle('2024-01-02', 12)]);
    expect(r).toEqual({ inserted: 0, updated: 1 });
    const rows = await store.loadCandles('PETR4', '2024-01-01', '2024-12-31');
    expect(rows.length).toBe(1);
    expect(rows[0]?.c).toBe(12);
  });

  it('janela vazia retorna []', async () => {
    store = await openHistoryStore(join(dir, 'm.duckdb'));
    expect(await store.loadCandles('PETR4', '2030-01-01', '2030-12-31')).toEqual([]);
  });
});
