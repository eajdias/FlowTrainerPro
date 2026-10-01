import { describe, expect, it, beforeEach } from 'vitest';
import { SCENARIOS } from '../../src/store/scenarios';
import { useTrainingStore } from '../../src/store/trainingStore';

describe('training evaluation flow', () => {
  beforeEach(() => {
    useTrainingStore.getState().reset();
  });

  it('entrada antes do sinal gera feedback e reprova objetivo', () => {
    const sc = SCENARIOS[0]!;
    useTrainingStore.getState().loadScenario(sc);
    useTrainingStore.getState().startSession();
    useTrainingStore.getState().recordEntry('long', sc.signalStart - 5);

    const s = useTrainingStore.getState();
    expect(s.tradedBeforeSignal).toBe(true);
    expect(s.feedback.length).toBe(1);
    expect(s.feedback[0]?.type).toBe('incorrect');
    expect(s.objectives.find((o) => o.id === 'wait_signal')?.status).toBe('failed');
  });

  it('finish gera score, resultado e mensagem do coach', () => {
    const sc = SCENARIOS[0]!;
    useTrainingStore.getState().loadScenario(sc);
    useTrainingStore.getState().startSession();
    useTrainingStore.getState().recordEntry('long', sc.idealEntryStart);
    useTrainingStore.getState().completeObjective('wait_signal');
    useTrainingStore.getState().finishSession(25, 3);

    const s = useTrainingStore.getState();
    expect(s.status).toBe('finished');
    expect(s.result).not.toBeNull();
    expect(s.result?.score.total).toBeGreaterThanOrEqual(0);
    expect(s.result?.score.total).toBeLessThanOrEqual(100);
    expect(typeof s.result?.coachMessage).toBe('string');
    expect(s.result?.tradesMade).toBe(3);
  });
});
