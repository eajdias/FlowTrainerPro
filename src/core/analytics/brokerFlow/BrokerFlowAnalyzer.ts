// core/analytics/brokerFlow/BrokerFlowAnalyzer.ts
// Agrega MarketTrade por corretora (sessao). Sem EventBus, sem React.

import type { MarketTrade } from '../../marketData/types';
import type { BrokerFlowMarketSnapshot, BrokerFlowSnapshot } from './types';

export interface BrokerFlowAnalyzerOptions {
  autoStart?: boolean;
  sourceMode?: BrokerFlowMarketSnapshot['sourceMode'];
  sessionId?: string | null;
}

interface Acc {
  key: string;
  name: string;
  code: number | null;
  totalBuy: number;
  totalSell: number;
  aggroBuy: number;
  aggroSell: number;
  rlpBuy: number;
  rlpSell: number;
  trades: number;
  largestBuy: number;
  largestSell: number;
  largestAggroBuy: number;
  largestAggroSell: number;
  lastTs: number | null;
}

function keyFor(code: number | null, name: string): string {
  return code === null ? `name:${name}` : `code:${code}`;
}

export class BrokerFlowAnalyzer {
  private acc = new Map<string, Acc>();
  private processedTrades = 0;
  private readonly sourceMode: BrokerFlowMarketSnapshot['sourceMode'];
  private readonly sessionId: string | null;

  constructor(options: BrokerFlowAnalyzerOptions = {}) {
    this.sourceMode = options.sourceMode ?? null;
    this.sessionId = options.sessionId ?? null;
  }

  processTrade(trade: MarketTrade): void {
    this.processedTrades += 1;
    this.addSide(trade.buyerBroker.code, trade.buyerBroker.name || trade.buyerBroker.raw, 'buyer', trade);
    this.addSide(trade.sellerBroker.code, trade.sellerBroker.name || trade.sellerBroker.raw, 'seller', trade);
  }

  private addSide(
    code: number | null,
    name: string,
    role: 'buyer' | 'seller',
    trade: MarketTrade,
  ): void {
    const key = keyFor(code, name);
    let a = this.acc.get(key);
    if (!a) {
      a = {
        key, name, code,
        totalBuy: 0, totalSell: 0, aggroBuy: 0, aggroSell: 0,
        rlpBuy: 0, rlpSell: 0, trades: 0,
        largestBuy: 0, largestSell: 0, largestAggroBuy: 0, largestAggroSell: 0,
        lastTs: null,
      };
      this.acc.set(key, a);
    }
    const q = trade.quantity;
    a.trades += 1;
    a.lastTs = trade.timestamp;
    if (role === 'buyer') {
      a.totalBuy += q;
      a.largestBuy = Math.max(a.largestBuy, q);
    } else {
      a.totalSell += q;
      a.largestSell = Math.max(a.largestSell, q);
    }
    switch (trade.aggressor) {
      case 'BUY':
        if (role === 'buyer') {
          a.aggroBuy += q;
          a.largestAggroBuy = Math.max(a.largestAggroBuy, q);
        }
        break;
      case 'SELL':
        if (role === 'seller') {
          a.aggroSell += q;
          a.largestAggroSell = Math.max(a.largestAggroSell, q);
        }
        break;
      case 'RLP':
        if (role === 'buyer') a.rlpBuy += q;
        else a.rlpSell += q;
        break;
      default:
        break;
    }
  }

  flushSnapshot(): BrokerFlowMarketSnapshot {
    let grandTotal = 0;
    for (const a of this.acc.values()) grandTotal += a.totalBuy + a.totalSell;

    const brokers: BrokerFlowSnapshot[] = [];
    for (const a of this.acc.values()) {
      const total = a.totalBuy + a.totalSell;
      brokers.push({
        brokerKey: a.key,
        brokerName: a.name,
        brokerCode: a.code,
        totalBuyVolume: a.totalBuy,
        totalSellVolume: a.totalSell,
        aggressiveBuyVolume: a.aggroBuy,
        aggressiveSellVolume: a.aggroSell,
        aggressiveNetVolume: a.aggroBuy - a.aggroSell,
        rlpBuyVolume: a.rlpBuy,
        rlpSellVolume: a.rlpSell,
        marketShare: grandTotal > 0 ? total / grandTotal : 0,
        activityRate: this.processedTrades > 0 ? a.trades / (this.processedTrades * 2) : 0,
        persistenceScore: this.processedTrades > 0 ? Math.min(1, a.trades / this.processedTrades) : 0,
        largestBuyTrade: a.largestBuy,
        largestSellTrade: a.largestSell,
        largestAggressiveBuy: a.largestAggroBuy,
        largestAggressiveSell: a.largestAggroSell,
        lastActivityTimestamp: a.lastTs,
      });
    }
    brokers.sort((x, y) => x.totalBuyVolume + x.totalSellVolume - (y.totalBuyVolume + y.totalSellVolume));

    const top = (score: (b: BrokerFlowSnapshot) => number): string | null => {
      let best: BrokerFlowSnapshot | null = null;
      let bestScore = 0;
      for (const b of brokers) {
        const v = score(b);
        if (v > bestScore) {
          best = b;
          bestScore = v;
        }
      }
      return best?.brokerKey ?? null;
    };

    return {
      brokers,
      processedTradeCount: this.processedTrades,
      mostActiveBroker: top((b) => b.totalBuyVolume + b.totalSellVolume),
      mostAggressiveBuyer: top((b) => b.aggressiveBuyVolume),
      mostAggressiveSeller: top((b) => b.aggressiveSellVolume),
      largestPositiveAggressiveNet: top((b) => Math.max(0, b.aggressiveNetVolume)),
      largestNegativeAggressiveNet: top((b) => Math.max(0, -b.aggressiveNetVolume)),
      sourceMode: this.sourceMode,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };
  }

  reset(): void {
    this.acc.clear();
    this.processedTrades = 0;
  }
}
