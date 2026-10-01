import { describe, expect, it, beforeEach } from 'vitest';
import { useDataAssetStore } from '../../src/store/dataAssetStore';

describe('dataAssetStore', () => {
  beforeEach(() => {
    useDataAssetStore.setState({ asset: 'SYNTHETIC', csvName: null });
  });

  it('troca ativo e registra CSV', () => {
    const s = useDataAssetStore.getState();
    s.setAsset('WDO');
    expect(useDataAssetStore.getState().asset).toBe('WDO');
    s.setCsv('trades.csv');
    expect(useDataAssetStore.getState().asset).toBe('CSV');
    expect(useDataAssetStore.getState().csvName).toBe('trades.csv');
  });

  it('limpar CSV volta ao sintético', () => {
    const s = useDataAssetStore.getState();
    s.setCsv('trades.csv');
    s.clearCsv();
    expect(useDataAssetStore.getState().csvName).toBeNull();
    expect(useDataAssetStore.getState().asset).toBe('SYNTHETIC');
  });
});
