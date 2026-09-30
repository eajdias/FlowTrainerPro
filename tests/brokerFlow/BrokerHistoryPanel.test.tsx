import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrokerHistoryDashboard } from '../../src/panels/BrokerHistoryPanel/BrokerHistory';
import { ThemeProvider } from '../../src/ui/designSystem';
import { selectBrokerFlowRankings } from '../../src/store/brokerFlowStore';
import type { BrokerFlowDirectionalFilter, BrokerFlowViewMode, BrokerFlowWindowKey } from '../../src/store/brokerFlowStore';
import type { BrokerFlowSnapshot } from '../../src/core/analytics/brokerFlow';
import { broker, snapshot } from './brokerFlowFixtures';

function renderPanel(options: {
  brokers?: readonly BrokerFlowSnapshot[];
  selectedBroker?: BrokerFlowSnapshot | null;
  search?: string;
  viewMode?: BrokerFlowViewMode;
  directionalFilter?: BrokerFlowDirectionalFilter;
  selectedWindow?: BrokerFlowWindowKey;
  activeOnly?: boolean;
} = {}) {
  const brokers = options.brokers ?? [];
  const pseudoState = {
    brokers,
    latestSnapshot: snapshot(brokers),
    selectedBrokerKey: options.selectedBroker?.brokerKey ?? null,
    selectedWindow: options.selectedWindow ?? 'session',
    sortField: 'totalVolume' as const,
    sortDirection: 'desc' as const,
    search: options.search ?? '',
    activeOnly: options.activeOnly ?? false,
    directionalFilter: options.directionalFilter ?? 'all',
    minimumVolume: 0,
    minimumMarketShare: 0,
    viewMode: options.viewMode ?? 'ESSENTIAL',
    sourceMode: 'HISTORICAL_FILE' as const,
    sessionId: 'session-a',
    lastUpdateTimestamp: 1,
    status: brokers.length ? 'ready' : 'idle',
    receiveSnapshot: () => undefined,
    reset: () => undefined,
    selectBroker: () => undefined,
    setSelectedWindow: () => undefined,
    setSort: () => undefined,
    setSortDirection: () => undefined,
    setSearch: () => undefined,
    setActiveOnly: () => undefined,
    setDirectionalFilter: () => undefined,
    setMinimumVolume: () => undefined,
    setMinimumMarketShare: () => undefined,
    setViewMode: () => undefined,
  };
  return renderToStaticMarkup(
    <ThemeProvider>
      <BrokerHistoryDashboard
        brokers={brokers}
        selectedBroker={options.selectedBroker ?? null}
        rankings={selectBrokerFlowRankings(pseudoState)}
        selectedWindow={pseudoState.selectedWindow}
        search={pseudoState.search}
        activeOnly={pseudoState.activeOnly}
        directionalFilter={pseudoState.directionalFilter}
        minimumVolume={0}
        minimumMarketShare={0}
        viewMode={pseudoState.viewMode}
        status={pseudoState.status}
        processedTradeCount={42}
        selectBroker={() => undefined}
        setSelectedWindow={() => undefined}
        setSearch={() => undefined}
        setActiveOnly={() => undefined}
        setDirectionalFilter={() => undefined}
        setMinimumVolume={() => undefined}
        setMinimumMarketShare={() => undefined}
        setViewMode={() => undefined}
        setSort={() => undefined}
      />
    </ThemeProvider>,
  );
}

describe('BrokerHistoryPanel migrado para Broker Flow', () => {
  it('renderiza estado inicial e toolbar', () => {
    const html = renderPanel();
    expect(html).toContain('Broker Flow Dashboard');
    expect(html).toContain('Busca');
    expect(html).toContain('ESSENTIAL');
    expect(html).toContain('Aguardando snapshot de Broker Flow');
  });

  it('renderiza rankings, tabela essencial e tooltips obrigatórios', () => {
    const html = renderPanel({ brokers: [
      broker({ brokerCode: 1, brokerName: 'ALFA', aggressiveNetVolume: 80, marketShare: 0.4 }),
      broker({ brokerCode: 2, brokerName: 'BETA', aggressiveSellVolume: 140, aggressiveNetVolume: -120, marketShare: 0.2 }),
    ] });
    expect(html).toContain('Mais ativa');
    expect(html).toContain('Maior compra');
    expect(html).toContain('Maior venda');
    expect(html).toContain('Saldo agr.');
    expect(html).toContain('Persist.');
    expect(html).toContain('Diferença entre agressões compradoras e vendedoras observadas');
    expect(html).toContain('Participação observada no volume negociado');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });

  it('renderiza modos avançado e completo com categorias especiais separadas', () => {
    const brokers = [
      broker({
        brokerCode: 3,
        brokerName: 'GAMA',
        rlpBuyVolume: 10,
        directBuyVolume: 11,
        auctionBuyVolume: 12,
        unknownBuyVolume: 13,
      }),
    ];

    expect(renderPanel({ brokers, viewMode: 'ADVANCED' })).toContain('VWAP C');
    expect(renderPanel({ brokers, viewMode: 'ADVANCED' })).toContain('Maior lote');

    const complete = renderPanel({ brokers, viewMode: 'COMPLETE' });
    expect(complete).toContain('RLP');
    expect(complete).toContain('DIRECT');
    expect(complete).toContain('AUCTION');
    expect(complete).toContain('UNKNOWN');
  });

  it('renderiza busca, seleção e detalhe da corretora', () => {
    const delta = broker({ brokerCode: 4, brokerName: 'DELTA' });
    const html = renderPanel({ brokers: [delta], selectedBroker: delta, search: 'DEL' });
    expect(html).toContain('DELTA');
    expect(html).not.toContain('OMEGA');
    expect(html).toContain('Detalhe da corretora selecionada');
    expect(html).toContain('Resposta observada após a atuação');
    expect(html).toContain('Correlação temporal não prova causalidade');
  });
});
