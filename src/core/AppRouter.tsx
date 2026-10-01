import { useState } from "react";
import { AppShell } from "./AppShell";
import { listMissions } from "../training/MissionLibrary";
import { useMissionStore } from "../training/MissionStore";

type AppRoute = "dashboard" | "academy" | "training" | "analysis";

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
    </section>
  );
}

function PlaceholderRoute({ title }: { title: string }) {
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      <p>Module not implemented yet.</p>
    </section>
  );
}

function renderRoute(route: AppRoute) {
  switch (route) {
    case "dashboard":
      return <PlaceholderRoute title="Dashboard" />;
    case "academy":
      return <PlaceholderRoute title="Academy" />;
    case "training":
      return <TrainingRoute />;
    case "analysis":
      return <PlaceholderRoute title="Analysis" />;
    default:
      return <TrainingRoute />;
  }
}

export function AppRouter() {
  const [current, setCurrent] = useState<AppRoute>("training");

  return (
    <AppShell current={current} onNavigate={setCurrent}>
      {renderRoute(current)}
    </AppShell>
  );
}
