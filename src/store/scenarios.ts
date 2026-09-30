// store/scenarios.ts
// Built-in training scenarios ready to play.

import type { TrainingScenario } from './trainingStore';

export const SCENARIOS: TrainingScenario[] = [
  {
    id:          'absorption',
    name:        'Absorção Institucional',
    description: 'Identifique a absorção antes do rompimento.',
    briefing:    'O mercado vai lateralizar. Uma instituição vai começar a absorver pressão vendedora em um nível. ' +
                 'Sua missão: NÃO entre antes da absorção ficar clara. Entre DEPOIS que o volume absorvido confirmar defesa.',
    difficulty:  'intermediate',
    objectives: [
      { id: 'wait_signal', description: 'Não operar antes do sinal', status: 'pending', hint: 'O sinal aparece quando volume defender um nível repetidamente.' },
      { id: 'entry_after', description: 'Entrar após absorção confirmada', status: 'pending', hint: 'Espere 3+ defesas no mesmo preço.' },
      { id: 'profit',      description: 'Encerrar com lucro', status: 'pending' },
    ],
    signalStart:     30,
    signalEnd:       50,
    idealEntryStart: 45,
    idealEntryEnd:   65,
    signalType:      'absorption',
    duration:        100,
  },
  {
    id:          'breakout',
    name:        'Rompimento Verdadeiro',
    description: 'Confirme o rompimento pelo fluxo antes de entrar.',
    briefing:    'O mercado vai se aproximar de uma resistência. Haverá um rompimento real com volume. ' +
                 'Sua missão: NÃO entre no topo antes do rompimento. Espere a confirmação pelo delta e volume acumulado.',
    difficulty:  'beginner',
    objectives: [
      { id: 'wait_signal', description: 'Não comprar antes do rompimento', status: 'pending', hint: 'Espere o preço cruzar com delta forte.' },
      { id: 'entry_after', description: 'Entrar após confirmação', status: 'pending', hint: 'Delta cumulativo deve ser fortemente positivo.' },
      { id: 'profit',      description: 'Encerrar com lucro', status: 'pending' },
    ],
    signalStart:     25,
    signalEnd:       40,
    idealEntryStart: 35,
    idealEntryEnd:   55,
    signalType:      'breakout',
    duration:        80,
  },
  {
    id:          'pullback',
    name:        'Entrada no Pullback',
    description: 'Espere o pullback antes de entrar na direção da tendência.',
    briefing:    'O mercado está em tendência de alta. Vai haver um pullback (correção). ' +
                 'Sua missão: NÃO entre no topo. Espere o pullback e entre quando o fluxo retomar a alta.',
    difficulty:  'beginner',
    objectives: [
      { id: 'wait_signal', description: 'Não comprar no topo', status: 'pending', hint: 'O pullback vai corrigir pelo menos 30% do movimento.' },
      { id: 'entry_after', description: 'Entrar após o pullback', status: 'pending', hint: 'Espere o preço parar de cair e o delta voltar positivo.' },
      { id: 'profit',      description: 'Encerrar com lucro', status: 'pending' },
    ],
    signalStart:     20,
    signalEnd:       40,
    idealEntryStart: 35,
    idealEntryEnd:   50,
    signalType:      'pullback',
    duration:        75,
  },
];

export function getScenarioById(id: string): TrainingScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
