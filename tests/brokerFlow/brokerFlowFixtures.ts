import type { BrokerFlowMarketSnapshot, BrokerFlowSnapshot } from '../../src/core/analytics/brokerFlow';

export function broker(overrides: Partial<BrokerFlowSnapshot> = {}): BrokerFlowSnapshot {
  const code = overrides.brokerCode ?? 1;
  const key = overrides.brokerKey ?? `CODE:${code}`;
  const buy = overrides.totalBuyVolume ?? 100;
  const sell = overrides.totalSellVolume ?? 80;
  const aggressiveBuy = overrides.aggressiveBuyVolume ?? 60;
  const aggressiveSell = overrides.aggressiveSellVolume ?? 20;

  return Object.freeze({
    brokerCode: code,
    brokerName: overrides.brokerName ?? `BROKER ${code}`,
    brokerKey: key,
    totalBuyVolume: buy,
    totalSellVolume: sell,
    aggressiveBuyVolume: aggressiveBuy,
    aggressiveSellVolume: aggressiveSell,
    passiveBuyVolume: overrides.passiveBuyVolume ?? 40,
    passiveSellVolume: overrides.passiveSellVolume ?? 60,
    rlpBuyVolume: overrides.rlpBuyVolume ?? 0,
    rlpSellVolume: overrides.rlpSellVolume ?? 0,
    directBuyVolume: overrides.directBuyVolume ?? 0,
    directSellVolume: overrides.directSellVolume ?? 0,
    auctionBuyVolume: overrides.auctionBuyVolume ?? 0,
    auctionSellVolume: overrides.auctionSellVolume ?? 0,
    unknownBuyVolume: overrides.unknownBuyVolume ?? 0,
    unknownSellVolume: overrides.unknownSellVolume ?? 0,
    aggressiveNetVolume: overrides.aggressiveNetVolume ?? aggressiveBuy - aggressiveSell,
    totalNetVolume: overrides.totalNetVolume ?? buy - sell,
    buyTradeCount: overrides.buyTradeCount ?? 3,
    sellTradeCount: overrides.sellTradeCount ?? 2,
    aggressiveBuyTradeCount: overrides.aggressiveBuyTradeCount ?? 2,
    aggressiveSellTradeCount: overrides.aggressiveSellTradeCount ?? 1,
    averageBuySize: overrides.averageBuySize ?? 10,
    averageSellSize: overrides.averageSellSize ?? 10,
    averageAggressiveBuySize: overrides.averageAggressiveBuySize ?? 10,
    averageAggressiveSellSize: overrides.averageAggressiveSellSize ?? 10,
    largestBuyTrade: overrides.largestBuyTrade ?? 30,
    largestSellTrade: overrides.largestSellTrade ?? 20,
    largestAggressiveBuy: overrides.largestAggressiveBuy ?? 25,
    largestAggressiveSell: overrides.largestAggressiveSell ?? 15,
    buyVWAP: overrides.buyVWAP ?? 5000,
    sellVWAP: overrides.sellVWAP ?? 5001,
    aggressiveBuyVWAP: overrides.aggressiveBuyVWAP ?? 5000,
    aggressiveSellVWAP: overrides.aggressiveSellVWAP ?? 5001,
    firstActivityTimestamp: overrides.firstActivityTimestamp ?? 1000,
    lastActivityTimestamp: overrides.lastActivityTimestamp ?? 2000,
    recentAggressiveBuyVolume: overrides.recentAggressiveBuyVolume ?? aggressiveBuy,
    recentAggressiveSellVolume: overrides.recentAggressiveSellVolume ?? aggressiveSell,
    recentNetAggression: overrides.recentNetAggression ?? aggressiveBuy - aggressiveSell,
    marketShare: overrides.marketShare ?? 0.2,
    aggressiveMarketShare: overrides.aggressiveMarketShare ?? 0.25,
    directionalAggression: overrides.directionalAggression ?? 0.5,
    activityRate: overrides.activityRate ?? 3,
    aggressionRate: overrides.aggressionRate ?? 2,
    persistenceSide: overrides.persistenceSide ?? 'BUY',
    persistenceScore: overrides.persistenceScore ?? 0.7,
    sideSwitchCount: overrides.sideSwitchCount ?? 1,
    lastAggressiveSide: overrides.lastAggressiveSide ?? 'BUY',
    currentAggressiveStreak: overrides.currentAggressiveStreak ?? 2,
    priceConcentration: overrides.priceConcentration ?? Object.freeze([
      Object.freeze({
        price: 5000,
        totalBuyVolume: 30,
        totalSellVolume: 10,
        aggressiveBuyVolume: 20,
        aggressiveSellVolume: 5,
        passiveBuyVolume: 10,
        passiveSellVolume: 5,
        tradeCount: 2,
        aggressiveNetVolume: 15,
      }),
    ]),
    priceResponse: overrides.priceResponse ?? Object.freeze({
      horizons: Object.freeze([
        Object.freeze({
          horizonMs: 1000,
          sampleCount: 2,
          averageFavorableResponseTicks: 1.5,
          averageAdverseResponseTicks: 0.5,
          positiveResponseRate: 0.6,
        }),
      ]),
    }),
    timestamp: overrides.timestamp ?? 2000,
  });
}

export function snapshot(brokers: readonly BrokerFlowSnapshot[] = [broker()]): BrokerFlowMarketSnapshot {
  return Object.freeze({
    brokers: Object.freeze([...brokers]),
    totalMarketVolume: brokers.reduce((sum, item) => sum + item.totalBuyVolume + item.totalSellVolume, 0) / 2,
    totalMarketSideVolume: brokers.reduce((sum, item) => sum + item.totalBuyVolume + item.totalSellVolume, 0),
    totalDirectionalAggressiveVolume: brokers.reduce((sum, item) => sum + item.aggressiveBuyVolume + item.aggressiveSellVolume, 0),
    mostActiveBroker: brokers[0]?.brokerKey ?? null,
    mostAggressiveBuyer: brokers[0]?.brokerKey ?? null,
    mostAggressiveSeller: brokers[0]?.brokerKey ?? null,
    largestPositiveAggressiveNet: brokers[0]?.brokerKey ?? null,
    largestNegativeAggressiveNet: brokers[0]?.brokerKey ?? null,
    timestamp: 9999,
    sourceMode: 'HISTORICAL_FILE',
    sessionId: 'session-a',
    processedTradeCount: 42,
    outOfOrderCount: 0,
  });
}
