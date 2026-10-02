import type { ReactNode } from 'react';
import { Badge } from '../ui/designSystem';
import { SessionControls } from './SessionControls';
import { useMarketDataSourceStore } from '../store/marketDataSourceStore';
import { useMarketStore } from '../store/marketStore';
import { useBookStore } from '../store/bookStore';
import { useTrainingSessionStore, type SessionStatus } from '../store/trainingSessionStore';
import { useHistoricalTradeStore } from '../store/historicalTradeStore';
import { useBrokerFlowStore } from '../store/brokerFlowStore';
import type { MarketDataSourceMode } from '../core/marketData/replay';
import './AppShell.css';

export type GlobalSessionStatus = 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'ERROR';

export function getGlobalSessionStatus(input: {
  isRunning: boolean;
  trainingStatus: SessionStatus;
  tickCount: number;
  sourceMode: MarketDataSourceMode;
  hasHistoricalSession: boolean;
}): GlobalSessionStatus {
  if (input.trainingStatus === 'finished') return 'COMPLETED';
  if (input.trainingStatus === 'paused') return 'PAUSED';
  if (input.trainingStatus === 'running' || input.isRunning) return 'RUNNING';
  if (input.sourceMode === 'HISTORICAL_FILE' && input.hasHistoricalSession) return 'READY';
  if (input.tickCount > 0) return 'READY';
  return 'IDLE';
}

function statusVariant(status: GlobalSessionStatus): 'neutral' | 'buy' | 'warning' | 'info' | 'sell' {
  if (status === 'RUNNING') return 'buy';
  if (status === 'PAUSED' || status === 'READY') return 'warning';
  if (status === 'COMPLETED') return 'info';
  if (status === 'ERROR') return 'sell';
  return 'neutral';
}

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AppShell({ children }: { children: ReactNode }) {
  const sourceMode = useMarketDataSourceStore((state) => state.sourceMode);
  const sessionId = useMarketDataSourceStore((state) => state.sessionId);
  const isRunning = useMarketStore((state) => state.isRunning);
  const tickCount = useMarketStore((state) => state.tickCount);
  const cumDelta = useMarketStore((state) => state.cumulativeDelta);
  const flowTradeCount = useMarketStore((state) => state.flowSnapshot.tradesSeen);
  const lastPrice = useBookStore((state) => state.lastPrice);
  const trainingStatus = useTrainingSessionStore((state) => state.status);
  const regime = useTrainingSessionStore((state) => state.currentRegime);
  const historicalTrades = useHistoricalTradeStore((state) => state.totalTrades);
  const historicalSessionId = useHistoricalTradeStore((state) => state.sessionId);
  const brokerFlowStatus = useBrokerFlowStore((state) => state.status);
  const brokerFlowTrades = useBrokerFlowStore((state) => state.latestSnapshot?.processedTradeCount ?? 0);

  const sessionLabel = sessionId ?? historicalSessionId ?? 'default';
  const hasHistoricalSession = sourceMode === 'HISTORICAL_FILE' && Boolean(sessionLabel);
  const sessionStatus = getGlobalSessionStatus({
    isRunning,
    trainingStatus,
    tickCount,
    sourceMode,
    hasHistoricalSession,
  });
  const processedTrades = sourceMode === 'HISTORICAL_FILE' ? historicalTrades : tickCount;
  const warning = sourceMode === 'HISTORICAL_FILE' && !historicalSessionId
    ? 'Arquivo histórico ainda não carregado.'
    : null;

  return (
    <div className="ftp-shell">
      <header className="ftp-topbar">
        <div className="ftp-brand">
          <span className="ftp-brandMark">FT</span>
          <div>
            <strong>FlowTrainerPro</strong>
            <span>Order Flow Cockpit</span>
          </div>
        </div>

        <SessionControls />

        <div className="ftp-priceBlock" aria-label="Último preço">
          <span
            className={`ftp-price${cumDelta > 0 ? ' is-up' : cumDelta < 0 ? ' is-down' : ''}`}
            title="Último preço negociado"
          >
            {lastPrice > 0 ? lastPrice.toFixed(2) : '--'}
          </span>
          <span className={`ftp-delta${cumDelta > 0 ? ' is-up' : cumDelta < 0 ? ' is-down' : ''}`}>
            Δ {cumDelta >= 0 ? '+' : ''}{cumDelta}
          </span>
        </div>

        <div className="ftp-marketState" aria-label="Market state">
          <span className="ftp-stat">
            <span>Sessão</span>
            {sessionLabel}
          </span>
          <span className="ftp-stat ftp-clock" title="Hora local">
            <span>Hora</span>
            {formatClock()}
          </span>
          <Badge variant={statusVariant(sessionStatus)} dot>{sessionStatus}</Badge>
        </div>
      </header>

      <main className="ftp-main">{children}</main>

      <footer className="ftp-statusbar">
        <span className="ftp-statusItem" title="Kernel local da simulação">
          <span className={`ftp-statusDot dot-${sessionStatus.toLowerCase()}`} aria-hidden="true" />
          Kernel {isRunning ? 'ONLINE' : sessionStatus === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
        </span>
        <span className="ftp-statusItem">Replay {sessionStatus}</span>
        <span className="ftp-statusItem">Sessão {sessionLabel}</span>
        <span className="ftp-statusItem">Trades {processedTrades}</span>
        {regime && <span className="ftp-statusItem">Regime {regime}</span>}
        <span className="ftp-statusItem">Flow {flowTradeCount > 0 ? 'ACTIVE' : 'IDLE'}</span>
        <span className="ftp-statusItem">Broker Flow {brokerFlowStatus === 'ready' || brokerFlowTrades > 0 ? 'ACTIVE' : 'IDLE'}</span>
        {warning && <span className="ftp-statusWarning" title={warning}>WARN {warning}</span>}
        <span>v0.0.0</span>
      </footer>
    </div>
  );
}
