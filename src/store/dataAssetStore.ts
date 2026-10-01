// store/dataAssetStore.ts
// Contexto de estudo: qual ativo/dataset a UI apresenta.
// O motor ao vivo segue sintético (WDO); o seletor governa estudo e rótulos.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StudyAsset = 'SYNTHETIC' | 'WDO' | 'PETR4' | 'CSV';

interface DataAssetState {
  asset: StudyAsset;
  csvName: string | null;
  setAsset: (asset: StudyAsset) => void;
  setCsv: (name: string) => void;
  clearCsv: () => void;
}

export const ASSET_LABELS: Record<StudyAsset, string> = {
  SYNTHETIC: 'WDO sintético (ao vivo)',
  WDO: 'WDO diário (estudo)',
  PETR4: 'PETR4 diário (estudo)',
  CSV: 'CSV importado',
};

export const useDataAssetStore = create<DataAssetState>()(
  persist(
    (set) => ({
      asset: 'SYNTHETIC',
      csvName: null,
      setAsset: (asset) => set({ asset }),
      setCsv: (name) => set({ csvName: name, asset: 'CSV' }),
      clearCsv: () =>
        set((s) => ({ csvName: null, asset: s.asset === 'CSV' ? 'SYNTHETIC' : s.asset })),
    }),
    { name: 'flowtrainerpro-data-asset' },
  ),
);
