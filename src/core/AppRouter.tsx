import { useState } from "react";
import { AppShell } from "./AppShell";
import { DashboardModule } from "../modules/dashboard/DashboardModule";
import { AcademyModule } from "../modules/academy/AcademyModule";
import { TrainingModule } from "../modules/training/TrainingModule";
import { AnalysisModule } from "../modules/analysis/AnalysisModule";

type AppRoute = "dashboard" | "academy" | "training" | "analysis";

function renderRoute(route: AppRoute) {
  switch (route) {
    case "dashboard":
      return <DashboardModule />;
    case "academy":
      return <AcademyModule />;
    case "training":
      return <TrainingModule />;
    case "analysis":
      return <AnalysisModule />;
    default:
      return <DashboardModule />;
  }
}

export function AppRouter() {
  const [current, setCurrent] = useState<AppRoute>("dashboard");

  return (
    <AppShell
      current={current}
      onNavigate={setCurrent}
    >
      {renderRoute(current)}
    </AppShell>
  );
}