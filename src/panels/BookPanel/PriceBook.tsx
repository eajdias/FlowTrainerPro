// panels/BookPanel/PriceBook.tsx
// Livro de ofertas: representa bookStore. Sem regra de negocio.
import { useBookStore } from '../../store/bookStore';
import { PanelShell } from '../PanelShell/PanelShell';

function fmt(n: number): string {
  return n > 0 ? n.toFixed(2) : '--';
}

export function PriceBook() {
  const bids = useBookStore((s) => s.bids);
  const asks = useBookStore((s) => s.asks);
  const bestBid = useBookStore((s) => s.bestBid);
  const bestAsk = useBookStore((s) => s.bestAsk);
  const spread = useBookStore((s) => s.spread);
  const lastPrice = useBookStore((s) => s.lastPrice);

  if (bids.length === 0 && asks.length === 0) {
    return (
      <PanelShell title="Book">
        <p>Book indisponível para a fonte atual.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Book">
      <div>
        <span>Bid {fmt(bestBid)}</span>
        <span>Ask {fmt(bestAsk)}</span>
        <span>Spread {spread.toFixed(2)}</span>
        <span>Último {fmt(lastPrice)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>BidVol</th>
            <th>Bid</th>
            <th>Ask</th>
            <th>AskVol</th>
          </tr>
        </thead>
        <tbody>
          {asks
            .slice()
            .reverse()
            .map((a) => (
              <tr key={`a-${a.price}`}>
                <td />
                <td />
                <td>{a.price.toFixed(2)}</td>
                <td>{a.size}</td>
              </tr>
            ))}
          {bids.map((b) => (
            <tr key={`b-${b.price}`}>
              <td>{b.size}</td>
              <td>{b.price.toFixed(2)}</td>
              <td />
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
