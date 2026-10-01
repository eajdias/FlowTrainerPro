// panels/PriceLadderPanel/PriceLadder.tsx
// Escada de preços ±12 níveis: representa marketStore.priceLevels.
import { useMarketStore } from '../../store/marketStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function PriceLadder() {
  const levels = useMarketStore((s) => s.priceLevels);

  return (
    <PanelShell title="Price Ladder">
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
            <tr key={l.price}>
              <td>{l.bidVolume}</td>
              <td>
                {l.price.toFixed(2)}
                {l.isCurrent ? ' ◀' : ''}
              </td>
              <td>{l.askVolume}</td>
              <td>{l.delta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
