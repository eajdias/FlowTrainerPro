// trader/index.ts
// Public API do Universo do Trader.
// Toda interface usa APENAS os exports daqui.

export { placeOrder, buyMarket, sellMarket, flattenPosition, cancelOrder, cancelAll, TRADER_EVENTS } from './TradingController';
export { initTraderBridge } from './TraderExecutionBridge';
