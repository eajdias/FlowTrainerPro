import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { AppShell } from "./AppShell";
import { WorkspaceManager } from "../workspace/WorkspaceManager/WorkspaceManager";
import { listMissions } from "../training/MissionLibrary";
import { useMissionStore } from "../training/MissionStore";
import { getScenarioById } from "../store/scenarios";
import { useTrainingStore } from "../store/trainingStore";
import { useTrainingSessionStore } from "../store/trainingSessionStore";
import { usePositionStore } from "../store/positionStore";
import { useTradeStore } from "../store/tradeStore";
import { useBookStore } from "../store/bookStore";
import { useMarketStore } from "../store/marketStore";
import { useBrokerFlowStore, selectBrokerFlowRankings } from "../store/brokerFlowStore";
import { getFlowEngine, type FlowAnalysisSnapshot } from "../core/analytics/flowAnalysis";
import { useDataAssetStore } from "../store/dataAssetStore";
import {
  loadStudyMaterials,
  readWdoCache,
  wdoCacheToCandles,
  type StudyMaterial,
} from "../core/marketData/history/materials";
import { buildSessionStats } from "../core/analytics/history/sessionStats";

/* ═══════════════════════════════════════════════════════════════════════════════
   Sidebar tabs: Missões | Mesa | Estudo
   ═══════════════════════════════════════════════════════════════════════════════ */

type SideTab = 'missions' | 'desk' | 'study';

/* ── Mesa: indicadores da sessão, fluxo e correlação de corretoras ── */

function MesaPanel() {
  const status = useTrainingSessionStore((s) => s.status);
  const totalTrades = useTrainingSessionStore((s) => s.totalTrades);
  const execs = useTradeStore((s) => s.totalExecs);
  const realized = usePositionStore((s) => s.realizedPnL);
  const wins = usePositionStore((s) => s.winningTrades);
  const losses = usePositionStore((s) => s.losingTrades);
  const posTrades = usePositionStore((s) => s.trades);
  const lastPrice = useBookStore((s) => s.lastPrice);
  const vwap = useMarketStore((s) => s.kernelState.vwap);
  const delta = useMarketStore((s) => s.cumulativeDelta);
  const sessionVolume = useMarketStore((s) => s.sessionVolume);
  const brokers = useBrokerFlowStore((s) => s.brokers);
  const rankings = selectBrokerFlowRankings({ brokers });

  const [flow, setFlow] = useState<FlowAnalysisSnapshot>(() => getFlowEngine().snapshot());
  useEffect(() => {
    const id = setInterval(() => setFlow(getFlowEngine().snapshot()), 1000);
    return () => clearInterval(id);
  }, []);

  const kpis: Array<{ label: string; value: string; tone: 'neutral' | 'info' | 'buy' | 'sell' }> = [
    { label: 'Último preço', value: lastPrice > 0 ? lastPrice.toFixed(2) : '--', tone: 'neutral' },
    { label: 'VWAP', value: vwap > 0 ? vwap.toFixed(2) : '--', tone: 'info' },
    { label: 'Delta', value: delta >= 0 ? `+${delta}` : `${delta}`, tone: delta >= 0 ? 'buy' : 'sell' },
    { label: 'Volume', value: sessionVolume.toLocaleString('pt-BR'), tone: 'neutral' },
    { label: 'Execuções', value: execs.toLocaleString('pt-BR'), tone: 'neutral' },
    { label: 'P&L', value: `${realized >= 0 ? '+' : ''}${realized.toFixed(2)}`, tone: realized >= 0 ? 'buy' : 'sell' },
    { label: 'Trades', value: totalTrades.toLocaleString('pt-BR'), tone: 'neutral' },
    { label: 'Win/Loss', value: `${wins}W / ${losses}L`, tone: wins >= losses ? 'buy' : 'sell' },
  ];

  const pressureTone = flow.pressureSide === 'buy' ? 'buy' : flow.pressureSide === 'sell' ? 'sell' : 'neutral';

  return (
    <div className="ftp-side-panel">
      <div className="ftp-side-meta">
        <span className={`ftp-session-chip is-${status}`}>{status}</span>
      </div>

      <div className="ftp-side-kpis">
        {kpis.map((k) => (
          <div key={k.label} className={`ftp-kpi is-${k.tone}`}>
            <span className="ftp-kpi-label">{k.label}</span>
            <strong className="ftp-kpi-value">{k.value}</strong>
          </div>
        ))}
      </div>

      <div className="ftp-dash-card">
        <span className="ftp-kpi-label">Leitura de fluxo</span>
        <div className={`ftp-flow-pressure is-${pressureTone}`}>
          <strong>{flow.pressure.toFixed(2)}</strong>
          <span>
            {flow.pressureSide === 'buy' ? 'compradora' : flow.pressureSide === 'sell' ? 'vendedora' : 'neutra'} ·{' '}
            conf {(flow.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <ul className="ftp-dash-list">
          <li>Absorções <strong>{flow.absorptions}</strong></li>
          <li>Continuações <strong>{flow.continuations}</strong></li>
          <li>Limit walls <strong>{flow.limitWalls}</strong></li>
          <li>Severidade <strong>{flow.severity}</strong></li>
        </ul>
      </div>

      <div className="ftp-dash-card">
        <span className="ftp-kpi-label">Correlação de corretoras</span>
        <ul className="ftp-dash-ranks">
          <li>
            <span>Mais ativa</span>
            <strong>{rankings.mostActive?.brokerName ?? '—'}</strong>
          </li>
          <li className="is-buy">
            <span>Maior comprador</span>
            <strong>{rankings.mostAggressiveBuyer?.brokerName ?? '—'}</strong>
          </li>
          <li className="is-sell">
            <span>Maior vendedor</span>
            <strong>{rankings.mostAggressiveSeller?.brokerName ?? '—'}</strong>
          </li>
        </ul>
      </div>

      <div className="ftp-dash-card">
        <span className="ftp-kpi-label">Operações da sessão ({posTrades.length})</span>
        {posTrades.length === 0 ? (
          <p className="ftp-side-empty">Sem operações encerradas.</p>
        ) : (
          <table className="ftp-side-table">
            <thead>
              <tr>
                <th>Lado</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Qtd</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {posTrades.slice(-12).reverse().map((t) => (
                <tr key={t.id} className={t.pnl >= 0 ? 'is-buy' : 'is-sell'}>
                  <td>{t.side === 'long' ? 'C' : 'V'}</td>
                  <td>{t.entryPrice.toFixed(2)}</td>
                  <td>{t.exitPrice !== null ? t.exitPrice.toFixed(2) : 'aberto'}</td>
                  <td>{t.size}</td>
                  <td>{t.pnl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Estudo: materiais históricos + aulas das missões ── */

function StudySessions({ materials }: { materials: StudyMaterial[] }) {
  if (materials.length === 0) {
    return <p className="ftp-side-empty">Sem materiais — baixe dados na barra de sessão (fonte ▾).</p>;
  }
  const fmtVol = (v: number): string => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)} bi`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)} mi`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)} k`;
    return String(v);
  };
  return (
    <div className="ftp-side-block">
      <span className="ftp-kpi-label">Sessões de estudo</span>
      {materials.map((doc) => (
        <article key={doc.symbol} className="ftp-study-doc">
          <h4>
            {doc.symbol} <span>({doc.sessions.length} sessões{doc.live ? ' · atualizado' : ''})</span>
          </h4>
          <ul>
            {doc.sessions.slice(-8).map((s) => (
              <li key={s.date}>
                <span>{s.date}</span>
                <span className="ftp-study-meta">
                  range {s.range.toFixed(2)} · vol {fmtVol(s.volume)} · {s.regime}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function StudyPanel() {
  const missions = listMissions();
  const [openId, setOpenId] = useState<string | null>(null);
  const asset = useDataAssetStore((s) => s.asset);
  const materials = useMemo(() => {
    const docs = loadStudyMaterials();
    if (asset === 'SYNTHETIC') return docs;
    const cache =
      asset === 'WDO' ? readWdoCache(typeof localStorage !== 'undefined' ? localStorage : undefined) : null;
    if (cache) {
      const sessions = buildSessionStats(wdoCacheToCandles(cache, asset));
      return [{ symbol: asset, generatedAt: cache.savedAt, sessions, live: true }];
    }
    return docs.filter((d) => d.symbol === asset);
  }, [asset]);

  return (
    <div className="ftp-side-panel">
      <StudySessions materials={materials} />
      <div className="ftp-side-block">
        <span className="ftp-kpi-label">Aulas das missões</span>
        <ul className="ftp-lessons">
          {missions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="ftp-lesson-head"
                onClick={() => setOpenId(openId === m.id ? null : m.id)}
              >
                <strong>{m.title}</strong>
                <em className={`ftp-diff is-${m.difficulty}`}>{m.difficulty}</em>
              </button>
              {openId === m.id && (
                <div className="ftp-lesson-body">
                  <p>{m.description}</p>
                  <p className="ftp-lesson-goal">Objetivo: {m.objective}</p>
                  {m.tips.map((t) => (
                    <p key={t} className="ftp-lesson-tip">💡 {t}</p>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main — view única: sidebar (tabs) + desk
   ═══════════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { n: 1, label: 'Missão' },
  { n: 2, label: 'Briefing' },
  { n: 3, label: 'Operar' },
  { n: 4, label: 'Resultado' },
];

function MainRoute() {
  const missions = listMissions();
  const [sideTab, setSideTab] = useState<SideTab>('missions');
  const [showTour, setShowTour] = useState<boolean>(() => {
    try { return localStorage.getItem('ftp-tour-seen') !== '1'; } catch { return true; }
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('ftp-sidebar-collapsed') === '1'; } catch { return false; }
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try { return Number(localStorage.getItem('ftp-sidebar-width')) || 320; } catch { return 320; }
  });

  useEffect(() => {
    try { localStorage.setItem('ftp-sidebar-collapsed', collapsed ? '1' : '0'); } catch { /* sem persistência */ }
  }, [collapsed]);
  useEffect(() => {
    try { localStorage.setItem('ftp-sidebar-width', String(sidebarWidth)); } catch { /* sem persistência */ }
  }, [sidebarWidth]);

  const dismissTour = (): void => {
    try { localStorage.setItem('ftp-tour-seen', '1'); } catch { /* sem persistência */ }
    setShowTour(false);
  };

  const currentMission = useMissionStore((s) => s.currentMission);
  const setMission = useMissionStore((s) => s.setMission);
  const clearMission = useMissionStore((s) => s.clear);
  const loadScenario = useTrainingStore((s) => s.loadScenario);
  const resetTraining = useTrainingStore((s) => s.reset);
  const trainingStatus = useTrainingStore((s) => s.status);
  const objectives = useTrainingStore((s) => s.objectives);
  const feedback = useTrainingStore((s) => s.feedback);
  const result = useTrainingStore((s) => s.result);
  const scenario = useTrainingStore((s) => s.scenario);

  const step = !currentMission
    ? 1
    : result
      ? 4
      : trainingStatus === 'running'
        ? 3
        : 2;

  const chooseMission = (id: string): void => {
    const m = missions.find((x) => x.id === id);
    if (!m) return;
    resetTraining();
    setMission(m);
    const sc = getScenarioById(m.scenarioId);
    if (sc) loadScenario(sc);
  };

  const newMission = (): void => {
    resetTraining();
    clearMission();
  };

  const startResize = (e: ReactMouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent): void => {
      setSidebarWidth(Math.min(520, Math.max(260, startW + (ev.clientX - startX))));
    };
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <section aria-label="Main" className={`ftp-training${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="ftp-training-sidebar" style={collapsed ? undefined : { width: sidebarWidth }} aria-label="Painel lateral">
        <div className="ftp-sidebar-head">
          <div className="ftp-training-title">
            <strong>Main</strong>
            <span>Mesa de treino de Order Flow</span>
          </div>
          <button
            type="button"
            className="ftp-sidebar-collapse"
            title="Colapsar sidebar"
            aria-label="Colapsar sidebar"
            onClick={() => setCollapsed(true)}
          >
            ⟨
          </button>
        </div>

        {/* Tabs da sidebar */}
        <div className="ftp-side-tabs" role="tablist" aria-label="Seções">
          <button
            type="button"
            role="tab"
            aria-selected={sideTab === 'missions'}
            className={sideTab === 'missions' ? 'is-active' : ''}
            onClick={() => setSideTab('missions')}
          >
            Missões
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sideTab === 'desk'}
            className={sideTab === 'desk' ? 'is-active' : ''}
            onClick={() => setSideTab('desk')}
          >
            Mesa
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sideTab === 'study'}
            className={sideTab === 'study' ? 'is-active' : ''}
            onClick={() => setSideTab('study')}
          >
            Estudo
          </button>
        </div>

        {/* ── Tab Missões ── */}
        {sideTab === 'missions' && (
          <div className="ftp-side-panel">
            <header className="ftp-training-head">
              <ol className="ftp-steps" aria-label="Progresso da sessão">
                {STEPS.map((s) => (
                  <li
                    key={s.n}
                    className={step === s.n ? 'is-active' : step > s.n ? 'is-done' : ''}
                    aria-current={step === s.n ? 'step' : undefined}
                  >
                    <span className="ftp-step-dot">{step > s.n ? '✓' : s.n}</span>
                    <span className="ftp-step-label">{s.label}</span>
                  </li>
                ))}
              </ol>
            </header>

            {showTour && (
              <div className="ftp-tour" role="note" aria-label="Primeiros passos">
                <div className="ftp-tour-body">
                  <strong>Primeiros passos</strong>
                  <span>1. Escolha uma missão · 2. Aperte ▶ no topo · 3. Opere no SuperDOM</span>
                </div>
                <button type="button" onClick={dismissTour}>
                  Entendi
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="ftp-mission-grid" role="list" aria-label="Missões disponíveis">
                {missions
                  .filter((m) => m.enabled)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="listitem"
                      className="ftp-mission-card"
                      onClick={() => chooseMission(m.id)}
                    >
                      <strong>{m.title}</strong>
                      <span className="ftp-mission-meta">
                        <em className={`ftp-diff is-${m.difficulty}`}>{m.difficulty}</em>
                        {m.category}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {step === 2 && currentMission && (
              <article className="ftp-briefing">
                <h3>{currentMission.title}</h3>
                <p>{currentMission.description}</p>
                <p>Objetivo: {currentMission.objective}</p>
                <ul>
                  {currentMission.rules.map((r) => (
                    <li key={r}>Regra: {r}</li>
                  ))}
                </ul>
                <ul>
                  {currentMission.tips.map((t) => (
                    <li key={t}>Dica: {t}</li>
                  ))}
                </ul>
                <p>Cenário: {scenario ? scenario.name : '—'}</p>
                <p>Aperte ▶ no topo da tela para começar, opere no SuperDOM e finalize para ver o resultado.</p>
                <button type="button" onClick={newMission}>
                  Trocar de missão
                </button>
              </article>
            )}

            {step === 3 && (
              <div className="ftp-side-block">
                <span className="ftp-kpi-label">Objetivos ao vivo</span>
                <ul className="ftp-dash-list">
                  {objectives.map((o) => (
                    <li key={o.id}>
                      {o.description} <strong className={`is-${o.status}`}>{o.status}</strong>
                      {o.hint ? <span className="ftp-obj-hint">{o.hint}</span> : null}
                    </li>
                  ))}
                </ul>
                <span className="ftp-kpi-label">Feedback do coach</span>
                {feedback.length === 0 ? (
                  <p className="ftp-side-empty">Sem feedback ainda — opere para receber orientação.</p>
                ) : (
                  <ul className="ftp-dash-list">
                    {feedback.slice(-5).map((f) => (
                      <li key={f.id}>
                        [{f.type}] {f.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 4 && result && (
              <article className="ftp-briefing">
                <h3>
                  Resultado: {result.score.total} ({result.score.passed ? 'aprovado' : 'reprovado'})
                </h3>
                <p>{result.coachMessage}</p>
                <button type="button" onClick={newMission}>
                  Nova missão
                </button>
              </article>
            )}
          </div>
        )}

        {/* ── Tab Mesa ── */}
        {sideTab === 'desk' && <MesaPanel />}

        {/* ── Tab Estudo ── */}
        {sideTab === 'study' && <StudyPanel />}
      </aside>

      {!collapsed && (
        <div
          className="ftp-sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Ajustar largura da sidebar"
          onMouseDown={startResize}
        />
      )}

      <div className="ftp-training-content">
        {collapsed && (
          <button
            type="button"
            className="ftp-sidebar-expand"
            title="Expandir sidebar"
            aria-label="Expandir sidebar"
            onClick={() => setCollapsed(false)}
          >
            ⟩
          </button>
        )}
        <WorkspaceManager />
      </div>
    </section>
  );
}

export function AppRouter() {
  return (
    <AppShell>
      <MainRoute />
    </AppShell>
  );
}
