import { readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { parseCsvTrades } from '../src/core/marketData/import';
import { BrokerFlowAnalyzer, type BrokerFlowSnapshot } from '../src/core/analytics/brokerFlow';

const filePath = process.argv[2] ?? 'data/imports/WDOFUT_F_0_Trade_13-07-2026.csv';
const buffer = readFileSync(filePath);
let text: string;
try {
  text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
} catch {
  text = new TextDecoder('latin1').decode(buffer);
}

const parsed = parseCsvTrades(text, { now: () => 0 });
const analyzer = new BrokerFlowAnalyzer({ autoStart: false });
for (const trade of parsed.trades) analyzer.processTrade(trade);
const snapshot = analyzer.flushSnapshot();

const top = (score: (broker: BrokerFlowSnapshot) => number) =>
  snapshot.brokers
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5)
    .map((broker) => ({
      broker: broker.brokerName,
      key: broker.brokerKey,
      value: score(broker),
    }));

console.log(JSON.stringify({
  processedTradeCount: snapshot.processedTradeCount,
  brokerCount: snapshot.brokers.length,
  mostActiveBroker: snapshot.mostActiveBroker,
  mostAggressiveBuyer: snapshot.mostAggressiveBuyer,
  mostAggressiveSeller: snapshot.mostAggressiveSeller,
  largestPositiveAggressiveNet: snapshot.largestPositiveAggressiveNet,
  largestNegativeAggressiveNet: snapshot.largestNegativeAggressiveNet,
  topActive: top((broker) => broker.totalBuyVolume + broker.totalSellVolume),
  topAggressiveBuy: top((broker) => broker.aggressiveBuyVolume),
  topAggressiveSell: top((broker) => broker.aggressiveSellVolume),
}, null, 2));
