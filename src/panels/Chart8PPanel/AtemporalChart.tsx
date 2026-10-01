// panels/Chart8PPanel/AtemporalChart.tsx
// Gráfico 8P: candles range (fecha com high-low >= 4.00) + saldo de agressão.
// Motor: RangeCandleEngine alimentado por execuções (candleFeed).
import { useEffect, useState } from 'react';
import { getCandleEngine, type RangeCandle } from '../../core/marketData/candles';
import { PanelShell } from '../PanelShell/PanelShell';

function AggressionBar({ c }: { c: RangeCandle }) {
  const total = c.buyVolume + c.sellVolume;
  const buyPct = total > 0 ? Math.round((c.buyVolume / total) * 100) : 50;
  return (
    <span aria-label={`agressão C${c.buyVolume} V${c.sellVolume}`}>
      C{c.buyVolume}/V{c.sellVolume} ({buyPct}%)
    </span>
  );
}

export function AtemporalChart() {
  const [candles, setCandles] = useState<RangeCandle[]>(() => getCandleEngine().snapshot());

  useEffect(() => {
    const id = setInterval(() => setCandles(getCandleEngine().snapshot()), 500);
    return () => clearInterval(id);
  }, []);

  if (candles.length === 0) {
    return (
      <PanelShell title="Gráfico 8P">
        <p>Sem execuções na sessão.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Gráfico 8P">
      <ul>
        {candles.map((c, i) => (
          <li
            key={`${c.startTimestamp}-${i}`}
            style={c.closed ? undefined : { borderStyle: 'dashed' }}
            title={c.closed ? 'candle fechado' : 'candle em formação'}
          >
            <span>
              O{c.open.toFixed(2)} H{c.high.toFixed(2)} L{c.low.toFixed(2)} C{c.close.toFixed(2)}
            </span>{' '}
            <AggressionBar c={c} />
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}
