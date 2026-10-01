/**
 * HeatmapEngine — Bookmap-style order book heatmap
 *
 * Ported from PickleChart (https://github.com/ikarisz/PickleChart)
 * MIT License
 *
 * Time-Bin Matrix of Order Book Snapshots (independent temporal columns in SECONDS)
 */

import type { DepthBucketEntry, DepthSnapshot, HeatmapPalette, OrderBookState, RawTrade } from './types.js';

export interface OrderSegment {
  price: number;
  volume: number;
  startTime: number;
  endTime: number;
}

export class HeatmapEngine {
  private columnBins: DepthSnapshot[] = [];
  private maxBins: number = 1000;
  private lastBinTimeSec: number = 0;

  private bucketStep: number = 0.10;
  private contrast: number = 1.0;
  private palette: HeatmapPalette = 'inferno';

  constructor(bucketStep: number = 0.10, maxBins: number = 1000) {
    this.bucketStep = Math.max(0.01, bucketStep);
    this.maxBins = Math.max(100, maxBins);
  }

  public setBucketStep(step: number): void {
    this.bucketStep = Math.max(0.01, step);
  }

  public getBucketStep(): number {
    return this.bucketStep;
  }

  public roundToStep(price: number): number {
    if (!Number.isFinite(price)) return 0;
    const factor = Math.round(1 / this.bucketStep);
    return Math.round(price * factor) / factor;
  }

  public setContrast(contrast: number): void {
    this.contrast = Math.max(0.1, Math.min(5.0, contrast));
  }

  public getContrast(): number {
    return this.contrast;
  }

  public setPalette(palette: HeatmapPalette): void {
    this.palette = palette;
  }

  public getSnapshots(): DepthSnapshot[] {
    return this.columnBins;
  }

  public getSegments(): OrderSegment[] {
    return [];
  }

  public clear(): void {
    this.columnBins = [];
    this.lastBinTimeSec = 0;
  }

  /**
   * When a trade executes, consume/reduce resting limit order at that price level in latest bin
   */
  public handleTradeMatch(trade: RawTrade): void {
    if (this.columnBins.length === 0 || !trade || !Number.isFinite(trade.price)) return;
    const roundedPrice = this.roundToStep(trade.price);
    const lastBin = this.columnBins[this.columnBins.length - 1];
    if (!lastBin || !lastBin.entries) return;

    let entry = lastBin.entries.find((e) => Math.abs(e.price - roundedPrice) < 0.0001);
    if (!entry) {
      entry = { price: roundedPrice, volume: 0, filledVolume: 0, buyFillVolume: 0, sellFillVolume: 0 };
      lastBin.entries.push(entry);
    }
    entry.filledVolume = (entry.filledVolume || 0) + trade.qty;
    if (trade.side === 'buy') entry.buyFillVolume = (entry.buyFillVolume || 0) + trade.qty;
    else entry.sellFillVolume = (entry.sellFillVolume || 0) + trade.qty;
    if (entry.volume > 0) {
      entry.volume = Math.max(0, entry.volume - trade.qty);
    }
  }

  /**
   * Push a live Order Book Snapshot
   * Independent discrete time-slice: if an order was cancelled or filled,
   * it is absent in this snapshot, so the color drops out immediately without dragging!
   */
  public pushSnapshot(book: OrderBookState, timestamp: number = Date.now()): void {
    if (!book || (!book.bids && !book.asks)) return;

    const timeSec = timestamp > 1e11 ? timestamp / 1000 : timestamp;
    if (!Number.isFinite(timeSec)) return;

    const bucketMap = new Map<number, number>();

    if (book.bids) {
      for (const b of book.bids) {
        if (!b || !Number.isFinite(b.price) || !Number.isFinite(b.qty)) continue;
        const rounded = this.roundToStep(b.price);
        bucketMap.set(rounded, (bucketMap.get(rounded) || 0) + b.qty);
      }
    }

    if (book.asks) {
      for (const a of book.asks) {
        if (!a || !Number.isFinite(a.price) || !Number.isFinite(a.qty)) continue;
        const rounded = this.roundToStep(a.price);
        bucketMap.set(rounded, (bucketMap.get(rounded) || 0) + a.qty);
      }
    }

    const spreadGap = Math.max(this.bucketStep * 1.5, 0.05);
    const entries: DepthBucketEntry[] = [];

    bucketMap.forEach((vol, price) => {
      if (book.bestBid > 0 && book.bestAsk > 0) {
        if (price >= book.bestBid - spreadGap && price <= book.bestAsk + spreadGap) {
          return;
        }
      }
      if (vol <= 0.05 || !Number.isFinite(vol) || !Number.isFinite(price)) return;
      entries.push({ price, volume: vol });
    });

    const newSnap: DepthSnapshot = {
      timestamp: timeSec,
      entries,
      bestBid: book.bestBid || 0,
      bestAsk: book.bestAsk || 0,
    };

    // If within 150ms of previous bin, update it in-place
    if (this.columnBins.length > 0 && Math.abs(timeSec - this.lastBinTimeSec) < 0.15) {
      this.columnBins[this.columnBins.length - 1] = newSnap;
      return;
    }

    this.lastBinTimeSec = timeSec;
    this.columnBins.push(newSnap);

    // Sliding window ring buffer: keep max 1,000 snapshots
    if (this.columnBins.length > this.maxBins) {
      this.columnBins.shift();
    }
  }

  /**
   * Historical columns use actual aggregated fills. Resting liquidity is only
   * recorded when a real order-book snapshot is available; never fabricate walls.
   */
  public backfillHistoricalDepth(
    _candles: unknown[],
    currentBook: OrderBookState | null,
    trades: RawTrade[] = [],
  ): void {
    this.columnBins = [];
    this.lastBinTimeSec = 0;
    const columns = new Map<number, Map<number, DepthBucketEntry>>();
    for (const trade of trades) {
      if (!Number.isFinite(trade.time) || !Number.isFinite(trade.price) || !Number.isFinite(trade.qty)) continue;
      const timestamp = Math.floor((trade.time > 1e11 ? trade.time / 1000 : trade.time) * 2) / 2;
      const price = this.roundToStep(trade.price);
      const levels = columns.get(timestamp) || new Map<number, DepthBucketEntry>();
      const entry = levels.get(price) || { price, volume: 0, filledVolume: 0, buyFillVolume: 0, sellFillVolume: 0 };
      entry.filledVolume = (entry.filledVolume || 0) + trade.qty;
      if (trade.side === 'buy') entry.buyFillVolume = (entry.buyFillVolume || 0) + trade.qty;
      else entry.sellFillVolume = (entry.sellFillVolume || 0) + trade.qty;
      levels.set(price, entry);
      columns.set(timestamp, levels);
    }
    this.columnBins = [...columns.entries()].sort(([a], [b]) => a - b).slice(-this.maxBins).map(([timestamp, levels]) => ({
      timestamp,
      entries: [...levels.values()],
      bestBid: 0,
      bestAsk: 0,
    }));
    if (currentBook) this.pushSnapshot(currentBook, Date.now());
  }

  /**
   * Bookmap Spectrum color mapping
   */
  public getColorFromIntensity(intensity: number): string {
    const t = Math.max(0, Math.min(1.0, intensity));

    if (t <= 0.02) return '#0a0f24';

    if (this.palette === 'cyberpunk') {
      let r = 0, g = 0, b = 0;
      if (t < 0.5) {
        const k = t / 0.5;
        r = Math.round(10 + 50 * k);
        g = Math.round(150 + 80 * k);
        b = Math.round(220 + 35 * k);
      } else {
        const k = (t - 0.5) / 0.5;
        r = Math.round(60 + 195 * k);
        g = Math.round(230 - 150 * k);
        b = Math.round(255 - 50 * k);
      }
      return `rgb(${r}, ${g}, ${b})`;
    }

    if (this.palette === 'magma') {
      const r = Math.round(Math.min(255, t * 320));
      const g = Math.round(Math.min(255, Math.pow(t, 2) * 240));
      const b = Math.round(Math.min(255, (1 - t) * 60 + Math.pow(t, 3) * 200));
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Default: inferno (Bookmap Blue -> Cyan -> Green -> Yellow -> Orange -> Red)
    let r = 10, g = 15, b = 36;

    if (t < 0.20) {
      const k = t / 0.20;
      r = Math.round(10 + 20 * k);
      g = Math.round(15 + 121 * k);
      b = Math.round(36 + 193 * k);
    } else if (t < 0.40) {
      const k = (t - 0.20) / 0.20;
      r = Math.round(30 - 30 * k);
      g = Math.round(136 + 94 * k);
      b = Math.round(229 - 111 * k);
    } else if (t < 0.60) {
      const k = (t - 0.40) / 0.20;
      r = Math.round(0 + 255 * k);
      g = Math.round(230 + 5 * k);
      b = Math.round(118 - 59 * k);
    } else if (t < 0.80) {
      const k = (t - 0.60) / 0.20;
      r = 255;
      g = Math.round(235 - 83 * k);
      b = Math.round(59 - 59 * k);
    } else {
      const k = (t - 0.80) / 0.20;
      r = 255;
      g = Math.round(152 - 129 * k);
      b = Math.round(0 + 68 * k);
    }

    return `rgb(${r}, ${g}, ${b})`;
  }

  public getColor(volume: number, maxVolume: number = 25.0): string {
    const intensity = Math.min(1.0, (volume / Math.max(1.0, maxVolume)) * this.contrast);
    return this.getColorFromIntensity(intensity);
  }
}
