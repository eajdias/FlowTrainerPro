// core/marketIdentity/data/brokers.ts
// Registro oficial de corretoras.
// Nunca alterar cores em codigo avulso — sempre via BrokerRegistry.

export interface BrokerInfo {
  code: number;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string | null;
}

const YELLOW = '#F5C400';
const LIGHT_BLUE = '#4FC3F7';
const GREEN = '#2ECC8A';
const RED = '#E03A3A';

function b(code: number, name: string, abbreviation: string, primaryColor: string, secondaryColor: string | null = null): BrokerInfo {
  return { code, name, abbreviation, primaryColor, secondaryColor };
}

export const BROKERS: BrokerInfo[] = [
  // AMARELO
  b(120, 'GENIAL', 'GENIAL', YELLOW, RED),
  b(1618, 'IDEAL', 'IDEAL', YELLOW),
  b(16, 'JP MORGAN', 'JPM', YELLOW, GREEN),
  b(8, 'UBS', 'UBS', YELLOW, GREEN),
  // AZUL CLARO
  b(88, 'CAPITAL', 'CAPITAL', LIGHT_BLUE, GREEN),
  b(308, 'CLEAR', 'CLEAR', LIGHT_BLUE),
  b(90, 'EASYINVEST', 'EASY', LIGHT_BLUE),
  b(174, 'ELITE', 'ELITE', LIGHT_BLUE),
  b(115, 'HCOMMCOR', 'HCOMM', LIGHT_BLUE, RED),
  b(262, 'MIRAE', 'MIRAE', LIGHT_BLUE, RED),
  b(1982, 'MODAL', 'MODAL', LIGHT_BLUE),
  b(23, 'NECTON', 'NECTON', LIGHT_BLUE),
  b(93, 'NOVA FUTURA', 'N FUT', LIGHT_BLUE, RED),
  b(3701, 'ORAMA', 'ORAMA', LIGHT_BLUE),
  b(386, 'RICO', 'RICO', LIGHT_BLUE),
  b(107, 'TERRA', 'TERRA', LIGHT_BLUE, RED),
  b(4090, 'TORO', 'TORO', LIGHT_BLUE),
  b(29, 'UNILETRA', 'UNIL', LIGHT_BLUE),
  b(3, 'XP', 'XP', LIGHT_BLUE, RED),
  // VERDE
  b(147, 'ATIVA', 'ATIVA', GREEN),
  b(122, 'BGC LIQUIDEZ', 'BGC', GREEN),
  b(77, 'CITIGROUP', 'CITI', GREEN),
  b(45, 'CREDIT', 'CREDIT', GREEN),
  b(238, 'GOLDMAN', 'GS', GREEN),
  b(13, 'MERRILL', 'MER', GREEN),
  b(40, 'MORGAN', 'MORGAN', GREEN),
  b(127, 'TULLETT', 'TULLETT', GREEN),
  // VERMELHO
  b(39, 'AGORA', 'AGORA', RED),
  b(4, 'ALFA', 'ALFA', RED),
  b(72, 'BRADESCO', 'BRAD', RED),
  b(85, 'BTG', 'BTG', RED),
  b(6003, 'C6', 'C6', RED),
  b(74, 'COIN VALORES', 'COIN', RED),
  b(131, 'FATOR', 'FATOR', RED),
  b(15, 'GUIDE', 'GUIDE', RED),
  b(735, 'ICAP', 'ICAP', RED),
  b(1130, 'INTL', 'INTL', RED),
  b(114, 'ITAU', 'ITAU', RED),
  b(129, 'PLANNER', 'PLAN', RED),
  b(92, 'RENASCENCA', 'REN', RED),
  b(59, 'SAFRA', 'SAFRA', RED),
  b(27, 'SANTANDER', 'SANT', RED),
  b(58, 'SOCOPA', 'SOCOPA', RED),
  b(21, 'VOTORANTIM', 'VOT', RED),
];
