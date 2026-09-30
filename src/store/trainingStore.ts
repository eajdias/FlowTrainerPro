// store/trainingStore.ts
// Zustand store for the active training session.
// Manages: scenario, objectives, feedback, score, session state.

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrainingStatus = 'idle' | 'briefing' | 'running' | 'finished';

export type ObjectiveStatus = 'pending' | 'completed' | 'failed';

export interface TrainingObjective {
  id:          string;
  description: string;
  status:      ObjectiveStatus;
  hint?:       string;
}

export interface TrainingFeedback {
  id:        string;
  tick:      number;
  type:      'correct' | 'incorrect' | 'warning' | 'info';
  message:   string;
}

export interface TrainingScenario {
  id:          string;
  name:        string;
  description: string;
  briefing:    string;
  difficulty:  'beginner' | 'intermediate' | 'advanced';
  objectives:  TrainingObjective[];
  /** The tick range when the "signal" occurs (e.g., absorption starts) */
  signalStart: number;
  signalEnd:   number;
  /** What market phase the signal represents */
  signalType:  string;
  /** Ideal entry zone — tick range */
  idealEntryStart: number;
  idealEntryEnd:   number;
  /** Duration in ticks */
  duration:    number;
}

export interface TrainingScore {
  total:       number;  // 0–100
  passed:      boolean;
  recognition: number;
  entryTiming: number;
  discipline:  number;
  riskMgmt:    number;
}

export interface TrainingResult {
  scenario:    TrainingScenario;
  score:       TrainingScore;
  feedback:    TrainingFeedback[];
  objectives:  TrainingObjective[];
  tradesMade:  number;
  realizedPnL: number;
  coachMessage: string;
}

// ── Store state ───────────────────────────────────────────────────────────────

interface TrainingState {
  status:       TrainingStatus;
  scenario:     TrainingScenario | null;
  objectives:   TrainingObjective[];
  feedback:     TrainingFeedback[];
  result:       TrainingResult | null;
  sessionTick:  number;

  // Tracking
  traderEnteredAt:    number | null;  // tick when first trade opened
  traderEnteredSide:  'long' | 'short' | null;
  tradedBeforeSignal: boolean;
}

interface TrainingActions {
  loadScenario:      (scenario: TrainingScenario) => void;
  startSession:      () => void;
  advanceTick:       () => void;
  recordEntry:       (side: 'long' | 'short', tick: number) => void;
  recordExit:        (tick: number) => void;
  addFeedback:       (fb: Omit<TrainingFeedback, 'id'>) => void;
  completeObjective: (id: string) => void;
  failObjective:     (id: string) => void;
  finishSession:     (realizedPnL: number, tradesMade: number) => void;
  reset:             () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

let fbCounter = 0;

export const useTrainingStore = create<TrainingState & TrainingActions>((set, get) => ({
  status:              'idle',
  scenario:            null,
  objectives:          [],
  feedback:            [],
  result:              null,
  sessionTick:         0,
  traderEnteredAt:     null,
  traderEnteredSide:   null,
  tradedBeforeSignal:  false,

  loadScenario: (scenario) => set({
    status:     'briefing',
    scenario,
    objectives: scenario.objectives.map((o) => ({ ...o, status: 'pending' as const })),
    feedback:   [],
    result:     null,
    sessionTick: 0,
    traderEnteredAt: null,
    traderEnteredSide: null,
    tradedBeforeSignal: false,
  }),

  startSession: () => set({ status: 'running' }),

  advanceTick: () => set((s) => ({ sessionTick: s.sessionTick + 1 })),

  recordEntry: (side, tick) => {
    const s = get();
    const beforeSignal = s.scenario ? tick < s.scenario.signalStart : false;
    set({
      traderEnteredAt: tick,
      traderEnteredSide: side,
      tradedBeforeSignal: beforeSignal,
    });

    if (beforeSignal) {
      get().addFeedback({
        tick,
        type: 'incorrect',
        message: 'Você entrou antes do sinal aparecer. Espere a confirmação.',
      });
      get().failObjective('wait_signal');
    }
  },

  recordExit: (tick) => {
    const s = get();
    if (s.scenario && tick >= s.scenario.idealEntryStart && tick <= s.scenario.idealEntryEnd + 20) {
      get().addFeedback({
        tick,
        type: 'correct',
        message: 'Boa saída — timing adequado.',
      });
    }
  },

  addFeedback: (fb) => set((s) => ({
    feedback: [...s.feedback, { ...fb, id: `fb-${++fbCounter}` }],
  })),

  completeObjective: (id) => set((s) => ({
    objectives: s.objectives.map((o) =>
      o.id === id ? { ...o, status: 'completed' as const } : o,
    ),
  })),

  failObjective: (id) => set((s) => ({
    objectives: s.objectives.map((o) =>
      o.id === id && o.status === 'pending' ? { ...o, status: 'failed' as const } : o,
    ),
  })),

  finishSession: (realizedPnL, tradesMade) => {
    const s = get();
    if (!s.scenario) return;

    // Calculate score
    const completed = s.objectives.filter((o) => o.status === 'completed').length;
    const total     = s.objectives.length;
    const objRate   = total > 0 ? completed / total : 0;

    const enteredInZone = s.traderEnteredAt !== null &&
      s.traderEnteredAt >= s.scenario.idealEntryStart &&
      s.traderEnteredAt <= s.scenario.idealEntryEnd;

    const recognition = s.tradedBeforeSignal ? 20 : 80;
    const entryTiming = enteredInZone ? 90 : s.traderEnteredAt !== null ? 40 : 10;
    const discipline  = Math.round(objRate * 100);
    const riskMgmt    = realizedPnL >= 0 ? 80 : Math.max(10, 80 + realizedPnL * 2);

    const totalScore = Math.round(
      recognition * 0.3 + entryTiming * 0.3 + discipline * 0.2 + riskMgmt * 0.2
    );

    const score: TrainingScore = {
      total:       totalScore,
      passed:      totalScore >= 60,
      recognition,
      entryTiming,
      discipline,
      riskMgmt,
    };

    const coachMessage = totalScore >= 80
      ? 'Excelente! Você demonstrou boa leitura e disciplina.'
      : totalScore >= 60
      ? 'Bom trabalho. Revise o feedback para melhorar.'
      : 'Precisa praticar mais. Releia o briefing e tente novamente.';

    const result: TrainingResult = {
      scenario:     s.scenario,
      score,
      feedback:     s.feedback,
      objectives:   s.objectives,
      tradesMade,
      realizedPnL,
      coachMessage,
    };

    set({ status: 'finished', result });
  },

  reset: () => {
    fbCounter = 0;
    set({
      status: 'idle', scenario: null, objectives: [], feedback: [],
      result: null, sessionTick: 0, traderEnteredAt: null,
      traderEnteredSide: null, tradedBeforeSignal: false,
    });
  },
}));
