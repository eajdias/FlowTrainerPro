// panels/DataPanel/DataPanel.tsx
// Dados & Ativos: datasets disponíveis, importação CSV, atualização WDO (brapi)
// e seletor do contexto de estudo. Sem regra de negócio.
import { useEffect, useState } from 'react';
import { getSharedReplayEngine } from '../../core/marketData/replay';
import { parseCsvTrades } from '../../core/marketData/import';
import {
  fetchFrontContract,
  fetchFutureHistory,
  normalizeBrapiFuture,
} from '../../core/marketData/history/brapi';
import { loadStudyMaterials, readWdoCache, writeWdoCache } from '../../core/marketData/history/materials';
import { useDataAssetStore, ASSET_LABELS, type StudyAsset } from '../../store/dataAssetStore';
import { useMarketDataSourceStore } from '../../store/marketDataSourceStore';
import { PanelShell } from '../PanelShell/PanelShell';

const ASSETS: StudyAsset[] = ['SYNTHETIC', 'WDO', 'PETR4', 'CSV'];

export function DataPanel() {
  const asset = useDataAssetStore((s) => s.asset);
  const setAsset = useDataAssetStore((s) => s.setAsset);
  const csvName = useDataAssetStore((s) => s.csvName);
  const setCsv = useDataAssetStore((s) => s.setCsv);
  const sourceMode = useMarketDataSourceStore((s) => s.sourceMode);
  const setSource = useMarketDataSourceStore((s) => s.setSource);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const engine = getSharedReplayEngine();
  const replay = engine.getState();
  const materials = loadStudyMaterials();
  const cache = readWdoCache(typeof localStorage !== 'undefined' ? localStorage : undefined);

  const onCsv = (file: File | undefined): void => {
    if (!file) return;
    setNotice(null);
    void file.text().then((text) => {
      const parsed = parseCsvTrades(text);
      if (parsed.trades.length === 0) {
        setNotice(`Nenhum negócio válido em ${file.name}.`);
        return;
      }
      engine.load(parsed.trades, file.name);
      setCsv(file.name);
      setSource('HISTORICAL_FILE', file.name);
      const mode = useMarketDataSourceStore.getState().sourceMode;
      setNotice(
        mode === 'HISTORICAL_FILE'
          ? `${parsed.trades.length} negócios carregados de ${file.name}.`
          : `${parsed.trades.length} negócios no player (fonte mantida: kernel rodando).`,
      );
    });
  };

  const onRefreshWdo = (): void => {
    setBusy(true);
    setNotice(null);
    void (async () => {
      try {
        const symbol = await fetchFrontContract('WDO');
        const payload = await fetchFutureHistory(symbol);
        const candles = normalizeBrapiFuture(payload);
        if (candles.length === 0) {
          setNotice('brapi retornou zero barras válidas.');
          return;
        }
        const ok = writeWdoCache(
          typeof localStorage !== 'undefined' ? localStorage : undefined,
          { savedAt: new Date().toISOString(), candles },
        );
        setNotice(ok ? `WDO atualizado (${candles.length} sessões, ${symbol}).` : 'Cache indisponível neste navegador.');
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Falha ao buscar WDO.');
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <PanelShell title="Dados & Ativos">
      <div>
        <span>Fonte {sourceMode}</span>
        <span>Replay {replay.status} {replay.currentIndex}/{replay.totalTrades}</span>
        <span>CSV {csvName ?? '—'}</span>
      </div>
      <div>
        <span>Materiais: {materials.map((m) => `${m.symbol} (${m.sessions.length})`).join(' · ') || '—'}</span>
        <span>WDO cache: {cache ? `${cache.candles.length} sessões` : '—'}</span>
      </div>
      <div role="radiogroup" aria-label="Ativo de estudo">
        {ASSETS.map((a) => (
          <label key={a}>
            <input type="radio" checked={asset === a} onChange={() => setAsset(a)} />
            {ASSET_LABELS[a]}
          </label>
        ))}
      </div>
      <div>
        <label>
          Importar CSV
          <input type="file" accept=".csv" onChange={(e) => onCsv(e.target.files?.[0])} />
        </label>
        <button type="button" onClick={onRefreshWdo} disabled={busy}>
          {busy ? 'Buscando…' : 'Atualizar WDO'}
        </button>
      </div>
      {notice && <p>{notice}</p>}
    </PanelShell>
  );
}
