import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openHistoryStore } from '../src/core/marketData/history/store';
import { buildSessionStats } from '../src/core/analytics/history/sessionStats';

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : null;
}

const symbol = arg('--symbol') ?? 'PETR4';
const outDir = 'data/materials';

const store = await openHistoryStore();
try {
  const candles = await store.loadCandles(symbol, '1900-01-01', '2100-12-31');
  if (candles.length === 0) {
    console.error(`Sem candles para ${symbol} no banco. Rode scripts/fetch-history.ts e importe primeiro.`);
    process.exitCode = 1;
  } else {
    const sessions = buildSessionStats(candles);
    mkdirSync(outDir, { recursive: true });
    const payload = {
      symbol,
      generatedAt: new Date().toISOString(),
      sessions,
    };
    const path = join(outDir, `${symbol}.json`);
    writeFileSync(path, JSON.stringify(payload, null, 2));
    console.log(`ok: ${path} (${sessions.length} sessões)`);
  }
} finally {
  await store.close();
}
