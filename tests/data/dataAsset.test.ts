import { describe, expect, it, beforeEach } from 'vitest';
import { useDataAssetStore } from '../../src/store/dataAssetStore';

describe('dataAssetStore', () => {
  beforeEach(() => {
    useDataAssetStore.setState({ asset: 'SYNTHETIC' });
  });

  it('troca o ativo de estudo entre as fontes suportadas', () => {
    const s = useDataAssetStore.getState();
    s.setAsset('WDO');
    expect(useDataAssetStore.getState().asset).toBe('WDO');
    s.setAsset('PETR4');
    expect(useDataAssetStore.getState().asset).toBe('PETR4');
    s.setAsset('SYNTHETIC');
    expect(useDataAssetStore.getState().asset).toBe('SYNTHETIC');
  });
});
