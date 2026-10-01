// store/useBrokerFlow.ts
// Hook oficial do Broker Flow visual (handbook §13):
// brokerFlowStore + seletores. Sem regra de dominio — só composição.

import { useBrokerFlowStore, selectVisibleBrokerFlowBrokers, selectBrokerFlowRankings } from './brokerFlowStore';
import type { BrokerFlowSelectorState } from './brokerFlowStore';

export function useBrokerFlow() {
  const brokers = useBrokerFlowStore((s) => s.brokers);
  const selectedBrokerKey = useBrokerFlowStore((s) => s.selectedBrokerKey);
  const sortField = useBrokerFlowStore((s) => s.sortField);
  const sortDirection = useBrokerFlowStore((s) => s.sortDirection);
  const search = useBrokerFlowStore((s) => s.search);
  const activeOnly = useBrokerFlowStore((s) => s.activeOnly);
  const directionalFilter = useBrokerFlowStore((s) => s.directionalFilter);
  const minimumVolume = useBrokerFlowStore((s) => s.minimumVolume);
  const minimumMarketShare = useBrokerFlowStore((s) => s.minimumMarketShare);
  const selectBroker = useBrokerFlowStore((s) => s.selectBroker);

  const selector: BrokerFlowSelectorState = {
    brokers,
    selectedBrokerKey,
    sortField,
    sortDirection,
    search,
    activeOnly,
    directionalFilter,
    minimumVolume,
    minimumMarketShare,
  };

  return {
    brokers: selectVisibleBrokerFlowBrokers(selector),
    rankings: selectBrokerFlowRankings({ brokers }),
    selectedBrokerKey,
    selectBroker,
  };
}
