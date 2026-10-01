// panels/TradeHistoryPanel/TradeHistory.tsx
// Histórico de operações do trader: P&L, entrada, saída.
import { usePositionStore } from '../../store/positionStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function TradeHistory() {
  const trades = usePositionStore((s) => s.trades);
  const realized = usePositionStore((s) => s.realizedPnL);

  return (
    <PanelShell title="Histórico Operações">
      <div>
        <span>P&L realizado {realized.toFixed(2)}</span>
        <span>Trades {trades.length}</span>
      </div>
      {trades.length === 0 ? (
        <p>Sem operações encerradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Lado</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Qtd</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td>{t.side}</td>
                <td>{t.entryPrice.toFixed(2)}</td>
                <td>{t.exitPrice !== null ? t.exitPrice.toFixed(2) : 'aberto'}</td>
                <td>{t.size}</td>
                <td>{t.pnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PanelShell>
  );
}
