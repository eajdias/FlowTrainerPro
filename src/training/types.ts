// training/types.ts
// Tipos da camada de Treinamento.
// Nenhuma lógica. Apenas contratos de dados.

export interface TrainingMission {
  id:              string;
  title:           string;
  description:     string;
  scenarioId:      string;
  difficulty:      'beginner' | 'intermediate' | 'advanced';
  category:        string;
  objective:       string;
  rules:           string[];
  tips:            string[];
  maxTrades:       number;
  targetPoints:    number;
  stopPoints:      number;
  timeLimitTicks?: number;
  tags:            string[];
  enabled:         boolean;
}

export type MissionStatus = 'idle' | 'active' | 'cleared' | 'restarted';
