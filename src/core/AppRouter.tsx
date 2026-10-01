import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { WorkspaceManager } from "../workspace/WorkspaceManager/WorkspaceManager";
import { listMissions } from "../training/MissionLibrary";
import { useMissionStore } from "../training/MissionStore";
import { getScenarioById } from "../store/scenarios";
import { useTrainingStore } from "../store/trainingStore";
import { useTrainingSessionStore } from "../store/trainingSessionStore";
import { usePositionStore } from "../store/positionStore";
import { useTradeStore } from "../store/tradeStore";
import { useBrokerFlowStore, selectBrokerFlowRankings } from "../store/brokerFlowStore";
import { getFlowEngine, type FlowAnalysisSnapshot } from "../core/analytics/flowAnalysis";

type AppRoute = "dashboard" | "academy" | "training" | "analysis";

const ROUTES: AppRoute[] = ["dashboard", "academy", "training", "analysis"];

interface StudySession {
  date: string;
  range: number;
  volume: number;
  gapPct: number;
  regime: string;
}

interface StudyMaterial {
  symbol: string;
  generatedAt: string;
  sessions: StudySession[];
}

function loadStudyMaterials(): StudyMaterial[] {
  const modules = import.meta.glob<{ default: StudyMaterial }>(
    '../../data/materials/*.json',
    { eager: true },
  );
  return Object.values(modules).map((m) => m.default);
}

function StudySessions({ materials }: { materials: StudyMaterial[] }) {
  if (materials.length === 0) {
    return <p>Sem materiais de estudo — rode `npm run materials -- --symbol PETR4`.</p>;
  }
  return (
    <div>
      <h3>Sessões de estudo</h3>
      {materials.map((doc) => (
        <article key={doc.symbol}>
          <h4>
            {doc.symbol} ({doc.sessions.length} sessões)
          </h4>
          <ul>
            {doc.sessions.slice(-10).map((s) => (
              <li key={s.date}>
                {s.date} · range {s.range.toFixed(2)} · vol {s.volume} · gap{' '}
                {s.gapPct.toFixed(2)}% · {s.regime}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function routeFromHash(): AppRoute {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as string[]).includes(h) ? (h as AppRoute) : "training";
}

function TrainingRoute() {
  const missions = listMissions();
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

  return (
    <section aria-label="Training missions">
      <h2>Training</h2>
      <ol>
        <li aria-current={step === 1 ? 'step' : undefined}>1. Escolher missão</li>
        <li aria-current={step === 2 ? 'step' : undefined}>2. Ler briefing e iniciar</li>
        <li aria-current={step === 3 ? 'step' : undefined}>3. Operar no SuperDOM</li>
        <li aria-current={step === 4 ? 'step' : undefined}>4. Ver resultado</li>
      </ol>
      {step === 1 && (
        <ul>
          {missions
            .filter((m) => m.enabled)
            .map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => chooseMission(m.id)}>
                  {m.title}
                </button>
                <span>
                  {m.difficulty} · {m.category}
                </span>
              </li>
            ))}
        </ul>
      )}
      {step === 2 && currentMission && (
        <article>
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
          <p>Aperte ▶ Iniciar na barra Replay para começar, opere no SuperDOM e finalize para ver o resultado.</p>
          <button type="button" onClick={newMission}>
            Trocar de missão
          </button>
        </article>
      )}
      {step === 3 && (
        <div>
          <h3>Objetivos ao vivo</h3>
          <ul>
            {objectives.map((o) => (
              <li key={o.id}>
                {o.description} — {o.status}
                {o.hint ? ` (${o.hint})` : ''}
              </li>
            ))}
          </ul>
          <h3>Feedback</h3>
          {feedback.length === 0 ? (
            <p>Sem feedback ainda — opere para receber orientação.</p>
          ) : (
            <ul>
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
        <article>
          <h3>
            Resultado: {result.score.total} ({result.score.passed ? 'aprovado' : 'reprovado'})
          </h3>
          <p>{result.coachMessage}</p>
          <button type="button" onClick={newMission}>
            Nova missão
          </button>
        </article>
      )}
      <WorkspaceManager />
    </section>
  );
}

function DashboardRoute() {
  const status = useTrainingSessionStore((s) => s.status);
  const ticks = useTrainingSessionStore((s) => s.tickCount);
  const totalTrades = useTrainingSessionStore((s) => s.totalTrades);
  const totalVolume = useTrainingSessionStore((s) => s.totalVolume);
  const execs = useTradeStore((s) => s.totalExecs);
  const realized = usePositionStore((s) => s.realizedPnL);
  const wins = usePositionStore((s) => s.winningTrades);
  const losses = usePositionStore((s) => s.losingTrades);

  return (
    <section aria-label="Dashboard">
      <h2>Dashboard</h2>
      <ul>
        <li>sessão {status}</li>
        <li>ticks {ticks}</li>
        <li>execuções {execs}</li>
        <li>volume {totalVolume} ({totalTrades} negócios)</li>
        <li>
          P&L {realized.toFixed(2)} · {wins}W/{losses}L
        </li>
      </ul>
    </section>
  );
}

function AcademyRoute() {
  const missions = listMissions();
  const [openId, setOpenId] = useState<string | null>(null);
  const materials = useMemo(() => loadStudyMaterials(), []);

  return (
    <section aria-label="Academy">
      <h2>Academy</h2>
      <StudySessions materials={materials} />
      <ul>
        {missions.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
              {m.title}
            </button>
            {openId === m.id && (
              <article>
                <p>{m.description}</p>
                <p>Objetivo: {m.objective}</p>
                <ul>
                  {m.rules.map((r) => (
                    <li key={r}>Regra: {r}</li>
                  ))}
                </ul>
                <ul>
                  {m.tips.map((t) => (
                    <li key={t}>Dica: {t}</li>
                  ))}
                </ul>
              </article>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnalysisRoute() {
  const [flow, setFlow] = useState<FlowAnalysisSnapshot>(() => getFlowEngine().snapshot());
  const brokers = useBrokerFlowStore((s) => s.brokers);
  const rankings = selectBrokerFlowRankings({ brokers });

  useEffect(() => {
    const id = setInterval(() => setFlow(getFlowEngine().snapshot()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section aria-label="Analysis">
      <h2>Analysis</h2>
      <ul>
        <li>
          pressão {flow.pressure.toFixed(2)} ({flow.pressureSide}) · conf {flow.confidence.toFixed(2)}{' '}
          {flow.severity}
        </li>
        <li>
          absorções {flow.absorptions} · continuações {flow.continuations} · walls{' '}
          {flow.limitWalls}
        </li>
        <li>mais ativo {rankings.mostActive?.brokerName ?? '—'}</li>
        <li>maior comprador {rankings.mostAggressiveBuyer?.brokerName ?? '—'}</li>
        <li>maior vendedor {rankings.mostAggressiveSeller?.brokerName ?? '—'}</li>
      </ul>
    </section>
  );
}

function renderRoute(route: AppRoute) {
  switch (route) {
    case "dashboard":
      return <DashboardRoute />;
    case "academy":
      return <AcademyRoute />;
    case "training":
      return <TrainingRoute />;
    case "analysis":
      return <AnalysisRoute />;
    default:
      return <TrainingRoute />;
  }
}

export function AppRouter() {
  const [current, setCurrent] = useState<AppRoute>(() => routeFromHash());

  useEffect(() => {
    const onHash = () => setCurrent(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (route: AppRoute): void => {
    window.location.hash = `/${route}`;
    setCurrent(route);
  };

  return (
    <AppShell current={current} onNavigate={navigate}>
      {renderRoute(current)}
    </AppShell>
  );
}
