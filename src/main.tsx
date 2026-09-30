import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/global.css'

// Clear stale workspace layout if version changed
const APP_VERSION = '5.0'; // bump this to force layout reset
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

