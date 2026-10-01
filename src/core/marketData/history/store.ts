// core/marketData/history/store.ts
// Store of record local (Spec 3/4): candles → DuckDB. Upsert idempotente.
// Caminho default ~/.flowtrainer/market.duckdb, override FLOWTRAINER_DB.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { DuckDBInstance } from '@duckdb/node-api';
import type { DailyCandle } from './daily';

export const DEFAULT_DB_PATH = `${homedir()}/.flowtrainer/market.duckdb`;

export function resolveDbPath(explicit?: string): string {
  if (explicit) return explicit;
  const env = process.env.FLOWTRAINER_DB;
  if (env && env.trim() !== '') return env;
  return DEFAULT_DB_PATH;
}

export class HistoryStoreError extends Error {
  readonly errorCause: unknown;

  constructor(message: string, cause?: unknown) {
    super(`history store: ${message}`);
    this.name = 'HistoryStoreError';
    this.errorCause = cause;
  }
}

export interface SaveResult {
  inserted: number;
  updated: number;
}

export interface HistoryStore {
  saveCandles(rows: DailyCandle[]): Promise<SaveResult>;
  loadCandles(symbol: string, from: string, to: string): Promise<DailyCandle[]>;
  close(): Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS candles (
  symbol VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  o DOUBLE NOT NULL,
  h DOUBLE NOT NULL,
  l DOUBLE NOT NULL,
  c DOUBLE NOT NULL,
  trades INTEGER NOT NULL,
  qty DOUBLE NOT NULL,
  volume DOUBLE NOT NULL,
  PRIMARY KEY (symbol, date)
)`.trim();

export async function openHistoryStore(explicitPath?: string): Promise<HistoryStore> {
  const path = resolveDbPath(explicitPath);
  try {
    mkdirSync(dirname(path), { recursive: true });
    const instance = await DuckDBInstance.create(path);
    const conn = await instance.connect();
    await conn.run(SCHEMA);

    const existsStmt = await conn.prepare('SELECT 1 FROM candles WHERE symbol = ? AND date = ?');
    const upsertStmt = await conn.prepare(
      'INSERT INTO candles (symbol, date, o, h, l, c, trades, qty, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT (symbol, date) DO UPDATE SET o = excluded.o, h = excluded.h, l = excluded.l, ' +
        'c = excluded.c, trades = excluded.trades, qty = excluded.qty, volume = excluded.volume',
    );

    return {
      async saveCandles(rows: DailyCandle[]): Promise<SaveResult> {
        let inserted = 0;
        let updated = 0;
        for (const r of rows) {
          existsStmt.clearBindings();
          existsStmt.bindVarchar(1, r.symbol);
          existsStmt.bindVarchar(2, r.date);
          const found = (await existsStmt.runAndReadAll()).getRows().length > 0;
          upsertStmt.clearBindings();
          upsertStmt.bindVarchar(1, r.symbol);
          upsertStmt.bindVarchar(2, r.date);
          upsertStmt.bindDouble(3, r.o);
          upsertStmt.bindDouble(4, r.h);
          upsertStmt.bindDouble(5, r.l);
          upsertStmt.bindDouble(6, r.c);
          upsertStmt.bindInteger(7, r.trades);
          upsertStmt.bindDouble(8, r.qty);
          upsertStmt.bindDouble(9, r.volume);
          await upsertStmt.runAndReadAll();
          if (found) updated += 1;
          else inserted += 1;
        }
        return { inserted, updated };
      },

      async loadCandles(symbol: string, from: string, to: string): Promise<DailyCandle[]> {
        const reader = await conn.runAndReadAll(
          'SELECT symbol, date, o, h, l, c, trades, qty, volume FROM candles ' +
            'WHERE symbol = ? AND date >= ? AND date <= ? ORDER BY date',
          [symbol, from, to],
        );
        return reader.getRowObjectsJS().map((row) => ({
          symbol: String(row.symbol),
          date: String(row.date),
          o: Number(row.o),
          h: Number(row.h),
          l: Number(row.l),
          c: Number(row.c),
          trades: Number(row.trades),
          qty: Number(row.qty),
          volume: Number(row.volume),
        }));
      },

      async close(): Promise<void> {
        conn.closeSync();
        instance.closeSync();
      },
    };
  } catch (cause) {
    throw new HistoryStoreError('falha ao abrir', cause);
  }
}
