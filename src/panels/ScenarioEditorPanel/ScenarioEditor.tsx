// panels/ScenarioEditorPanel/ScenarioEditor.tsx
// Editor de cenários: lista built-ins e carrega no trainingStore.
import { SCENARIOS, getScenarioById } from '../../store/scenarios';
import { useTrainingStore } from '../../store/trainingStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function ScenarioEditor() {
  const current = useTrainingStore((s) => s.scenario);
  const loadScenario = useTrainingStore((s) => s.loadScenario);

  return (
    <PanelShell title="Cenários">
      <div>
        <span>Ativo {current ? current.name : '—'}</span>
      </div>
      <ul>
        {SCENARIOS.map((sc) => (
          <li key={sc.id}>
            <button
              type="button"
              onClick={() => {
                const full = getScenarioById(sc.id);
                if (full) loadScenario(full);
              }}
            >
              {sc.name}
            </button>
            <span>{sc.difficulty}</span>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}
