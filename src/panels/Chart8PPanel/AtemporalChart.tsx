// panels/Chart8PPanel/AtemporalChart.tsx
// Gráfico 8P: candles range-8 ancorados à direita + linhas de referência do dia
// (Máx/Mín/VWAP/Abertura) + barras de agressão por candle (C/V proporcionais).
// Coordenadas: `top(price)` = 0 no topo; conversão para `bottom` na renderização.
import { useEffect, useRef, useState } from 'react';
import { getCandleEngine, RANGE_SIZE, type RangeCandle } from '../../core/marketData/candles';
import { useMarketStore } from '../../store/marketStore';
import { PanelShell } from '../PanelShell/PanelShell';

const PAD_BOTTOM = 18; // lane inferior para as barras de agressão
const MAX_CANDLES = 90;
const CANDLE_W = 13;

type RefLine = { key: string; price: number; label: string; tone: 'buy' | 'sell' | 'info' | 'special' };

function CandleView({
  c,
  min,
  max,
  chartH,
  maxVol,
}: {
  c: RangeCandle;
  min: number;
  max: number;
  chartH: number;
  maxVol: number;
}) {
  const range = max - min || 1;
  /** Distância do topo (0 = topo do gráfico). */
  const top = (price: number): number => ((max - price) / range) * chartH;

  const bodyTop = top(Math.max(c.open, c.close));
  const bodyBottom = top(Math.min(c.open, c.close));
  const bodyH = Math.max(3, bodyBottom - bodyTop);
  const isUp = c.close >= c.open;
  const color = isUp ? 'var(--ftp-buy-primary)' : 'var(--ftp-sell-primary)';

  const total = c.buyVolume + c.sellVolume;
  const buyPct = total > 0 ? Math.round((c.buyVolume / total) * 100) : 50;
  const aggH = maxVol > 0 ? Math.max(4, Math.min(16, (total / maxVol) * 16)) : 4;
  const isAbsorb = maxVol > 0 && total >= maxVol * 0.75 && (c.high - c.low) < 3;

  return (
    <div
      className={`ftp-candle${c.closed ? '' : ' is-forming'}${isAbsorb ? ' is-absorb' : ''}`}
      style={{ width: CANDLE_W, height: chartH }}
      title={`O ${c.open.toFixed(2)} · H ${c.high.toFixed(2)} · L ${c.low.toFixed(2)} · C ${c.close.toFixed(2)} — C${c.buyVolume}/V${c.sellVolume} (${buyPct}% compra)${isAbsorb ? ' · absorção' : ''}`}
    >
      <div className="ftp-candle-wick" style={{ top: top(c.high), height: Math.max(1, top(c.low) - top(c.high)), background: color }} />
      <div className="ftp-candle-body" style={{ top: bodyTop, height: bodyH, background: color, borderColor: color }} />
      <div className="ftp-candle-agg" style={{ height: aggH }} aria-hidden="true">
        <div className="ftp-candle-agg-buy" style={{ height: `${buyPct}%` }} />
        <div className="ftp-candle-agg-sell" style={{ height: `${100 - buyPct}%` }} />
      </div>
    </div>
  );
}

export function AtemporalChart() {
  const dayOpen = useMarketStore((s) => s.dayOpen);
  const dayHigh = useMarketStore((s) => s.dayHigh);
  const dayLow = useMarketStore((s) => s.dayLow);
  const dayVwap = useMarketStore((s) => s.dayVwap);
  const sessionVolume = useMarketStore((s) => s.sessionVolume);

  const [candles, setCandles] = useState<RangeCandle[]>(() => getCandleEngine().snapshot());
  const [chartH, setChartH] = useState(120);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCandles(getCandleEngine().snapshot()), 500);
    return () => clearInterval(id);
  }, []);

  const hasCandles = candles.length > 0;

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = (): void => {
      setChartH(Math.max(60, el.clientHeight - PAD_BOTTOM - 2));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasCandles]);

  if (!hasCandles) {
    return (
      <PanelShell title="Gráfico 8P" className="ftp-chart-panel">
        <p>Sem execuções na sessão. Inicie o replay para desenhar o gráfico.</p>
      </PanelShell>
    );
  }

  const visible = candles.slice(-MAX_CANDLES);
  // Escala pelos candles visíveis (referências distantes não achatam o gráfico).
  const prices = visible.flatMap((c) => [c.high, c.low]);
  const rawMax = Math.max(...prices);
  const rawMin = Math.min(...prices);
  // Padding generoso (18%): candles range-8 ocupam a janela sem parecer "colunas".
  const pad = Math.max(1.2, (rawMax - rawMin) * 0.18);
  const max = rawMax + pad;
  const min = rawMin - pad;
  const range = max - min || 1;
  /** Distância do topo (0 = topo do gráfico). */
  const topOf = (price: number): number => ((max - price) / range) * chartH;
  const maxVol = Math.max(1, ...visible.map((c) => c.buyVolume + c.sellVolume));

  const closedCount = candles.filter((c) => c.closed).length;
  const forming = candles[candles.length - 1]?.closed ? null : candles[candles.length - 1];
  const progress = forming ? Math.min(1, (forming.high - forming.low) / RANGE_SIZE) : 0;

  // Linhas de referência: desenhadas apenas quando dentro do range visível.
  // Cores: Máx em verde, Mín em vermelho (por preferência do produto).
  const lines: RefLine[] = [
    dayHigh > 0 ? { key: 'high', price: dayHigh, label: `Máx ${dayHigh.toFixed(2)}`, tone: 'buy' } : null,
    dayVwap > 0 ? { key: 'vwap', price: dayVwap, label: `VWAP ${dayVwap.toFixed(2)}`, tone: 'info' } : null,
    dayOpen > 0 ? { key: 'open', price: dayOpen, label: `Abert ${dayOpen.toFixed(2)}`, tone: 'special' } : null,
    dayLow > 0 ? { key: 'low', price: dayLow, label: `Mín ${dayLow.toFixed(2)}`, tone: 'sell' } : null,
  ]
    .filter((l): l is RefLine => l !== null)
    .filter((l) => l.price >= min && l.price <= max);

  return (
    <PanelShell title="Gráfico 8P" className="ftp-chart-panel">
      <div className="ftp-chart8p-info">
        <span>{closedCount} candles</span>
        <span className="ftp-chart8p-refs">
          <em className="is-buy">Máx {dayHigh > 0 ? dayHigh.toFixed(2) : '--'}</em>
          <em className="is-sell">Mín {dayLow > 0 ? dayLow.toFixed(2) : '--'}</em>
          <em className="is-info">VWAP {dayVwap > 0 ? dayVwap.toFixed(2) : '--'}</em>
          <em className="is-special">Abert {dayOpen > 0 ? dayOpen.toFixed(2) : '--'}</em>
        </span>
        <span>
          {forming
            ? `formando ${forming.low.toFixed(2)}–${forming.high.toFixed(2)} (${Math.round(progress * 100)}%)`
            : '—'}
        </span>
        <span className="ftp-chart8p-vol">vol {sessionVolume.toLocaleString('pt-BR')}</span>
      </div>
      <div className="ftp-chart8p" ref={chartRef}>
        {visible.map((c, i) => (
          <CandleView
            key={`${c.startTimestamp}-${i}`}
            c={c}
            min={min}
            max={max}
            chartH={chartH}
            maxVol={maxVol}
          />
        ))}
        {lines.map((l) => (
          <div
            key={l.key}
            className={`ftp-chart-hline is-${l.tone}`}
            style={{ bottom: `${PAD_BOTTOM + (chartH - topOf(l.price))}px` }}
          >
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
