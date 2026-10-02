// panels/index.ts — public API for all visualization panels
// Add new panels here as the platform grows (Heatmap, Aggressor Balance, etc.)

export { PriceBook    as BookPanel        } from './BookPanel/PriceBook';
export { TimesAndTrades as TimesTradesPanel } from './TimesTradesPanel/TimesAndTrades';
export { SuperDOM     as SuperDOMPanel    } from './SuperDOMPanel/SuperDOM';
export { VolumeProfile as VolumeProfilePanel } from './VolumeProfilePanel/VolumeProfile';
export { AtemporalChart as Chart8PPanel  } from './Chart8PPanel/AtemporalChart';
export { OrderBookByBroker as OrderBookByBrokerPanel } from './OrderBookByBrokerPanel/OrderBookByBroker';
export { BrokerHistory as BrokerHistoryPanel } from './BrokerHistoryPanel/BrokerHistory';
export { PanelShell                      } from './PanelShell/PanelShell';
export type { PanelShellProps, PanelMode } from './PanelShell/PanelShell';
