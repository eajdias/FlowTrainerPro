// training/MissionLibrary.ts
// Biblioteca de missões de treinamento.
// Cada missão aponta para um scenarioId existente na ScenarioLibrary.
// NÃO cria cenários novos.

import type { TrainingMission } from './types';

export const MISSION_LIBRARY: TrainingMission[] = [
  {
    id: 'mission_canal_rompimento_comprador',
    title: 'Canal + Rompimento Comprador',
    description: 'O mercado está lateralizado em um canal. Identifique o momento do rompimento comprador e entre na operação.',
    scenarioId: 'canal_rompimento_comprador',
    difficulty: 'beginner',
    category: 'Rompimento',
    objective: 'Comprar no rompimento do topo do canal e sair com lucro.',
    rules: [
      'Não operar durante a fase de acumulação',
      'Entrar apenas após confirmação do rompimento',
      'Stop obrigatório abaixo do canal',
    ],
    tips: [
      'Observe o aumento de volume no TT durante os testes do topo',
      'O DOM afina no lado vendedor antes do rompimento',
      'Agressões compradoras consecutivas confirmam o rompimento',
    ],
    maxTrades: 3,
    targetPoints: 4,
    stopPoints: 2,
    tags: ['canal', 'rompimento', 'compra', 'beginner'],
    enabled: true,
  },
  {
    id: 'mission_canal_rompimento_vendedor',
    title: 'Canal + Rompimento Vendedor',
    description: 'O mercado está lateralizado. Identifique o momento do rompimento vendedor e entre vendido.',
    scenarioId: 'canal_rompimento_vendedor',
    difficulty: 'beginner',
    category: 'Rompimento',
    objective: 'Vender no rompimento do fundo do canal e sair com lucro.',
    rules: [
      'Não operar durante a fase de distribuição',
      'Entrar apenas após confirmação do rompimento',
      'Stop obrigatório acima do canal',
    ],
    tips: [
      'Observe pressão vendedora crescente nos testes do fundo',
      'O DOM afina no lado comprador antes do rompimento',
      'Volume aumenta significativamente no momento do rompimento',
    ],
    maxTrades: 3,
    targetPoints: 4,
    stopPoints: 2,
    tags: ['canal', 'rompimento', 'venda', 'beginner'],
    enabled: true,
  },
  {
    id: 'mission_pullback',
    title: 'Pullback após Rompimento',
    description: 'O mercado já rompeu. Aguarde o pullback e entre na continuação.',
    scenarioId: 'pullback_rompimento',
    difficulty: 'intermediate',
    category: 'Continuação',
    objective: 'Entrar no pullback e surfar a continuação do movimento.',
    rules: [
      'Não entrar no rompimento inicial',
      'Aguardar o retorno ao nível rompido',
      'Confirmar que o nível está segurando antes de entrar',
    ],
    tips: [
      'O pullback deve ter volume menor que o rompimento',
      'Observe absorção no nível antigo topo (agora suporte)',
      'O TT desacelera durante o pullback e volta a acelerar na continuação',
    ],
    maxTrades: 2,
    targetPoints: 5,
    stopPoints: 2,
    tags: ['pullback', 'continuação', 'intermediate'],
    enabled: true,
  },
  {
    id: 'mission_absorcao_topo',
    title: 'Absorção no Topo',
    description: 'O mercado subiu forte. Identifique a absorção institucional no topo e entre vendido na reversão.',
    scenarioId: 'absorcao_topo',
    difficulty: 'intermediate',
    category: 'Reversão',
    objective: 'Identificar absorção e vender na reversão.',
    rules: [
      'Não vender enquanto o preço ainda estiver subindo',
      'Aguardar confirmação de que compradores estão sendo absorvidos',
      'Stop acima da máxima',
    ],
    tips: [
      'Volume alto com preço parado = absorção',
      'Broker History mostra grande player defendendo o nível',
      'O TT mostra muitas agressões compradoras mas o preço não sobe',
    ],
    maxTrades: 2,
    targetPoints: 5,
    stopPoints: 3,
    tags: ['absorção', 'topo', 'reversão', 'intermediate'],
    enabled: true,
  },
  {
    id: 'mission_absorcao_fundo',
    title: 'Absorção no Fundo',
    description: 'O mercado caiu forte. Identifique a absorção no fundo e compre na reversão.',
    scenarioId: 'absorcao_fundo',
    difficulty: 'intermediate',
    category: 'Reversão',
    objective: 'Identificar absorção vendedora no fundo e comprar na reversão.',
    rules: [
      'Não comprar enquanto o preço ainda estiver caindo',
      'Aguardar confirmação de que vendedores estão sendo absorvidos',
      'Stop abaixo da mínima',
    ],
    tips: [
      'Volume alto com preço parado no fundo = absorção compradora',
      'Agressões vendedoras param de mover o preço',
      'Book comprador engrossando = defesa institucional',
    ],
    maxTrades: 2,
    targetPoints: 5,
    stopPoints: 3,
    tags: ['absorção', 'fundo', 'reversão', 'intermediate'],
    enabled: true,
  },
  {
    id: 'mission_falso_rompimento',
    title: 'Falso Rompimento (Armadilha)',
    description: 'O mercado vai parecer romper. NÃO entre. Espere o retorno e opere na direção oposta.',
    scenarioId: 'falso_rompimento',
    difficulty: 'advanced',
    category: 'Armadilha',
    objective: 'Não cair na armadilha e lucrar com a reversão.',
    rules: [
      'NÃO comprar no rompimento aparente',
      'Aguardar retorno para dentro do canal',
      'Entrar vendido apenas após confirmação da reversão',
    ],
    tips: [
      'Rompimento com pouco volume é suspeito',
      'Retorno imediato = stop run (armadilha)',
      'Após o falso rompimento, o lado oposto ganha força',
    ],
    maxTrades: 2,
    targetPoints: 6,
    stopPoints: 3,
    tags: ['falso_rompimento', 'armadilha', 'advanced'],
    enabled: true,
  },
  {
    id: 'mission_reversao',
    title: 'Reversão',
    description: 'O mercado está em tendência de alta mas perdendo força. Identifique a reversão e entre vendido.',
    scenarioId: 'reversao',
    difficulty: 'advanced',
    category: 'Reversão',
    objective: 'Identificar exaustão e vender no início da reversão.',
    rules: [
      'Não operar contra a tendência até haver confirmação clara',
      'Aguardar desaceleração + mudança de controle',
      'Stop acima do último topo',
    ],
    tips: [
      'Candles menores e agressões mais fracas indicam exaustão',
      'Mudança no Broker History (vendedores assumindo liderança)',
      'O spread abre quando a liquidez some',
    ],
    maxTrades: 3,
    targetPoints: 6,
    stopPoints: 3,
    tags: ['reversão', 'exaustão', 'advanced'],
    enabled: true,
  },
  {
    id: 'mission_tendencia_forte',
    title: 'Tendência Forte',
    description: 'O mercado está em forte movimento direcional. Acompanhe a tendência e lucre com pullbacks.',
    scenarioId: 'tendencia_forte',
    difficulty: 'beginner',
    category: 'Tendência',
    objective: 'Comprar nos pullbacks e surfar a tendência.',
    rules: [
      'Operar apenas na direção da tendência',
      'Não tentar pegar topos ou fundos',
      'Usar stops curtos nos pullbacks',
    ],
    tips: [
      'TT acelerado com uma direção dominante = tendência',
      'Pullbacks curtos com pouco volume são oportunidades',
      'Não saia cedo demais — deixe o lucro correr',
    ],
    maxTrades: 4,
    targetPoints: 8,
    stopPoints: 2,
    tags: ['tendência', 'momentum', 'beginner'],
    enabled: true,
  },
  {
    id: 'mission_exaustao',
    title: 'Exaustão',
    description: 'O mercado está perdendo força. Identifique os sinais de exaustão e NÃO entre comprado.',
    scenarioId: 'exaustao',
    difficulty: 'intermediate',
    category: 'Leitura',
    objective: 'Identificar exaustão e NÃO operar (ou sair da posição).',
    rules: [
      'Não abrir nova posição comprada',
      'Se já estiver comprado, zerar ao identificar exaustão',
      'Observar, não operar por impulso',
    ],
    tips: [
      'Volume diminuindo = força acabando',
      'Agressões menores = convicção acabando',
      'Book engrossando na direção contrária = resistência',
    ],
    maxTrades: 1,
    targetPoints: 0,
    stopPoints: 2,
    tags: ['exaustão', 'leitura', 'intermediate'],
    enabled: true,
  },
  {
    id: 'mission_lateralizacao',
    title: 'Lateralização — Não Operar',
    description: 'O mercado está completamente equilibrado. O objetivo é NÃO operar.',
    scenarioId: 'lateralizacao',
    difficulty: 'beginner',
    category: 'Disciplina',
    objective: 'Reconhecer mercado sem oportunidade e manter-se FLAT.',
    rules: [
      'NÃO abrir nenhuma posição',
      'Observar o mercado em silêncio',
      'Encerrar a missão com 0 trades',
    ],
    tips: [
      'TT lento e equilibrado = sem direção',
      'Book profundo e estável = equilíbrio',
      'Forçar operação em lateral é prejuízo garantido',
    ],
    maxTrades: 0,
    targetPoints: 0,
    stopPoints: 0,
    tags: ['lateral', 'disciplina', 'paciência', 'beginner'],
    enabled: true,
  },
];

// ── API ───────────────────────────────────────────────────────────────────────

export function listMissions(): TrainingMission[] {
  return MISSION_LIBRARY.filter((m) => m.enabled);
}

export function getMission(id: string): TrainingMission | undefined {
  return MISSION_LIBRARY.find((m) => m.id === id);
}

export function getMissionsByCategory(category: string): TrainingMission[] {
  return MISSION_LIBRARY.filter((m) => m.category === category && m.enabled);
}

export function getMissionsByDifficulty(difficulty: TrainingMission['difficulty']): TrainingMission[] {
  return MISSION_LIBRARY.filter((m) => m.difficulty === difficulty && m.enabled);
}
