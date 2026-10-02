// panels/BrokerHistoryPanel/BrokerHistory.tsx
// Histórico de corretoras: replay histórico (prioridade) ou atividade ao vivo
// da sessão (fallback) — alimentado pelo BrokerFlowAnalyzer. Somente leitura.
// Layout padrão VP: valor | barra esticada | % com divisores e zebra.
import { useHistoricalBrokerHistoryStore } from '../../store/historicalBrokerHistoryStore';
import { useBrokerFlowStore } from '../../store/brokerFlowStore';
import { brokerRegistry } from '../../core/marketIdentity/BrokerRegistry';
import { PanelShell } from '../PanelShell/PanelShell';

function fmt(v: number): string {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}mi`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
}

export function BrokerHistory() {
  const historical = useHistoricalBrokerHistoryStore((s) => s.sorted);
  const live = useBrokerFlowStore((s) => s.brokers);

  // 1) Replay histórico tem prioridade quando presente.
  if (historical.length > 0) {
    return (
      <PanelShell title="Histórico de Corretoras" className="ftp-broker-hist">
        <div className="ftp-bh-head">
          <span className="ftp-bh-col-name">Corretora</span>
          <span className="ftp-bh-col-vol">Volume</span>
          <span className="ftp-bh-col-num">Média</span>
          <span className="ftp-bh-col-num">Agressão</span>
          <span className="ftp-bh-col-num">Passivo</span>
        </div>
        <div className="ftp-bh">
          {historical.map((b) => (
            <div key={b.brokerId} className="ftp-bh-row">
              <span className="ftp-bh-name" style={{ color: b.color }}>{b.name}</span>
              <span className="ftp-bh-num">{fmt(b.totalVolume)}</span>
              <span className="ftp-bh-num">{b.avgPrice.toFixed(2)}</span>
              <span className={`ftp-bh-num ${b.aggressionNet >= 0 ? 'is-buy' : 'is-sell'}`}>
                {b.aggressionNet >= 0 ? '+' : ''}{fmt(b.aggressionNet)}
              </span>
              <span className={`ftp-bh-num ${b.passiveNet >= 0 ? 'is-buy' : 'is-sell'}`}>
                {b.passiveNet >= 0 ? '+' : ''}{fmt(b.passiveNet)}
              </span>
            </div>
          ))}
        </div>
      </PanelShell>
    );
  }

  // 2) Fallback: atividade ao vivo da sessão (BrokerFlowAnalyzer).
  if (live.length === 0) {
    return (
      <PanelShell title="Histórico de Corretoras">
        <p>Sem atividade de corretoras na sessão.</p>
      </PanelShell>
    );
  }

  const rows = [...live]
    .sort(
      (a, b) =>
        b.totalBuyVolume + b.totalSellVolume - (a.totalBuyVolume + a.totalSellVolume),
    )
    .slice(0, 16);

  const maxVol = Math.max(
    1,
    ...rows.map((b) => Math.max(b.totalBuyVolume, b.totalSellVolume)),
  );

  return (
    <PanelShell title="Histórico de Corretoras" className="ftp-broker-hist">
      <div className="ftp-bh-head">
        <span className="ftp-bh-col-name">Corretora</span>
        <span className="ftp-bh-col-bar">Compra</span>
        <span className="ftp-bh-col-bar">Venda</span>
        <span className="ftp-bh-col-net">Net</span>
      </div>
      <div className="ftp-bh">
        {rows.map((b) => {
          const broker = b.brokerCode !== null ? brokerRegistry.getBroker(b.brokerCode) : undefined;
          const net = b.aggressiveNetVolume;
          const buyW = (b.totalBuyVolume / maxVol) * 100;
          const sellW = (b.totalSellVolume / maxVol) * 100;
          return (
            <div key={b.brokerKey} className="ftp-bh-row">
              <span className="ftp-bh-name" style={{ color: broker?.primaryColor ?? 'var(--ftp-text-secondary)' }}>
                {b.brokerName}
              </span>
              <div className="ftp-bh-cell is-buy">
                <span className="ftp-bh-val">{fmt(b.totalBuyVolume)}</span>
                <div className="ftp-bh-bar" aria-hidden="true">
                  <div className="ftp-bh-fill" style={{ width: `${Math.max(1, buyW)}%` }} />
                </div>
              </div>
              <div className="ftp-bh-cell is-sell">
                <span className="ftp-bh-val">{fmt(b.totalSellVolume)}</span>
                <div className="ftp-bh-bar" aria-hidden="true">
                  <div className="ftp-bh-fill" style={{ width: `${Math.max(1, sellW)}%` }} />
                </div>
              </div>
              <span className={`ftp-bh-net ${net >= 0 ? 'is-buy' : 'is-sell'}`}>
                {net >= 0 ? '+' : ''}{fmt(net)}
              </span>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
