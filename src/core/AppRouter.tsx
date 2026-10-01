import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { WorkspaceManager } from "../workspace/WorkspaceManager/WorkspaceManager";
import { listMissions } from "../training/MissionLibrary";
import { useMissionStore } from "../training/MissionStore";
import { useTrainingSessionStore } from "../store/trainingSessionStore";
import { usePositionStore } from "../store/positionStore";
import { useTradeStore } from "../store/tradeStore";
import { useBrokerFlowStore, selectBrokerFlowRankings } from "../store/brokerFlowStore";
import { getFlowEngine, type FlowAnalysisSnapshot } from "../core/analytics/flowAnalysis";

type AppRoute = "dashboard" | "academy" | "training" | "analysis";

const ROUTES: AppRoute[] = ["dashboard", "academy", "training", "analysis"];

function routeFromHash(): AppRoute {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as string[]).includes(h) ? (h as AppRoute) : "training";
}

function TrainingRoute() {
  const missions = listMissions();
  const currentMission = useMissionStore((s) => s.currentMission);
  const setMission = useMissionStore((s) => s.setMission);
  const clear = useMissionStore((s) => s.clear);

  return (
    <section aria-label="Training missions">
      <h2>Training</h2>
      {currentMission ? (
        <article>
          <h3>{currentMission.title}</h3>
          <p>{currentMission.description}</p>
          <p>Objective: {currentMission.objective}</p>
          <button type="button" onClick={clear}>
            Clear mission
          </button>
        </article>
      ) : (
        <ul>
          {missions
            .filter((m) => m.enabled)
            .map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setMission(m)}>
                  {m.title}
                </button>
                <span>
                  {m.difficulty} · {m.category}
                </span>
              </li>
            ))}
        </ul>
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

  return (
    <section aria-label="Academy">
      <h2>Academy</h2>
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
