import type { ReactNode } from 'react';
import { Badge, Button, Icon } from '../ui/designSystem';
import { useMarketDataSourceStore } from '../store/marketDataSourceStore';
import { useMarketStore } from '../store/marketStore';
import { useBookStore } from '../store/bookStore';
import { useTrainingSessionStore, type SessionStatus } from '../store/trainingSessionStore';
import { useHistoricalTradeStore } from '../store/historicalTradeStore';
import { useBrokerFlowStore } from '../store/brokerFlowStore';
import type { MarketDataSourceMode } from '../core/marketData/replay';
import './AppShell.css';

export type AppRoute = 'dashboard' | 'academy' | 'training' | 'analysis';

type AppShellProps = {
  current: AppRoute;
  onNavigate: (section: AppRoute) => void;
  children: ReactNode;
};

const ROUTES: Array<{ id: AppRoute; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'academy', label: 'Academy' },
  { id: 'training', label: 'Training' },
  { id: 'analysis', label: 'Analysis' },
];

export type GlobalSessionStatus = 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'ERROR';

type SourceMeta = {
  label: 'SYNTHETIC' | 'SCENARIO' | 'HISTORICAL' | 'LIVE FUTURE';
  icon: string;
  variant: 'neutral' | 'info' | 'special' | 'warning';
  tooltip: string;
};

const SOURCE_META: Record<MarketDataSourceMode, SourceMeta> = {
  SYNTHETIC: {
    label: 'SYNTHETIC',
    icon: 'DB',
    variant: 'neutral',
    tooltip: 'Mercado gerado pelo simulador.',
  },
  SCENARIO: {
    label: 'SCENARIO',
    icon: 'SC',
    variant: 'info',
    tooltip: 'Cenário didático controlado.',
  },
  HISTORICAL_FILE: {
    label: 'HISTORICAL',
    icon: 'HF',
    variant: 'special',
    tooltip: 'Replay baseado em negócios históricos importados.',
  },
  LIVE_FUTURE: {
    label: 'LIVE FUTURE',
    icon: 'LF',
    variant: 'warning',
    tooltip: 'Fonte reservada para integração futura com mercado ao vivo.',
  },
};

export function getSourceMeta(sourceMode: MarketDataSourceMode): SourceMeta {
  return SOURCE_META[sourceMode];
}

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

export function AppShell({ current, onNavigate, children }: AppShellProps) {
  const sourceMode = useMarketDataSourceStore((state) => state.sourceMode);
  const sessionId = useMarketDataSourceStore((state) => state.sessionId);
  const isRunning = useMarketStore((state) => state.isRunning);
  const tickCount = useMarketStore((state) => state.tickCount);
  const flowTradeCount = useMarketStore((state) => state.flowSnapshot.tradesSeen);
  const lastPrice = useBookStore((state) => state.lastPrice);
  const trainingStatus = useTrainingSessionStore((state) => state.status);
  const historicalTrades = useHistoricalTradeStore((state) => state.totalTrades);
  const historicalSessionId = useHistoricalTradeStore((state) => state.sessionId);
  const brokerFlowStatus = useBrokerFlowStore((state) => state.status);
  const brokerFlowTrades = useBrokerFlowStore((state) => state.latestSnapshot?.processedTradeCount ?? 0);

  const source = getSourceMeta(sourceMode);
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

        <div className="ftp-marketContext" aria-label="Contexto de mercado">
          <div className="ftp-instrument" title="Nenhum ativo carregado por um fluxo homologado.">
            <span className="ftp-kicker">Ativo</span>
            <strong>Nenhum ativo</strong>
            <span>{source.label}</span>
          </div>

          <div className="ftp-sourceModes" aria-label="Source mode">
            {(Object.keys(SOURCE_META) as MarketDataSourceMode[]).map((mode) => {
              const meta = getSourceMeta(mode);
              const active = mode === sourceMode;
              return (
                <button
                  key={mode}
                  type="button"
                  className={`ftp-sourceButton ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  disabled={!active}
                  title={active ? meta.tooltip : `${meta.tooltip} Troca de fonte exige fluxo dedicado para evitar perda de estado.`}
                >
                  <span className="ftp-sourceIcon" aria-hidden="true">{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <nav className="ftp-nav" aria-label="Main navigation">
          {ROUTES.map((route) => (
            <Button
              key={route.id}
              variant={current === route.id ? 'primary' : 'ghost'}
              onClick={() => onNavigate(route.id)}
              aria-current={current === route.id ? 'page' : undefined}
            >
              {route.label}
            </Button>
          ))}
        </nav>

        <div className="ftp-marketState" aria-label="Market state">
          <Badge variant={source.variant} title={source.tooltip}>{source.label}</Badge>
          <span className="ftp-stat">
            <span>Sessão</span>
            {sessionLabel}
          </span>
          <span className="ftp-stat">
            <span>Último</span>
            {lastPrice > 0 ? lastPrice.toFixed(2) : '--'}
          </span>
          <span className="ftp-stat ftp-clock" title="Hora local">
            <span>Hora</span>
            {formatClock()}
          </span>
          <Badge variant={statusVariant(sessionStatus)}>{sessionStatus}</Badge>
          <button
            type="button"
            className="ftp-actionButton"
            title="Importação histórica: abrir a estação de training (painel Replay Player)."
            aria-label="Importar"
            onClick={() => onNavigate('training')}
          >
            <Icon name="import" label="Importar" />
          </button>
        </div>
      </header>

      <main className="ftp-main">{children}</main>

      <footer className="ftp-statusbar">
        <span className="ftp-statusItem" title="Kernel local da simulação">
          <span className={`ftp-statusDot dot-${sessionStatus.toLowerCase()}`} aria-hidden="true" />
          Kernel {isRunning ? 'ONLINE' : sessionStatus === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
        </span>
        <span className="ftp-statusItem" title={source.tooltip}>Fonte {source.label}</span>
        <span className="ftp-statusItem">Replay {sessionStatus}</span>
        <span className="ftp-statusItem">Sessão {sessionLabel}</span>
        <span className="ftp-statusItem">Trades {processedTrades}</span>
        <span className="ftp-statusItem">Flow {flowTradeCount > 0 ? 'ACTIVE' : 'IDLE'}</span>
        <span className="ftp-statusItem">Broker Flow {brokerFlowStatus === 'ready' || brokerFlowTrades > 0 ? 'ACTIVE' : 'IDLE'}</span>
        {warning && <span className="ftp-statusWarning" title={warning}>WARN {warning}</span>}
        <span>v0.0.0</span>
      </footer>
    </div>
  );
}
