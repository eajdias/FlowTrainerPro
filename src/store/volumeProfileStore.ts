// store/volumeProfileStore.ts
// Dedicated Zustand store for Volume Profile.
// SOURCE: exclusively "matching:execution:created" events.
// Accumulates executed volume per price level.
// NEVER reads from OrderBook, DOM or intentions.
// Only EXECUTIONS produce volume.

import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import { MATCHING_EVENTS } from '../core/kernel/MatchingEngine';
import type { Execution } from '../core/kernel/MatchingEngine';

// ── Volume level ──────────────────────────────────────────────────────────────

export interface VolumeLevelRecord {
  price:       number;
  totalVolume: number;
  buyVolume:   number;
  sellVolume:  number;
  tradeCount:  number;
  isPOC:       boolean;
  isVAH:       boolean;
  isVAL:       boolean;
  isZIM:       boolean;
  barWidth:    number;   // 0–100 relative to POC
}

// ── Store state ───────────────────────────────────────────────────────────────

interface VolumeProfileState {
  levels:     VolumeLevelRecord[];  // sorted price desc
  poc:        number;               // price of POC
  vah:        number;               // Value Area High
  val:        number;               // Value Area Low
  totalVolume: number;
}

interface VolumeProfileActions {
  reset: () => void;
}

// ── Internal accumulator ──────────────────────────────────────────────────────

interface RawLevel {
  totalVolume: number;
  buyVolume:   number;
  sellVolume:  number;
  tradeCount:  number;
}

const rawData = new Map<number, RawLevel>();
let totalVol = 0;

// ── Calculations ──────────────────────────────────────────────────────────────

function computeProfile(): Pick<VolumeProfileState, 'levels' | 'poc' | 'vah' | 'val' | 'totalVolume'> {
  if (rawData.size === 0) {
    return { levels: [], poc: 0, vah: 0, val: 0, totalVolume: 0 };
  }

  // Find POC (max volume level)
  let pocPrice = 0;
  let pocVol = 0;
  rawData.forEach((data, price) => {
    if (data.totalVolume > pocVol) {
      pocVol = data.totalVolume;
      pocPrice = price;
    }
  });

  // Calculate Value Area (70% of total volume centered around POC)
  const sortedByPrice = Array.from(rawData.entries()).sort(([a], [b]) => a - b);
  const targetVolume = totalVol * 0.70;

  // Start from POC and expand outward
  const pocIndex = sortedByPrice.findIndex(([p]) => p === pocPrice);
  let vaVolume = pocVol;
  let lowIdx = pocIndex;
  let highIdx = pocIndex;

  while (vaVolume < targetVolume && (lowIdx > 0 || highIdx < sortedByPrice.length - 1)) {
    const canGoLow = lowIdx > 0;
    const canGoHigh = highIdx < sortedByPrice.length - 1;

    const lowVol = canGoLow ? sortedByPrice[lowIdx - 1][1].totalVolume : 0;
    const highVol = canGoHigh ? sortedByPrice[highIdx + 1][1].totalVolume : 0;

    if (canGoLow && (!canGoHigh || lowVol >= highVol)) {
      lowIdx--;
      vaVolume += lowVol;
    } else if (canGoHigh) {
      highIdx++;
      vaVolume += highVol;
    } else {
      break;
    }
  }

  const valPrice = sortedByPrice[lowIdx]?.[0] ?? 0;
  const vahPrice = sortedByPrice[highIdx]?.[0] ?? 0;

  // ZIM detection: levels with volume > 2x average
  const avgVolume = totalVol / rawData.size;
  const zimThreshold = avgVolume * 2;

  // Build output levels
  const levels: VolumeLevelRecord[] = Array.from(rawData.entries())
    .sort(([a], [b]) => b - a) // price desc
    .map(([price, data]) => ({
      price,
      totalVolume: data.totalVolume,
      buyVolume:   data.buyVolume,
      sellVolume:  data.sellVolume,
      tradeCount:  data.tradeCount,
      isPOC:       price === pocPrice,
      isVAH:       price === vahPrice,
      isVAL:       price === valPrice,
      isZIM:       data.totalVolume >= zimThreshold,
      barWidth:    pocVol > 0 ? Math.round((data.totalVolume / pocVol) * 100) : 0,
    }));

  return { levels, poc: pocPrice, vah: vahPrice, val: valPrice, totalVolume: totalVol };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useVolumeProfileStore = create<VolumeProfileState & VolumeProfileActions>((set) => ({
  levels:      [],
  poc:         0,
  vah:         0,
  val:         0,
  totalVolume: 0,

  reset: () => {
    rawData.clear();
    totalVol = 0;
    set({ levels: [], poc: 0, vah: 0, val: 0, totalVolume: 0 });
  },
}));

// ── Wire: Execution → VolumeProfileStore ──────────────────────────────────────

eventBus.on<Execution>(MATCHING_EVENTS.EXECUTION_CREATED, (exec) => {
  const existing = rawData.get(exec.price) ?? { totalVolume: 0, buyVolume: 0, sellVolume: 0, tradeCount: 0 };

  rawData.set(exec.price, {
    totalVolume: existing.totalVolume + exec.size,
    buyVolume:   existing.buyVolume + (exec.side === 'buy' ? exec.size : 0),
    sellVolume:  existing.sellVolume + (exec.side === 'sell' ? exec.size : 0),
    tradeCount:  existing.tradeCount + 1,
  });

  totalVol += exec.size;

  // Recompute profile
  const profile = computeProfile();
  useVolumeProfileStore.setState(profile);
});
