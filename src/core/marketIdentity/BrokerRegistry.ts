// core/marketIdentity/BrokerRegistry.ts
// Fonte unica de identidade e cor de corretoras.
// Regra (docs/FLOW_BROKER_COLORS.md): secundaria ativa com lote >= 250
// em ordem individual — nunca por soma.

import { BROKERS, type BrokerInfo } from './data/brokers';

export const BIG_LOT_THRESHOLD = 250;
export const UNKNOWN_BROKER_COLOR = '#8b90a0';

const byCode = new Map<number, BrokerInfo>(BROKERS.map((b) => [b.code, b]));

/** Retorna a corretora pelo codigo B3, ou undefined se desconhecida. */
export function getBroker(code: number): BrokerInfo | undefined {
  return byCode.get(code);
}

/** Cor oficial da corretora p/ um lote (secundaria com lote >= 250). */
export function getOrderColor(code: number, orderSize: number): string {
  const broker = byCode.get(code);
  if (!broker) return UNKNOWN_BROKER_COLOR;
  if (broker.secondaryColor && orderSize >= BIG_LOT_THRESHOLD) return broker.secondaryColor;
  return broker.primaryColor;
}

export const brokerRegistry = {
  getBroker: (code: number): BrokerInfo | undefined => getBroker(code),
  getOrderColor: (code: number, orderSize: number): string => getOrderColor(code, orderSize),
};
