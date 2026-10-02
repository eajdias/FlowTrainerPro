// core/SessionControls.tsx
// Controles de sessão integrados ao header (cockpit):
//  - Transporte: play/pause, finalizar, reset, velocidade e fast-forward
//  - Fonte: popover com ativo de estudo, data da sessão, ajustes e download de dados
// Substitui o antigo painel "Replay & Dados" e o modal de setup.
import { useEffect, useMemo, useState } from 'react';
import { useTrainingSessionStore, type SimulationSpeed } from '../store/trainingSessionStore';
import {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  finishSimulation,
  resetSimulation,
  advanceSimulation,
} from './sessionActions';
import { getKernel } from './kernel/SimulationKernel';
import { useDataAssetStore, ASSET_LABELS, type StudyAsset } from '../store/dataAssetStore';
import { loadStudyMaterials, readWdoCache, writeWdoCache, wdoCacheToCandles } from './marketData/history/materials';
import { fetchFrontContract, fetchFutureHistory, normalizeBrapiFuture } from './marketData/history/brapi';
import { buildSessionStats } from './analytics/history/sessionStats';

const SPEEDS: SimulationSpeed[] = [0.5, 1, 2, 4, 8, 16];
const ASSETS: StudyAsset[] = ['SYNTHETIC', 'WDO', 'PETR4'];
const JUMPS = [
  { label: '+30s', secs: 30 },
  { label: '+1min', secs: 60 },
  { label: '+5min', secs: 300 },
];
const PROFILES = ['slow', 'normal', 'aggressive'] as const;
type Profile = (typeof PROFILES)[number];

function datesFor(asset: StudyAsset): string[] {
  if (asset === 'SYNTHETIC') return [];
  const materials = loadStudyMaterials();
  const cache = readWdoCache(typeof localStorage !== 'undefined' ? localStorage : undefined);
  const dates = new Set<string>();
  if (asset === 'WDO' && cache) {
    for (const c of wdoCacheToCandles(cache, 'WDO')) dates.add(c.date);
  }
  for (const m of materials) {
    if (m.symbol !== asset) continue;
    for (const s of m.sessions) dates.add(s.date);
  }
  return [...dates].sort().reverse().slice(0, 80);
}

export function SessionControls() {
  const status = useTrainingSessionStore((s) => s.status);
  const speed = useTrainingSessionStore((s) => s.speed);
  const setSpeed = useTrainingSessionStore((s) => s.setSpeed);
  const profile = useTrainingSessionStore((s) => s.profile);
  const setProfile = useTrainingSessionStore((s) => s.setProfile);
  const trainingFifo = useTrainingSessionStore((s) => s.trainingFifo);
  const setTrainingFifo = useTrainingSessionStore((s) => s.setTrainingFifo);
  const asset = useDataAssetStore((s) => s.asset);
  const setAsset = useDataAssetStore((s) => s.setAsset);
  const selectedDate = useDataAssetStore((s) => s.selectedDate);
  const setSelectedDate = useDataAssetStore((s) => s.setSelectedDate);

  const [sourceOpen, setSourceOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sessionStarted = status === 'running' || status === 'paused';
  const dates = useMemo(() => datesFor(asset), [asset, sourceOpen]);
  const materials = useMemo(() => loadStudyMaterials(), [sourceOpen]);

  useEffect(() => {
    if (!sourceOpen) return;
    const close = (): void => setSourceOpen(false);
    const id = setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
    return () => { clearTimeout(id); document.removeEventListener('click', close); };
  }, [sourceOpen]);

  const onToggle = (): void => {
    if (status === 'running') pauseSimulation();
    else if (status === 'paused') resumeSimulation();
    else startSimulation();
  };

  const onJump = (label: string, secs: number): void => {
    setJumpOpen(false);
    if (!sessionStarted) startSimulation();
    setAdvancing(label);
    void advanceSimulation(secs).finally(() => setAdvancing(null));
  };

  const onRefreshData = (): void => {
    setBusy(true);
    setNotice(null);
    void (async () => {
      try {
        const symbol = await fetchFrontContract('WDO');
        const payload = await fetchFutureHistory(symbol);
        const candles = normalizeBrapiFuture(payload);
        if (candles.length === 0) {
          setNotice('brapi retornou zero barras.');
          return;
        }
        const ok = writeWdoCache(
          typeof localStorage !== 'undefined' ? localStorage : undefined,
          { savedAt: new Date().toISOString(), candles },
        );
        setNotice(ok ? `WDO: ${candles.length} sessões baixadas.` : 'Cache indisponível.');
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Falha ao buscar dados.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const meta = useMemo(() => {
    if (!selectedDate || asset === 'SYNTHETIC') return null;
    const cache = readWdoCache(typeof localStorage !== 'undefined' ? localStorage : undefined);
    const sessions = asset === 'WDO' && cache
      ? buildSessionStats(wdoCacheToCandles(cache, 'WDO'))
      : materials.find((m) => m.symbol === asset)?.sessions ?? [];
    const s = sessions.find((x) => x.date === selectedDate);
    return s ? `range ${s.range.toFixed(2)} · vol ${s.volume} · ${s.regime}` : null;
  }, [selectedDate, asset, materials]);

  return (
    <div className="ftp-session" aria-label="Controles de sessão">
      {/* ── Transporte ── */}
      <div className="ftp-session-group">
        <button
          type="button"
          className={`ftp-session-play${status === 'running' ? ' is-running' : ''}`}
          title={status === 'running' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Iniciar sessão'}
          onClick={onToggle}
        >
          {status === 'running' ? '⏸' : '▶'}
        </button>
        {sessionStarted && (
          <>
            <button type="button" className="ftp-session-btn" title="Finalizar sessão" onClick={finishSimulation}>
              ⏹
            </button>
            <button type="button" className="ftp-session-btn" title="Resetar sessão" onClick={resetSimulation}>
              ↺
            </button>
          </>
        )}

        <div className="ftp-pop-wrap">
          <button
            type="button"
            className="ftp-session-btn"
            title="Avançar (fast-forward)"
            disabled={advancing !== null}
            onClick={(e) => { e.stopPropagation(); setJumpOpen((v) => !v); }}
          >
            {advancing ? '…' : '⏩'}
          </button>
          {jumpOpen && (
            <div className="ftp-pop" role="menu" onClick={(e) => e.stopPropagation()}>
              {JUMPS.map((j) => (
                <button key={j.label} type="button" onClick={() => onJump(j.label, j.secs)}>
                  Avançar {j.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          className="ftp-session-speed"
          value={speed}
          title="Velocidade da simulação"
          onChange={(e) => {
            const v = Number(e.target.value) as SimulationSpeed;
            setSpeed(v);
            getKernel().setSpeed(v);
          }}
        >
          {SPEEDS.map((v) => <option key={v} value={v}>{v}x</option>)}
        </select>
      </div>

      {/* ── Fonte ── */}
      <div className="ftp-pop-wrap">
        <button
          type="button"
          className="ftp-session-source"
          onClick={(e) => { e.stopPropagation(); setSourceOpen((v) => !v); }}
        >
          <span className="ftp-source-dot" data-asset={asset} aria-hidden="true" />
          {ASSET_LABELS[asset].split(' (')[0]}
          {selectedDate ? ` · ${selectedDate}` : ''}
          <span className="ftp-caret">▾</span>
        </button>
        {sourceOpen && (
          <div className="ftp-pop ftp-pop-source" role="dialog" aria-label="Fonte de estudo" onClick={(e) => e.stopPropagation()}>
            <span className="ftp-pop-label">Fonte de prática</span>
            <div className="ftp-pop-assets">
              {ASSETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`ftp-pop-asset is-${a.toLowerCase()}${asset === a ? ' is-active' : ''}`}
                  onClick={() => setAsset(a)}
                >
                  {ASSET_LABELS[a].split(' (')[0]}
                </button>
              ))}
            </div>

            {asset !== 'SYNTHETIC' && (
              <>
                <span className="ftp-pop-label">Data ({dates.length})</span>
                {dates.length === 0 ? (
                  <p className="ftp-pop-empty">Sem datas — use &quot;Baixar dados&quot;.</p>
                ) : (
                  <select
                    className="ftp-pop-date"
                    value={selectedDate ?? ''}
                    onChange={(e) => setSelectedDate(e.target.value || null)}
                  >
                    <option value="">Todas as datas</option>
                    {dates.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {meta && <span className="ftp-pop-meta">{meta}</span>}
              </>
            )}

            <span className="ftp-pop-label">Ajustes do simulador</span>
            <div className="ftp-pop-row">
              <label>
                Mercado
                <select
                  value={profile}
                  onChange={(e) => {
                    const v = e.target.value as Profile;
                    setProfile(v);
                    getKernel().setProfile(v);
                  }}
                >
                  {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="ftp-pop-check">
                <input
                  type="checkbox"
                  checked={trainingFifo}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setTrainingFifo(v);
                    getKernel().setTrainingFifo(v);
                  }}
                />
                TRAINING FIFO
              </label>
            </div>

            <div className="ftp-pop-foot">
              <button type="button" className="ftp-pop-download" onClick={onRefreshData} disabled={busy}>
                {busy ? 'Baixando…' : '⭳ Baixar dados (brapi)'}
              </button>
              {notice && <span className="ftp-pop-notice">{notice}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
