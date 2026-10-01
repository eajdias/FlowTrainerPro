// market/providers/MarketDataProvider.ts
// Contrato minimo do tick de mercado ao vivo/sintetico.
// Providers concretos (sintetico, historico, ao vivo) entram em fases proprias.

export interface MarketTick {
  price: number;
  volume: number;
  delta: number;
  timestamp: number;
  brokerId: number;
  brokerName: string;
  brokerColor: string;
}
