// panels/FeedbackInspectorPanel/FeedbackInspector.tsx
// Técnico: feedback gerado na sessão — dados reais do trainingStore.
import { useTrainingStore } from '../../store/trainingStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function FeedbackInspector() {
  const feedback = useTrainingStore((s) => s.feedback);

  return (
    <PanelShell title="Feedback Inspector">
      {feedback.length === 0 ? (
        <p>Sem feedback na sessão.</p>
      ) : (
        <ul>
          {feedback.map((f) => (
            <li key={f.id}>
              [tick {f.tick}] [{f.type}] {f.message}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
