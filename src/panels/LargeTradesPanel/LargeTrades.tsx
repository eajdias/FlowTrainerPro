// panels/LargeTradesPanel/LargeTrades.tsx
// Grandes agressões (>=250, cor da corretora) e médias (>=25).
// Leem buffers dedicados do tradeStore (a janela do tape não os descarta).
import { useTradeStore, type TradeRecord, LARGE_MIN, MEDIUM_MIN } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

export const LARGE_TRADE_MIN = LARGE_MIN;
export const MEDIUM_TRADE_MIN = MEDIUM_MIN;

function Row({ t }: { t: TradeRecord }) {
  return (
    <tr key={t.tradeId} className={t.aggressorSide === 'BUY' ? 'is-buy' : 'is-sell'}>
      <td className="ftp-tt-size">{t.size}</td>
      <td>{t.price.toFixed(2)}</td>
      <td style={{ color: t.aggressorBrokerColor }}>
        {t.aggressorSide === 'BUY' ? 'C' : 'V'} {t.aggressorBrokerName}
      </td>
    </tr>
  );
}

export function LargeTrades() {
  const big = useTradeStore((s) => s.largeTrades);

  return (
    <PanelShell title={`Histórico ≥${LARGE_TRADE_MIN}`} className="ftp-tt">
      {big.length === 0 ? (
        <p>Sem agressões ≥{LARGE_TRADE_MIN} na sessão.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Qtd</th>
              <th>Preço</th>
              <th>Agressor</th>
            </tr>
          </thead>
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
  const mid = useTradeStore((s) => s.mediumTrades);

  return (
    <PanelShell title={`Histórico ≥${MEDIUM_TRADE_MIN}`} className="ftp-tt">
      {mid.length === 0 ? (
        <p>Sem agressões ≥{MEDIUM_TRADE_MIN} na sessão.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Qtd</th>
              <th>Preço</th>
              <th>Agressor</th>
            </tr>
          </thead>
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
