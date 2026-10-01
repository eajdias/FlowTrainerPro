// panels/EvaluationInspectorPanel/EvaluationInspector.tsx
// Técnico: resultado da avaliação (score, objetivos) — dados reais do trainingStore.
import { useTrainingStore } from '../../store/trainingStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function EvaluationInspector() {
  const result = useTrainingStore((s) => s.result);
  const objectives = useTrainingStore((s) => s.objectives);
  const status = useTrainingStore((s) => s.status);

  return (
    <PanelShell title="Evaluation Inspector">
      <div>
        <span>sessão {status}</span>
      </div>
      {result ? (
        <ul>
          <li>
            score {result.score.total} ({result.score.passed ? 'aprovado' : 'reprovado'})
          </li>
          <li>
            reconhecimento {result.score.recognition} · timing {result.score.entryTiming} ·
            disciplina {result.score.discipline} · risco {result.score.riskMgmt}
          </li>
          <li>
            trades {result.tradesMade} · P&L {result.realizedPnL.toFixed(2)}
          </li>
          <li>{result.coachMessage}</li>
        </ul>
      ) : (
        <ul>
          {objectives.length === 0 ? (
            <li>Sem cenário carregado.</li>
          ) : (
            objectives.map((o) => (
              <li key={o.id}>
                {o.description} — {o.status}
              </li>
            ))
          )}
        </ul>
      )}
    </PanelShell>
  );
}
