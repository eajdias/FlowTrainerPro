// panels/Chart8PPanel/AtemporalChart.tsx
// v0 honesto: tape-plot das execucoes (pontos preco x tempo).
// Agregacao range-8 vive em futuro ChartEngine — sem candles fabricados aqui.
import { useTradeStore } from '../../store/tradeStore';
import { PanelShell } from '../PanelShell/PanelShell';

const MAX_DOTS = 60;

export function AtemporalChart() {
  const trades = useTradeStore((s) => s.trades);
  const dots = trades.slice(0, MAX_DOTS).reverse();

  if (dots.length === 0) {
    return (
      <PanelShell title="Gráfico 8P">
        <p>Sem execuções na sessão. Motor de candles 8P pendente.</p>
      </PanelShell>
    );
  }

  const prices = dots.map((t) => t.price);
  const hi = Math.max(...prices);
  const lo = Math.min(...prices);
  const span = hi - lo > 0 ? hi - lo : 1;

  return (
    <PanelShell title="Gráfico 8P">
      <p>
        Tape-plot das últimas {dots.length} execuções (faixa {lo.toFixed(2)}–{hi.toFixed(2)}). Motor
        de candles range-8 pendente.
      </p>
      <ol>
        {dots.map((t) => (
          <li key={t.tradeId}>
            <span
              style={{
                display: 'inline-block',
                width: `${Math.max(2, ((t.price - lo) / span) * 40)}px`,
              }}
            >
              {t.aggressorSide === 'BUY' ? '▲' : '▼'}
            </span>
            <span>
              {t.price.toFixed(2)} × {t.size}
            </span>
          </li>
        ))}
      </ol>
    </PanelShell>
  );
}
