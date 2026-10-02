// panels/PriceLadderPanel/PriceLadder.tsx
// Escada de preços ±12 níveis: representa marketStore.priceLevels.
// Padrão visual do SuperDOM: heat proporcional nas células de bid/ask.
import { useMarketStore } from '../../store/marketStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function PriceLadder() {
  const levels = useMarketStore((s) => s.priceLevels);

  const maxBid = Math.max(1, ...levels.map((l) => l.bidVolume));
  const maxAsk = Math.max(1, ...levels.map((l) => l.askVolume));

  return (
    <PanelShell title="Price Ladder" className="ftp-ladder">
      <table>
        <thead>
          <tr>
            <th>BidVol</th>
            <th>Preço</th>
            <th>AskVol</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l.price} className={l.isCurrent ? 'ftp-ladder-current' : undefined}>
              <td>
                <span
                  className="ftp-ladder-fill is-bid"
                  style={{ width: `${(l.bidVolume / maxBid) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="ftp-ladder-num">{l.bidVolume || ''}</span>
              </td>
              <td className={l.isCurrent ? 'ftp-ladder-num' : undefined}>
                {l.price.toFixed(2)}
                {l.isCurrent ? ' ◀' : ''}
              </td>
              <td>
                <span
                  className="ftp-ladder-fill is-ask"
                  style={{ width: `${(l.askVolume / maxAsk) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="ftp-ladder-num">{l.askVolume || ''}</span>
              </td>
              <td className={l.delta > 0 ? 'ftp-net-buy' : l.delta < 0 ? 'ftp-net-sell' : undefined}>
                {l.delta || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
