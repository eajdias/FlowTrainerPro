// core/marketData/candles/RangeCandleEngine.ts
// Candles atemporais range-8: fecham quando (high-low) >= RANGE (4.00 = 8 ticks).
// Candles fechados sao imutaveis (Object.freeze). So execucoes geram volume.

export const RANGE_SIZE = 4.0;

export interface RangeCandle {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly startTimestamp: number;
  readonly endTimestamp: number;
  readonly trades: number;
  readonly closed: boolean;
}

export interface CandleInput {
  price: number;
  quantity: number;
  aggressorSide: 'buy' | 'sell';
  timestamp: number;
}

function freeze(c: RangeCandle): RangeCandle {
  return Object.freeze({ ...c, closed: true });
}

export class RangeCandleEngine {
  private closedCandles: RangeCandle[] = [];
  private forming: RangeCandle | null = null;

  onTrade(input: CandleInput): void {
    if (!(input.price > 0) || !(input.quantity > 0)) return;

    if (!this.forming) {
      this.forming = {
        open: input.price,
        high: input.price,
        low: input.price,
        close: input.price,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        startTimestamp: input.timestamp,
        endTimestamp: input.timestamp,
        trades: 0,
        closed: false,
      };
    }
    const f = this.forming;
    const next: RangeCandle = {
      open: f.open,
      high: Math.max(f.high, input.price),
      low: Math.min(f.low, input.price),
      close: input.price,
      volume: f.volume + input.quantity,
      buyVolume: f.buyVolume + (input.aggressorSide === 'buy' ? input.quantity : 0),
      sellVolume: f.sellVolume + (input.aggressorSide === 'sell' ? input.quantity : 0),
      startTimestamp: f.startTimestamp,
      endTimestamp: input.timestamp,
      trades: f.trades + 1,
      closed: false,
    };

    if (next.high - next.low >= RANGE_SIZE) {
      this.closedCandles.push(freeze(next));
      this.forming = null;
    } else {
      this.forming = next;
    }
  }

  /** Fechados (imutaveis) + em formacao por ultimo (copia). */
  snapshot(): RangeCandle[] {
    const out = [...this.closedCandles];
    if (this.forming) out.push({ ...this.forming });
    return out;
  }

  closed(): RangeCandle[] {
    return [...this.closedCandles];
  }

  reset(): void {
    this.closedCandles = [];
    this.forming = null;
  }
}
