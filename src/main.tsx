import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/global.css'
import './assets/theme.css'
import './assets/panels.css'
import { initTraderBridge } from './trader/TraderExecutionBridge'
import { initHistoricalMarketDataProjection } from './core/marketData/projections'
import { initFlowAnalysis } from './core/analytics/flowAnalysis'
import { initCandleFeed } from './core/marketData/candles'
import { initLiveBrokerFlow } from './store/brokerFlowStore'

// Wiring único no boot (todos idempotentes).
initTraderBridge()
initHistoricalMarketDataProjection()
initFlowAnalysis()
initCandleFeed()
initLiveBrokerFlow()

// Clear stale workspace layout if version changed
const APP_VERSION = '6.1'; // bump this to force layout reset
const storedVersion = localStorage.getItem('ftp-version');
if (storedVersion !== APP_VERSION) {
  localStorage.removeItem('flowtrainerpro-workspace');
  localStorage.setItem('ftp-version', APP_VERSION);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

