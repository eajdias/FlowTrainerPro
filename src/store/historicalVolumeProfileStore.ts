import { create } from 'zustand';
import { eventBus } from '../core/engine/EventBus';
import {
  MARKET_DATA_PROJECTION_EVENTS,
  projectHistoricalVolumeProfile,
  type MarketProjectionResetEvent,
  type MarketTradeObservedEvent,
} from '../core/marketData/projections';

export interface HistoricalVolumeLevelRecord {
  price: number;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  neutralVolume: number;
  rlpVolume: number;
  directVolume: number;
  auctionVolume: number;
  unknownVolume: number;
  tradeCount: number;
  delta: number;
  isPOC: boolean;
  isVAH: boolean;
  isVAL: boolean;
  isZIM: boolean;
  barWidth: number;
}

interface RawHistoricalVolumeLevel {
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  neutralVolume: number;
  rlpVolume: number;
  directVolume: number;
  auctionVolume: number;
  unknownVolume: number;
  tradeCount: number;
}

interface HistoricalVolumeProfileState {
  levels: HistoricalVolumeLevelRecord[];
  poc: number;
  vah: number;
  val: number;
  totalVolume: number;
  tradeCount: number;
  sessionId: string | null;
  reset: () => void;
}

const rawLevels = new Map<number, RawHistoricalVolumeLevel>();
let totalVolume = 0;
let tradeCount = 0;
let pocPrice = 0;
let pocVolume = 0;

export const useHistoricalVolumeProfileStore = create<HistoricalVolumeProfileState>((set) => ({
  levels: [],
  poc: 0,
  vah: 0,
  val: 0,
  totalVolume: 0,
  tradeCount: 0,
  sessionId: null,

  reset: () => {
    rawLevels.clear();
    totalVolume = 0;
    tradeCount = 0;
    pocPrice = 0;
    pocVolume = 0;
    set({ levels: [], poc: 0, vah: 0, val: 0, totalVolume: 0, tradeCount: 0, sessionId: null });
  },
}));

eventBus.on<MarketTradeObservedEvent>(MARKET_DATA_PROJECTION_EVENTS.TRADE_OBSERVED, (event) => {
  const input = projectHistoricalVolumeProfile(event);
  const existing = rawLevels.get(input.price) ?? {
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    neutralVolume: 0,
    rlpVolume: 0,
    directVolume: 0,
    auctionVolume: 0,
    unknownVolume: 0,
    tradeCount: 0,
  };

  const next: RawHistoricalVolumeLevel = {
    totalVolume: existing.totalVolume + input.quantity,
    buyVolume: existing.buyVolume + input.buyAggressorVolume,
    sellVolume: existing.sellVolume + input.sellAggressorVolume,
    neutralVolume: existing.neutralVolume + input.neutralVolume + input.rlpVolume + input.directVolume + input.auctionVolume,
    rlpVolume: existing.rlpVolume + input.rlpVolume,
    directVolume: existing.directVolume + input.directVolume,
    auctionVolume: existing.auctionVolume + input.auctionVolume,
    unknownVolume: existing.unknownVolume + input.neutralVolume,
    tradeCount: existing.tradeCount + 1,
  };

  rawLevels.set(input.price, next);
  totalVolume += input.quantity;
  tradeCount += 1;
  if (next.totalVolume >= pocVolume) {
    pocVolume = next.totalVolume;
    pocPrice = input.price;
  }

  useHistoricalVolumeProfileStore.setState({
    ...buildProfile(),
    totalVolume,
    tradeCount,
    sessionId: event.sessionId,
  });
});

eventBus.on<MarketProjectionResetEvent>(MARKET_DATA_PROJECTION_EVENTS.PROJECTION_RESET, () => {
  useHistoricalVolumeProfileStore.getState().reset();
});

function buildProfile(): Pick<HistoricalVolumeProfileState, 'levels' | 'poc' | 'vah' | 'val'> {
  if (rawLevels.size === 0) return { levels: [], poc: 0, vah: 0, val: 0 };
  const maxVolume = Math.max(1, pocVolume);
  const sortedAscending = Array.from(rawLevels.entries()).sort(([a], [b]) => a - b);
  const { vah, val } = computeValueArea(sortedAscending);

  return {
    poc: pocPrice,
    vah,
    val,
    levels: sortedAscending
      .slice()
      .reverse()
      .map(([price, data]) => ({
        price,
        totalVolume: data.totalVolume,
        buyVolume: data.buyVolume,
        sellVolume: data.sellVolume,
        neutralVolume: data.neutralVolume,
        rlpVolume: data.rlpVolume,
        directVolume: data.directVolume,
        auctionVolume: data.auctionVolume,
        unknownVolume: data.unknownVolume,
        tradeCount: data.tradeCount,
        delta: data.buyVolume - data.sellVolume,
        isPOC: price === pocPrice,
        isVAH: price === vah,
        isVAL: price === val,
        isZIM: data.totalVolume >= totalVolume / rawLevels.size * 2,
        barWidth: Math.round((data.totalVolume / maxVolume) * 100),
      })),
  };
}

function computeValueArea(sortedAscending: Array<[number, RawHistoricalVolumeLevel]>): { vah: number; val: number } {
  const pocIndex = sortedAscending.findIndex(([price]) => price === pocPrice);
  if (pocIndex < 0) return { vah: pocPrice, val: pocPrice };
  const target = totalVolume * 0.7;
  let accumulated = sortedAscending[pocIndex][1].totalVolume;
  let low = pocIndex;
  let high = pocIndex;

  while (accumulated < target && (low > 0 || high < sortedAscending.length - 1)) {
    const lowVol = low > 0 ? sortedAscending[low - 1][1].totalVolume : -1;
    const highVol = high < sortedAscending.length - 1 ? sortedAscending[high + 1][1].totalVolume : -1;
    if (lowVol >= highVol) {
      low -= 1;
      accumulated += Math.max(0, lowVol);
    } else {
      high += 1;
      accumulated += Math.max(0, highVol);
    }
  }

  return { val: sortedAscending[low][0], vah: sortedAscending[high][0] };
}
