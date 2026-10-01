import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchFrontContract, fetchFutureHistory, normalizeBrapiFuture } from '../src/core/marketData/history/brapi';
import { openHistoryStore } from '../src/core/marketData/history/store';
import { buildSessionStats } from '../src/core/analytics/history/sessionStats';

const ASSET = 'WDO';

const symbol = await fetchFrontContract(ASSET);
const payload = await fetchFutureHistory(symbol);
const candles = normalizeBrapiFuture(payload);
if (candles.length === 0) {
  console.error(`brapi retornou zero barras válidas para ${symbol}`);
  process.exitCode = 1;
} else {
  const store = await openHistoryStore();
  try {
    const saved = await store.saveCandles(candles);
    const sessions = buildSessionStats(candles);
    mkdirSync('data/materials', { recursive: true });
    const path = join('data/materials', 'WDO.json');
    writeFileSync(
      path,
      JSON.stringify({ symbol: 'WDO', contract: symbol, generatedAt: new Date().toISOString(), sessions }, null, 2),
    );
    console.log(`ok: ${path} (${sessions.length} sessões, +${saved.inserted}/${saved.updated} upd)`);
  } finally {
    await store.close();
  }
}
