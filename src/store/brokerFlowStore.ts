import { create } from 'zustand';
import type { MarketDataSourceMode } from '../core/marketData/replay';
import type { BrokerFlowMarketSnapshot, BrokerFlowSnapshot } from '../core/analytics/brokerFlow';

export type BrokerFlowWindowKey = '1s' | '5s' | '15s' | '30s' | '60s' | '5min' | 'session';
export type BrokerFlowSortField =
  | 'brokerName'
  | 'totalVolume'
  | 'aggressiveBuyVolume'
  | 'aggressiveSellVolume'
  | 'aggressiveNetVolume'
  | 'marketShare'
  | 'activityRate'
  | 'persistenceScore'
  | 'largestTrade'
  | 'lastActivityTimestamp';
export type BrokerFlowSortDirection = 'asc' | 'desc';
export type BrokerFlowDirectionalFilter = 'all' | 'buyer' | 'seller' | 'aggressive' | 'rlp';
export type BrokerFlowViewMode = 'ESSENTIAL' | 'ADVANCED' | 'COMPLETE';
export type BrokerFlowStatus = 'idle' | 'ready' | 'empty';

export interface BrokerFlowRankingSummary {
  readonly mostActive: BrokerFlowSnapshot | null;
  readonly mostAggressiveBuyer: BrokerFlowSnapshot | null;
  readonly mostAggressiveSeller: BrokerFlowSnapshot | null;
  readonly largestPositiveAggressiveNet: BrokerFlowSnapshot | null;
  readonly largestNegativeAggressiveNet: BrokerFlowSnapshot | null;
  readonly highestPersistence: BrokerFlowSnapshot | null;
  readonly highestActivityRate: BrokerFlowSnapshot | null;
  readonly largestTrade: BrokerFlowSnapshot | null;
}

interface BrokerFlowState {
  readonly latestSnapshot: BrokerFlowMarketSnapshot | null;
  readonly brokers: readonly BrokerFlowSnapshot[];
  readonly selectedBrokerKey: string | null;
  readonly selectedWindow: BrokerFlowWindowKey;
  readonly sortField: BrokerFlowSortField;
  readonly sortDirection: BrokerFlowSortDirection;
  readonly search: string;
  readonly activeOnly: boolean;
  readonly directionalFilter: BrokerFlowDirectionalFilter;
  readonly minimumVolume: number;
  readonly minimumMarketShare: number;
  readonly viewMode: BrokerFlowViewMode;
  readonly sourceMode: MarketDataSourceMode | null;
  readonly sessionId: string | null;
  readonly lastUpdateTimestamp: number | null;
  readonly status: BrokerFlowStatus;
}

interface BrokerFlowActions {
  readonly receiveSnapshot: (snapshot: BrokerFlowMarketSnapshot) => void;
  readonly reset: () => void;
  readonly selectBroker: (brokerKey: string | null) => void;
  readonly setSelectedWindow: (selectedWindow: BrokerFlowWindowKey) => void;
  readonly setSort: (sortField: BrokerFlowSortField) => void;
  readonly setSortDirection: (sortDirection: BrokerFlowSortDirection) => void;
  readonly setSearch: (search: string) => void;
  readonly setActiveOnly: (activeOnly: boolean) => void;
  readonly setDirectionalFilter: (directionalFilter: BrokerFlowDirectionalFilter) => void;
  readonly setMinimumVolume: (minimumVolume: number) => void;
  readonly setMinimumMarketShare: (minimumMarketShare: number) => void;
  readonly setViewMode: (viewMode: BrokerFlowViewMode) => void;
}

export type BrokerFlowStoreState = BrokerFlowState & BrokerFlowActions;
export type BrokerFlowSelectorState = Pick<
  BrokerFlowState,
  | 'brokers'
  | 'selectedBrokerKey'
  | 'sortField'
  | 'sortDirection'
  | 'search'
  | 'activeOnly'
  | 'directionalFilter'
  | 'minimumVolume'
  | 'minimumMarketShare'
>;

const INITIAL_STATE: BrokerFlowState = Object.freeze({
  latestSnapshot: null,
  brokers: Object.freeze([]),
  selectedBrokerKey: null,
  selectedWindow: 'session',
  sortField: 'totalVolume',
  sortDirection: 'desc',
  search: '',
  activeOnly: false,
  directionalFilter: 'all',
  minimumVolume: 0,
  minimumMarketShare: 0,
  viewMode: 'ESSENTIAL',
  sourceMode: null,
  sessionId: null,
  lastUpdateTimestamp: null,
  status: 'idle',
});

export const useBrokerFlowStore = create<BrokerFlowStoreState>((set) => ({
  ...INITIAL_STATE,

  receiveSnapshot: (snapshot) => set((state) => {
    const brokers = snapshot.brokers;
    const selectedStillExists = state.selectedBrokerKey
      ? brokers.some((broker) => broker.brokerKey === state.selectedBrokerKey)
      : false;

    return {
      latestSnapshot: snapshot,
      brokers,
      selectedBrokerKey: selectedStillExists ? state.selectedBrokerKey : null,
      sourceMode: snapshot.sourceMode,
      sessionId: snapshot.sessionId,
      lastUpdateTimestamp: snapshot.timestamp,
      status: brokers.length > 0 ? 'ready' : 'empty',
    };
  }),

  reset: () => set({ ...INITIAL_STATE }),
  selectBroker: (selectedBrokerKey) => set({ selectedBrokerKey }),
  setSelectedWindow: (selectedWindow) => set({ selectedWindow }),
  setSort: (sortField) => set((state) => ({
    sortField,
    sortDirection: state.sortField === sortField && state.sortDirection === 'desc' ? 'asc' : 'desc',
  })),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setSearch: (search) => set({ search }),
  setActiveOnly: (activeOnly) => set({ activeOnly }),
  setDirectionalFilter: (directionalFilter) => set({ directionalFilter }),
  setMinimumVolume: (minimumVolume) => set({ minimumVolume: Math.max(0, minimumVolume) }),
  setMinimumMarketShare: (minimumMarketShare) => set({ minimumMarketShare: Math.max(0, minimumMarketShare) }),
  setViewMode: (viewMode) => set({ viewMode }),
}));

export function selectVisibleBrokerFlowBrokers(state: BrokerFlowSelectorState): readonly BrokerFlowSnapshot[] {
  const search = normalizeSearch(state.search);
  const filtered = state.brokers.filter((broker) => {
    const totalVolume = broker.totalBuyVolume + broker.totalSellVolume;
    if (search && !matchesBrokerSearch(broker, search)) return false;
    if (state.activeOnly && totalVolume <= 0) return false;
    if (state.minimumVolume > 0 && totalVolume < state.minimumVolume) return false;
    if (state.minimumMarketShare > 0 && broker.marketShare < state.minimumMarketShare) return false;
    if (!passesDirectionalFilter(broker, state.directionalFilter)) return false;
    return true;
  });

  return stableSort(filtered, (a, b) => compareByField(a, b, state.sortField, state.sortDirection));
}

export function selectSelectedBrokerFlowBroker(state: BrokerFlowSelectorState): BrokerFlowSnapshot | null {
  if (!state.selectedBrokerKey) return null;
  return state.brokers.find((broker) => broker.brokerKey === state.selectedBrokerKey) ?? null;
}

export function selectBrokerFlowRankings(state: Pick<BrokerFlowState, 'brokers'>): BrokerFlowRankingSummary {
  const brokers = state.brokers;
  return {
    mostActive: topBroker(brokers, (broker) => broker.totalBuyVolume + broker.totalSellVolume),
    mostAggressiveBuyer: topBroker(brokers, (broker) => broker.aggressiveBuyVolume),
    mostAggressiveSeller: topBroker(brokers, (broker) => broker.aggressiveSellVolume),
    largestPositiveAggressiveNet: topBroker(brokers, (broker) => Math.max(0, broker.aggressiveNetVolume)),
    largestNegativeAggressiveNet: topBroker(brokers, (broker) => Math.max(0, -broker.aggressiveNetVolume)),
    highestPersistence: topBroker(brokers, (broker) => broker.persistenceScore),
    highestActivityRate: topBroker(brokers, (broker) => broker.activityRate),
    largestTrade: topBroker(brokers, largestTrade),
  };
}

function normalizeSearch(search: string): string {
  return search.trim().toLocaleLowerCase('pt-BR');
}

function matchesBrokerSearch(broker: BrokerFlowSnapshot, search: string): boolean {
  return broker.brokerName.toLocaleLowerCase('pt-BR').includes(search)
    || String(broker.brokerCode ?? '').includes(search)
    || broker.brokerKey.toLocaleLowerCase('pt-BR').includes(search);
}

function passesDirectionalFilter(broker: BrokerFlowSnapshot, filter: BrokerFlowDirectionalFilter): boolean {
  switch (filter) {
    case 'buyer':
      return broker.aggressiveNetVolume > 0;
    case 'seller':
      return broker.aggressiveNetVolume < 0;
    case 'aggressive':
      return broker.aggressiveBuyVolume + broker.aggressiveSellVolume > 0;
    case 'rlp':
      return broker.rlpBuyVolume + broker.rlpSellVolume > 0;
    case 'all':
    default:
      return true;
  }
}

function compareByField(
  a: BrokerFlowSnapshot,
  b: BrokerFlowSnapshot,
  field: BrokerFlowSortField,
  direction: BrokerFlowSortDirection,
): number {
  const multiplier = direction === 'asc' ? 1 : -1;
  if (field === 'brokerName') {
    return multiplier * a.brokerName.localeCompare(b.brokerName, 'pt-BR');
  }
  return multiplier * (fieldValue(a, field) - fieldValue(b, field));
}

function fieldValue(broker: BrokerFlowSnapshot, field: BrokerFlowSortField): number {
  switch (field) {
    case 'totalVolume':
      return broker.totalBuyVolume + broker.totalSellVolume;
    case 'aggressiveBuyVolume':
      return broker.aggressiveBuyVolume;
    case 'aggressiveSellVolume':
      return broker.aggressiveSellVolume;
    case 'aggressiveNetVolume':
      return broker.aggressiveNetVolume;
    case 'marketShare':
      return broker.marketShare;
    case 'activityRate':
      return broker.activityRate;
    case 'persistenceScore':
      return broker.persistenceScore;
    case 'largestTrade':
      return largestTrade(broker);
    case 'lastActivityTimestamp':
      return broker.lastActivityTimestamp ?? 0;
    case 'brokerName':
    default:
      return 0;
  }
}

function largestTrade(broker: BrokerFlowSnapshot): number {
  return Math.max(
    broker.largestBuyTrade,
    broker.largestSellTrade,
    broker.largestAggressiveBuy,
    broker.largestAggressiveSell,
  );
}

function topBroker(
  brokers: readonly BrokerFlowSnapshot[],
  score: (broker: BrokerFlowSnapshot) => number,
): BrokerFlowSnapshot | null {
  let best: BrokerFlowSnapshot | null = null;
  let bestScore = 0;
  for (const broker of brokers) {
    const value = score(broker);
    if (value > bestScore) {
      best = broker;
      bestScore = value;
    }
  }
  return best;
}

function stableSort<T>(items: readonly T[], compare: (a: T, b: T) => number): readonly T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const result = compare(a.item, b.item);
      return result === 0 ? a.index - b.index : result;
    })
    .map(({ item }) => item);
}
