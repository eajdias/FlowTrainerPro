// panels/VolumeProfilePanel/VolumeProfile.tsx
// Volume Profile estilo SuperDOM: células com fundo proporcional (espelhadas —
// agressão cresce da direita, absorção da esquerda), % por lado, total por nível,
// TOP 5 zonas quentes com gradiente e POC/VAH/VAL. Preço atual marcado.
import { useEffect, useRef } from 'react';
import { useVolumeProfileStore } from '../../store/volumeProfileStore';
import { useBookStore } from '../../store/bookStore';
import { PanelShell } from '../PanelShell/PanelShell';

function fmt(v: number): string {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}mi`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
}

export function VolumeProfile() {
  const levels = useVolumeProfileStore((s) => s.levels);
  const poc = useVolumeProfileStore((s) => s.poc);
  const vah = useVolumeProfileStore((s) => s.vah);
  const val = useVolumeProfileStore((s) => s.val);
  const lastPrice = useBookStore((s) => s.lastPrice);

  // ── Auto-follow: mantém a linha do preço atual visível (com trava manual) ──
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const lockedUntil = useRef(0);
  const programmatic = useRef(false);

  const onScroll = (): void => {
    if (!programmatic.current) lockedUntil.current = Date.now() + 6000;
  };

  useEffect(() => {
    if (Date.now() < lockedUntil.current) return;
    const wrap = wrapRef.current?.closest<HTMLElement>('.ftp-panel-body');
    const row = wrapRef.current?.querySelector<HTMLElement>('.ftp-vp2-row.is-current');
    if (!wrap || !row) return;
    const wrapRect = wrap.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const rowTop = rowRect.top - wrapRect.top + wrap.scrollTop;
    const rowBottom = rowTop + rowRect.height;
    const viewTop = wrap.scrollTop;
    const viewBottom = viewTop + wrap.clientHeight;
    if (rowTop < viewTop + 12 || rowBottom > viewBottom - 12) {
      programmatic.current = true;
      wrap.scrollTo({ top: rowTop - wrap.clientHeight / 2, behavior: 'smooth' });
      setTimeout(() => { programmatic.current = false; }, 700);
    }
  }, [lastPrice]);

  if (levels.length === 0) {
    return (
      <PanelShell title="Volume Profile" className="ftp-vp-panel">
        <p>Sem execuções na sessão.</p>
      </PanelShell>
    );
  }

  const deltaTotal = levels.reduce((acc, l) => acc + (l.buyVolume - l.sellVolume), 0);

  const maxBuy = Math.max(1, ...levels.map((l) => l.buyVolume));
  const maxSell = Math.max(1, ...levels.map((l) => l.sellVolume));

  // TOP 5 zonas mais quentes: ranks por volume total para o gradiente de destaque.
  const top5 = [...levels]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 5)
    .map((l) => l.price);
  const heatRank = new Map<number, number>();
  top5.forEach((price, i) => heatRank.set(price, i + 1)); // 1 = mais quente

  return (
    <PanelShell title="Volume Profile" className="ftp-vp-panel">
      <div className="ftp-vp-summary">
        <span>
          <i className="ftp-vp-dot is-poc" /> POC <strong>{poc.toFixed(2)}</strong>
        </span>
        <span>
          <i className="ftp-vp-dot is-vah" /> VAH {vah.toFixed(2)}
        </span>
        <span>
          <i className="ftp-vp-dot is-val" /> VAL {val.toFixed(2)}
        </span>
        <span className={`ftp-vp-delta ${deltaTotal >= 0 ? 'is-buy' : 'is-sell'}`}>
          Δ {deltaTotal >= 0 ? '+' : ''}{fmt(Math.abs(deltaTotal))}{deltaTotal >= 0 ? ' compra' : ' venda'}
        </span>
      </div>

      <div className="ftp-vp2-head">
        <span className="ftp-vp2-col-price">Preço</span>
        <span className="ftp-vp2-col-buy">Agressão</span>
        <span className="ftp-vp2-col-sell">Absorção</span>
        <span className="ftp-vp2-col-total">Total</span>
      </div>

      <div className="ftp-vp2" role="list" aria-label="Perfil de volume por preço" ref={wrapRef} onScroll={onScroll}>
        {levels.map((l) => {
          const inVA = val > 0 && vah > 0 && l.price <= vah && l.price >= val;
          const isCurrent = lastPrice > 0 && Math.abs(l.price - lastPrice) < 0.26;
          const rank = heatRank.get(l.price);
          const buyPct = l.totalVolume > 0 ? Math.round((l.buyVolume / l.totalVolume) * 100) : 50;
          const sellPct = 100 - buyPct;
          const buyW = (l.buyVolume / maxBuy) * 100;
          const sellW = (l.sellVolume / maxSell) * 100;
          return (
            <div
              key={l.price}
              role="listitem"
              className={
                `ftp-vp2-row${l.isPOC ? ' is-poc' : ''}${inVA ? ' is-in-va' : ''}${isCurrent ? ' is-current' : ''}`
                + (rank ? ` is-hot is-hot-${rank}` : '')
              }
              title={`${l.price.toFixed(2)} — total ${l.totalVolume.toLocaleString('pt-BR')} · agressão ${l.buyVolume.toLocaleString('pt-BR')} (${buyPct}%) × absorção ${l.sellVolume.toLocaleString('pt-BR')} (${sellPct}%)`}
            >
              <span className={`ftp-vp2-price${l.isPOC ? ' is-poc' : ''}`}>
                {isCurrent ? '◀ ' : ''}{l.price.toFixed(2)}
              </span>
              <div className="ftp-vp2-cell is-buy">
                <span className="ftp-vp2-val">{fmt(l.buyVolume)}</span>
                <div className="ftp-vp2-bar" aria-hidden="true">
                  <div className="ftp-vp2-fill" style={{ width: `${Math.max(1, buyW)}%` }} />
                </div>
                <span className="ftp-vp2-pct">{buyPct}%</span>
              </div>
              <div className="ftp-vp2-cell is-sell">
                <span className="ftp-vp2-val">{fmt(l.sellVolume)}</span>
                <div className="ftp-vp2-bar" aria-hidden="true">
                  <div className="ftp-vp2-fill" style={{ width: `${Math.max(1, sellW)}%` }} />
                </div>
                <span className="ftp-vp2-pct">{sellPct}%</span>
              </div>
              <span className="ftp-vp2-total">{fmt(l.totalVolume)}</span>
              {l.isPOC && <span className="ftp-vp-tag">POC</span>}
              {l.isVAH && <span className="ftp-vp-tag is-vah">VAH</span>}
              {l.isVAL && <span className="ftp-vp-tag is-val">VAL</span>}
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
