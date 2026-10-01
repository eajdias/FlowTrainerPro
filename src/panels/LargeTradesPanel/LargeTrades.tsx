// panels/LargeTradesPanel/LargeTrades.tsx
// Grandes agressões (>=250, cor da corretora) e médias (>=25).
import { useTradeStore, type TradeRecord } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

export const LARGE_TRADE_MIN = 250;
export const MEDIUM_TRADE_MIN = 25;

function Row({ t }: { t: TradeRecord }) {
  return (
    <tr key={t.tradeId}>
      <td>{t.size}</td>
      <td>{t.price.toFixed(2)}</td>
      <td style={{ color: t.aggressorBrokerColor }}>
        {t.aggressorSide} {t.aggressorBrokerName}
      </td>
    </tr>
  );
}

export function LargeTrades() {
  const trades = useTradeStore((s) => s.trades);
  const big = trades.filter((t) => t.size >= LARGE_TRADE_MIN);

  return (
    <PanelShell title="Histórico ≥250">
      {big.length === 0 ? (
        <p>Sem agressões ≥250 na sessão.</p>
      ) : (
        <table>
          <tbody>
            {big.map((t) => (
              <Row key={t.tradeId} t={t} />
            ))}
          </tbody>
        </table>
      )}
    </PanelShell>
  );
}

export function MediumTrades() {
  const trades = useTradeStore((s) => s.trades);
  const mid = trades.filter((t) => t.size >= MEDIUM_TRADE_MIN && t.size < LARGE_TRADE_MIN);

  return (
    <PanelShell title="Histórico ≥25">
      {mid.length === 0 ? (
        <p>Sem agressões ≥25 na sessão.</p>
      ) : (
        <table>
          <tbody>
            {mid.map((t) => (
              <Row key={t.tradeId} t={t} />
            ))}
          </tbody>
        </table>
      )}
    </PanelShell>
  );
}
