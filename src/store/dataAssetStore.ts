// store/dataAssetStore.ts
// Contexto de estudo: qual dataset a UI apresenta (estudo histórico).
// O motor ao vivo é sintético; o seletor governa estudo e rótulos.
// Fontes: simulador sintético + materiais históricos (dados via API → DB → JSON).
// Sem CSV e sem modo ao vivo — projeto 100% histórico/simulado.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StudyAsset = 'SYNTHETIC' | 'WDO' | 'PETR4';

interface DataAssetState {
  asset: StudyAsset;
  /** Data da sessão de estudo selecionada (ISO 'YYYY-MM-DD'), null = todas. */
  selectedDate: string | null;
  setAsset: (asset: StudyAsset) => void;
  setSelectedDate: (date: string | null) => void;
}

export const ASSET_LABELS: Record<StudyAsset, string> = {
  SYNTHETIC: 'WDO sintético (simulador)',
  WDO: 'WDO diário (estudo)',
  PETR4: 'PETR4 diário (estudo)',
};

export const useDataAssetStore = create<DataAssetState>()(
  persist(
    (set) => ({
      asset: 'SYNTHETIC',
      selectedDate: null,
      setAsset: (asset) => set({ asset, selectedDate: null }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
    }),
    { name: 'flowtrainerpro-data-asset' },
  ),
);
