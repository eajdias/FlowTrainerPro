import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsvTrades } from '../../src/core/marketData/import';
import {
  ATEMPORAL_CHART_POINTS_PER_CANDLE,
  ATEMPORAL_CHART_TICK_SIZE,
  ATEMPORAL_CHART_TICKS_PER_CANDLE,
  buildCandles,
  appendTradesToProjection,
  calculatePriceDomain,
  calculateChartGeometry,
  calculateVisibleCandleCapacity,
  clampVisibleStartIndex,
  createRuntimeSnapshot,
  generatePriceAxisTicks,
  getAutoFollowViewport,
  getCandleX,
  getManualViewport,
  nicePriceStep,
  priceToY,
  resolveValidChartWidth,
  snapPriceToTick,
  type ChartProjection,
  type ChartTrade,
  yToPrice,
} from '../../src/panels/Chart8PPanel/AtemporalChart';

function makeTrades(prices: number[]): ChartTrade[] {
  return prices
    .map((price, index) => ({
      tradeId: `trade-${index}`,
      timestamp: index,
      price,
      size: 1,
      aggressorSide: index % 2 === 0 ? 'BUY' : 'SELL',
    }) satisfies ChartTrade)
    .reverse();
}

function makeClosedCandleTrades(candleCount: number, startIndex = 0): ChartTrade[] {
  const trades: ChartTrade[] = [];
  for (let candleIndex = 0; candleIndex < candleCount; candleIndex += 1) {
    const base = 5000 + candleIndex * ATEMPORAL_CHART_POINTS_PER_CANDLE;
    const steps = [0, 4, ATEMPORAL_CHART_POINTS_PER_CANDLE];
    for (let step = 0; step < steps.length; step += 1) {
      const index = startIndex + candleIndex * 5 + step;
      trades.push({
        tradeId: `seq-${index}`,
        timestamp: index,
        price: base + steps[step],
        size: 1,
        aggressorSide: step % 2 === 0 ? 'BUY' : 'SELL',
      });
    }
  }
  return trades;
}

describe('AtemporalChart viewport deslizante', () => {
  it('mantem um candle visivel com capacidade minima', () => {
    const capacity = calculateVisibleCandleCapacity(4, 5, 1);
    const viewport = getAutoFollowViewport(1, capacity);

    expect(capacity).toBe(1);
    expect(viewport).toEqual({ visibleStartIndex: 0, visibleEndIndex: 0, visibleCandleCapacity: 1 });
  });

  it('mostra todos os candles quando a quantidade esta abaixo da capacidade', () => {
    const viewport = getAutoFollowViewport(3, 5);

    expect(viewport.visibleStartIndex).toBe(0);
    expect(viewport.visibleEndIndex).toBe(2);
  });

  it('mantem a janela no inicio quando a quantidade e igual a capacidade', () => {
    const viewport = getAutoFollowViewport(5, 5);

    expect(viewport.visibleStartIndex).toBe(0);
    expect(viewport.visibleEndIndex).toBe(4);
  });

  it('desliza um candle quando a capacidade e excedida em um', () => {
    const viewport = getAutoFollowViewport(6, 5);

    expect(viewport.visibleStartIndex).toBe(1);
    expect(viewport.visibleEndIndex).toBe(5);
  });

  it('desliza varios candles mantendo o ultimo visivel', () => {
    const viewport = getAutoFollowViewport(10, 5);

    expect(viewport.visibleStartIndex).toBe(5);
    expect(viewport.visibleEndIndex).toBe(9);
  });

  it('com muitos candles acima da capacidade exibe somente a faixa final', () => {
    const viewport = getAutoFollowViewport(25, 7);

    expect(viewport.visibleStartIndex).toBe(18);
    expect(viewport.visibleEndIndex).toBe(24);
    expect(viewport.visibleEndIndex - viewport.visibleStartIndex + 1).toBe(7);
  });

  it('remove visualmente o candle mais antigo apenas apos exceder a capacidade', () => {
    expect(getAutoFollowViewport(5, 5).visibleStartIndex).toBe(0);
    expect(getAutoFollowViewport(6, 5).visibleStartIndex).toBe(1);
  });

  it('nao remove candles do historico logico ao calcular viewport', () => {
    const candles = Array.from({ length: 7 }, (_, index) => index);
    const viewport = getAutoFollowViewport(candles.length, 5);

    expect(candles).toHaveLength(7);
    expect(candles.slice(viewport.visibleStartIndex, viewport.visibleEndIndex + 1)).toEqual([2, 3, 4, 5, 6]);
  });

  it('calcula X relativo ao visibleStartIndex', () => {
    expect(getCandleX(5, 5, 56, 5, 1)).toBe(58.5);
    expect(getCandleX(6, 5, 56, 5, 1)).toBe(64.5);
  });

  it('mantem espacamento sem sobreposicao entre candles', () => {
    const first = getCandleX(5, 5, 56, 5, 1);
    const second = getCandleX(6, 5, 56, 5, 1);

    expect(second - first).toBe(6);
  });

  it('drag para historico usa viewport manual e desativa o fim automatico por inferencia', () => {
    const capacity = 5;
    const candleCount = 10;
    const latestStart = getAutoFollowViewport(candleCount, capacity).visibleStartIndex;
    const manual = getManualViewport(candleCount, capacity, latestStart - 2);

    expect(manual.visibleStartIndex).toBe(3);
    expect(manual.visibleStartIndex).toBeLessThan(latestStart);
  });

  it('novos candles nao reposicionam viewport manual automaticamente', () => {
    const manualBefore = getManualViewport(10, 5, 2);
    const manualAfter = getManualViewport(11, 5, manualBefore.visibleStartIndex);

    expect(manualAfter.visibleStartIndex).toBe(2);
    expect(manualAfter.visibleEndIndex).toBe(6);
  });

  it('voltar ao atual reativa a janela final', () => {
    const follow = getAutoFollowViewport(11, 5);

    expect(follow.visibleStartIndex).toBe(6);
    expect(follow.visibleEndIndex).toBe(10);
  });

  it('resize maior aumenta a quantidade historica visivel', () => {
    const small = calculateVisibleCandleCapacity(72, 5, 1);
    const large = calculateVisibleCandleCapacity(132, 5, 1);

    expect(large).toBeGreaterThan(small);
  });

  it('resize menor reduz a quantidade historica visivel', () => {
    const large = calculateVisibleCandleCapacity(132, 5, 1);
    const small = calculateVisibleCandleCapacity(72, 5, 1);

    expect(small).toBeLessThan(large);
  });

  it('zoom preserva o fim quando autoFollow esta ativo', () => {
    const zoomOutCapacity = 8;
    const zoomInCapacity = 4;

    expect(getAutoFollowViewport(12, zoomOutCapacity).visibleEndIndex).toBe(11);
    expect(getAutoFollowViewport(12, zoomInCapacity).visibleEndIndex).toBe(11);
  });

  it('zoom preserva aproximadamente a navegacao historica quando autoFollow esta inativo', () => {
    const oldManual = getManualViewport(20, 10, 4);
    const center = oldManual.visibleStartIndex + Math.floor(oldManual.visibleCandleCapacity / 2);
    const nextManual = getManualViewport(20, 5, center - Math.floor(5 / 2));

    expect(nextManual.visibleStartIndex).toBe(7);
    expect(nextManual.visibleEndIndex).toBe(11);
  });

  it('candle atual fecha e permanece no historico 8P', () => {
    const candles = buildCandles(makeTrades([100, 104, 108]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(true);
  });

  it('novo candle recebe novo indice apos fechamento do anterior', () => {
    const candles = buildCandles(makeTrades([100, 104, 108, 108.5]));

    expect(candles).toHaveLength(2);
    expect(candles[0].closed).toBe(true);
    expect(candles[1].closed).toBe(false);
    expect(candles[1].open).toBe(108.5);
  });

  it('reset visual volta a janela para o inicio logico sem dados', () => {
    expect(getAutoFollowViewport(0, 5)).toEqual({
      visibleStartIndex: 0,
      visibleEndIndex: -1,
      visibleCandleCapacity: 5,
    });
  });

  it('nova sessao com poucos candles comeca no inicio', () => {
    expect(getAutoFollowViewport(2, 8).visibleStartIndex).toBe(0);
  });

  it('replay 1x mantem a janela final deterministica', () => {
    expect(getAutoFollowViewport(16, 6)).toEqual({
      visibleStartIndex: 10,
      visibleEndIndex: 15,
      visibleCandleCapacity: 6,
    });
  });

  it('replay 4x mantem a janela final deterministica', () => {
    expect(getAutoFollowViewport(64, 6)).toEqual({
      visibleStartIndex: 58,
      visibleEndIndex: 63,
      visibleCandleCapacity: 6,
    });
  });

  it('replay 16x mantem a janela final deterministica', () => {
    expect(getAutoFollowViewport(256, 6)).toEqual({
      visibleStartIndex: 250,
      visibleEndIndex: 255,
      visibleCandleCapacity: 6,
    });
  });

  it('CSV real usa o mesmo modelo para grandes historicos', () => {
    const viewport = getAutoFollowViewport(500, 40);

    expect(viewport.visibleStartIndex).toBe(460);
    expect(viewport.visibleEndIndex).toBe(499);
  });

  it('nao gera NaN nas formulas principais', () => {
    const values = [
      calculateVisibleCandleCapacity(0, 0, 0),
      clampVisibleStartIndex(Number.NaN, 10, 5),
      getCandleX(2, 1, 56, 5, 1),
    ];

    expect(values.every(Number.isNaN)).toBe(false);
    expect(values.every(Number.isFinite)).toBe(true);
  });

  it('nao gera Infinity nas formulas principais', () => {
    const values = [
      calculateVisibleCandleCapacity(10, 0, 0),
      clampVisibleStartIndex(Number.POSITIVE_INFINITY, 10, 5),
      getCandleX(2, 1, 56, 5, 1),
    ];

    expect(values.every(Number.isFinite)).toBe(true);
  });

  it('nao permite indice negativo', () => {
    expect(clampVisibleStartIndex(-100, 10, 5)).toBe(0);
  });

  it('nao altera a regra 8P de fechamento por range de oito pontos', () => {
    const stillForming = buildCandles(makeTrades([100, 104, 107.5]));
    const closed = buildCandles(makeTrades([100, 104, 108]));

    expect(stillForming).toHaveLength(1);
    expect(stillForming[0].closed).toBe(false);
    expect(closed[0].closed).toBe(true);
  });

  it('usa tick size de 0,50 e oito pontos equivalem a 16 ticks no WDO', () => {
    expect(ATEMPORAL_CHART_TICK_SIZE).toBe(0.5);
    expect(ATEMPORAL_CHART_POINTS_PER_CANDLE).toBe(8);
    expect(ATEMPORAL_CHART_TICKS_PER_CANDLE).toBe(16);
  });

  it('um unico trade nao fecha candle sem atingir oito pontos', () => {
    const candles = buildCandles(makeTrades([5080]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
  });

  it('mil trades no mesmo preco nao fecham candle por tempo ou quantidade', () => {
    const trades = Array.from({ length: 1000 }, (_, index) => ({
      tradeId: `same-price-${index}`,
      timestamp: index * 1000,
      price: 5080,
      size: 1,
      aggressorSide: index % 2 === 0 ? 'BUY' : 'SELL',
    }) satisfies ChartTrade).reverse();
    const candles = buildCandles(trades);

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
    expect(candles[0].buyVol + candles[0].sellVol).toBe(1000);
  });

  it('volume alto sem deslocamento nao fecha candle', () => {
    const candles = buildCandles([{
      tradeId: 'large-volume',
      timestamp: 1,
      price: 5080,
      size: 10_000,
      aggressorSide: 'BUY',
    }]);

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
    expect(candles[0].buyVol).toBe(10_000);
  });

  it('timestamp diferente nao fecha candle sem deslocamento', () => {
    const candles = buildCandles([
      { tradeId: 't3', timestamp: 600_000, price: 5080, size: 1, aggressorSide: 'BUY' },
      { tradeId: 't2', timestamp: 300_000, price: 5080, size: 1, aggressorSide: 'SELL' },
      { tradeId: 't1', timestamp: 0, price: 5080, size: 1, aggressorSide: 'BUY' },
    ]);

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
  });

  it('movimento comprador inferior a oito pontos mantem candle aberto', () => {
    const candles = buildCandles(makeTrades([5080, 5084, 5087.5]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
    expect(candles[0].high).toBe(5087.5);
  });

  it('movimento comprador exatamente no limite de oito pontos fecha candle', () => {
    const candles = buildCandles(makeTrades([5080, 5084, 5088]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(true);
  });

  it('movimento vendedor inferior a oito pontos mantem candle aberto', () => {
    const candles = buildCandles(makeTrades([5088, 5084, 5080.5]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(false);
    expect(candles[0].low).toBe(5080.5);
  });

  it('movimento vendedor exatamente no limite de oito pontos fecha candle', () => {
    const candles = buildCandles(makeTrades([5088, 5084, 5080]));

    expect(candles).toHaveLength(1);
    expect(candles[0].closed).toBe(true);
  });

  it('high low volume e agressao acumulam no mesmo candle em formacao', () => {
    const candles = buildCandles([
      { tradeId: 'a3', timestamp: 3, price: 5082, size: 4, aggressorSide: 'BUY' },
      { tradeId: 'a2', timestamp: 2, price: 5078, size: 3, aggressorSide: 'SELL' },
      { tradeId: 'a1', timestamp: 1, price: 5080, size: 2, aggressorSide: 'BUY' },
    ]);

    expect(candles).toHaveLength(1);
    expect(candles[0].high).toBe(5082);
    expect(candles[0].low).toBe(5078);
    expect(candles[0].buyVol).toBe(6);
    expect(candles[0].sellVol).toBe(3);
    expect(candles[0].delta).toBe(3);
  });

  it('candle fechado permanece imutavel quando o proximo candle recebe trades', () => {
    const projection = appendTradesToProjection({ candles: [] }, [
      ...makeClosedCandleTrades(1),
      { tradeId: 'next-open', timestamp: 999, price: 5010, size: 5, aggressorSide: 'BUY' },
    ]);

    expect(projection.candles).toHaveLength(2);
    expect(projection.candles[0]).toMatchObject({ open: 5000, high: 5008, low: 5000, close: 5008, closed: true });
    expect(projection.candles[1]).toMatchObject({ open: 5010, close: 5010, closed: false });
  });

  it('mesma sequencia de precos com timestamps diferentes produz os mesmos candles', () => {
    const prices = [5080, 5084, 5088, 5089, 5093, 5097];
    const fast = buildCandles(prices.map((price, index) => ({
      tradeId: `fast-${index}`,
      timestamp: index,
      price,
      size: 1,
      aggressorSide: 'BUY',
    })).reverse() as ChartTrade[]);
    const slow = buildCandles(prices.map((price, index) => ({
      tradeId: `slow-${index}`,
      timestamp: index * 60_000,
      price,
      size: 1,
      aggressorSide: 'BUY',
    })).reverse() as ChartTrade[]);

    expect(fast.map((c) => ({ open: c.open, high: c.high, low: c.low, close: c.close, closed: c.closed })))
      .toEqual(slow.map((c) => ({ open: c.open, high: c.high, low: c.low, close: c.close, closed: c.closed })));
  });

  it('mesmo numero de trades com precos diferentes pode produzir quantidade diferente de candles', () => {
    const noClose = buildCandles(makeTrades([5080, 5081, 5082]));
    const closes = buildCandles(makeTrades([5080, 5084, 5088]));

    expect(noClose).toHaveLength(1);
    expect(noClose[0].closed).toBe(false);
    expect(closes).toHaveLength(1);
    expect(closes[0].closed).toBe(true);
  });

  it('CSV real produz candles 8P atemporais iguais em 1x, 4x e 16x', () => {
    const filePath = 'data/imports/WDOFUT_F_0_Trade_13-07-2026.csv';
    if (!existsSync(filePath)) return;

    const text = readFileSync(filePath).toString('latin1');
    const parsed = parseCsvTrades(text, { now: () => 0 });
    const chronologicalTrades: ChartTrade[] = parsed.trades.map((trade) => ({
      tradeId: trade.tradeId,
      timestamp: trade.timestamp,
      price: trade.price,
      size: trade.quantity,
      aggressorSide: trade.aggressor,
    }));
    const newestFirst = [...chronologicalTrades].reverse();
    const at1x = buildCandles(newestFirst);
    const at4x = buildCandles(newestFirst.map((trade) => ({ ...trade, timestamp: Math.floor(trade.timestamp / 4) })));
    const at16x = buildCandles(newestFirst.map((trade) => ({ ...trade, timestamp: Math.floor(trade.timestamp / 16) })));
    const shape = (candles: ReturnType<typeof buildCandles>) => candles.map((candle) => ({
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      closed: candle.closed,
    }));

    expect(parsed.diagnostics.validTradeCount).toBe(39292);
    expect(at1x.filter((candle) => candle.closed)).toHaveLength(24);
    expect(at1x).toHaveLength(25);
    expect(at1x.at(-1)?.closed).toBe(false);
    expect(shape(at4x)).toEqual(shape(at1x));
    expect(shape(at16x)).toEqual(shape(at1x));
  });

  it('mantem capacidade estavel durante 500 fechamentos sequenciais', () => {
    let projection: ChartProjection = { candles: [] };
    const capacity = 40;

    for (let index = 0; index < 500; index += 1) {
      projection = appendTradesToProjection(projection, makeClosedCandleTrades(1, index * 5));
      const viewport = getAutoFollowViewport(projection.candles.length, capacity);
      const visibleCount = viewport.visibleEndIndex - viewport.visibleStartIndex + 1;

      expect(projection.candles).toHaveLength(index + 1);
      expect(visibleCount).toBe(Math.min(index + 1, capacity));
      expect(visibleCount).toBeGreaterThan(index + 1 >= capacity ? 1 : 0);
      expect(viewport.visibleEndIndex).toBe(index);
    }
  });

  it('mantem historico logico com 2.000 candles e janela sem colapso', () => {
    const projection = appendTradesToProjection({ candles: [] }, makeClosedCandleTrades(2000));
    const viewport = getAutoFollowViewport(projection.candles.length, 84);

    expect(projection.candles).toHaveLength(2000);
    expect(viewport.visibleStartIndex).toBe(1916);
    expect(viewport.visibleEndIndex).toBe(1999);
    expect(viewport.visibleEndIndex - viewport.visibleStartIndex + 1).toBe(84);
  });

  it('ignora dimensoes invalidas de ResizeObserver e preserva ultima largura valida', () => {
    let previous = 1100;
    const widths = [1200, 1198, 0, 1201, undefined, 1199];
    const capacities: number[] = [];

    for (const width of widths) {
      const chartWidth = resolveValidChartWidth(width, 56, 34, previous);
      previous = chartWidth;
      capacities.push(calculateVisibleCandleCapacity(chartWidth, 5, 1));
    }

    expect(capacities.every((capacity) => capacity > 1)).toBe(true);
    expect(capacities[2]).toBe(capacities[1]);
    expect(capacities[4]).toBe(capacities[3]);
  });

  it('zoom repetido com novos candles nao faz capacidade colapsar para 1', () => {
    let projection = appendTradesToProjection({ candles: [] }, makeClosedCandleTrades(200));

    for (let index = 0; index < 100; index += 1) {
      const zoom = index % 2 === 0 ? 0.6 : 2;
      const geometry = calculateChartGeometry({
        containerWidth: 1200,
        previousValidChartWidth: 1110,
        leftPadding: 56,
        rightPadding: 34,
        zoom,
      });
      const viewport = getAutoFollowViewport(projection.candles.length, geometry.visibleCandleCapacity);

      expect(geometry.candleWidth).toBeGreaterThanOrEqual(3);
      expect(geometry.candleWidth).toBeLessThanOrEqual(10);
      expect(geometry.visibleCandleCapacity).toBeGreaterThan(1);
      expect(viewport.visibleEndIndex).toBe(projection.candles.length - 1);

      projection = appendTradesToProjection(projection, makeClosedCandleTrades(1, 1000 + index * 5));
    }
  });

  it('re-render e updates sem fechamento nao reduzem historico nem capacidade', () => {
    let projection = appendTradesToProjection({ candles: [] }, makeClosedCandleTrades(50));
    const capacity = 30;

    for (let index = 0; index < 1000; index += 1) {
      const beforeLength = projection.candles.length;
      projection = appendTradesToProjection(projection, []);
      const viewport = getAutoFollowViewport(projection.candles.length, capacity);

      expect(projection.candles).toHaveLength(beforeLength);
      expect(viewport.visibleEndIndex - viewport.visibleStartIndex + 1).toBe(capacity);
    }

    projection = appendTradesToProjection(projection, [{
      tradeId: 'forming-only',
      timestamp: 9999,
      price: 5000.5,
      size: 1,
      aggressorSide: 'BUY',
    }]);

    expect(projection.candles.length).toBeGreaterThanOrEqual(50);
  });

  it('projecao incremental nao colapsa quando a janela da store mantem apenas 100 trades', () => {
    let projection: ChartProjection = { candles: [] };
    let storeTrades: ChartTrade[] = [];
    const seen = new Set<string>();
    const capacity = 40;
    const stream = makeClosedCandleTrades(100);

    for (const trade of stream) {
      storeTrades = [trade, ...storeTrades].slice(0, 100);
      const newTrades = [...storeTrades].reverse().filter((item) => !seen.has(item.tradeId));
      projection = appendTradesToProjection(projection, newTrades);
      for (const item of newTrades) seen.add(item.tradeId);

      const viewport = getAutoFollowViewport(projection.candles.length, capacity);
      const visibleCount = viewport.visibleEndIndex >= viewport.visibleStartIndex
        ? viewport.visibleEndIndex - viewport.visibleStartIndex + 1
        : 0;

      expect(projection.candles.length).toBeGreaterThanOrEqual(1);
      expect(visibleCount).toBe(Math.min(projection.candles.length, capacity));
    }

    expect(projection.candles.length).toBe(100);
  });

  it('snapshot de runtime valida coordenadas X distintas e visibleCount esperado', () => {
    const projection = appendTradesToProjection({ candles: [] }, makeClosedCandleTrades(20));
    const geometry = calculateChartGeometry({
      containerWidth: 600,
      previousValidChartWidth: 510,
      leftPadding: 56,
      rightPadding: 34,
      zoom: 1,
    });
    const viewport = getAutoFollowViewport(projection.candles.length, geometry.visibleCandleCapacity);
    const coords = projection.candles.slice(-5).map((candle, offset) => ({
      id: candle.candleId,
      x: getCandleX(projection.candles.length - 5 + offset, viewport.visibleStartIndex, 56, geometry.candleWidth, geometry.candleGap),
    }));
    const snapshot = createRuntimeSnapshot({
      candles: projection.candles,
      geometry,
      viewport,
      autoFollow: true,
      zoom: 1,
      visibleStartRef: viewport.visibleStartIndex,
      lastVisibleCoordinates: coords,
    });

    expect(new Set(coords.map((coord) => coord.x))).toHaveProperty('size', coords.length);
    expect(snapshot.visibleCandlesLength).toBe(Math.min(20, geometry.visibleCandleCapacity));
    expect(snapshot.closedCandles).toBe(20);
  });

  it('snapPriceToTick respeita tickSize 0,5', () => {
    expect(snapPriceToTick(5067.24, 0.5)).toBe(5067);
    expect(snapPriceToTick(5067.26, 0.5)).toBe(5067.5);
  });

  it('nicePriceStep sempre retorna multiplo inteiro do tickSize', () => {
    const step = nicePriceStep(1.37, 0.5);

    expect(step % 0.5).toBe(0);
    expect(step).toBe(1.5);
  });

  it('calculatePriceDomain cria dominio minimo para apenas um candle', () => {
    const candles = buildCandles(makeTrades([5067.5]));
    const domain = calculatePriceDomain({
      visibleCandles: candles,
      currentPrice: 5067.5,
      tickSize: 0.5,
      verticalPaddingTicks: 4,
      minimumVisibleRangeTicks: 20,
    });

    expect(domain.maxPrice - domain.minPrice).toBeGreaterThanOrEqual(10);
    expect(domain.minPrice % 0.5).toBe(0);
    expect(domain.maxPrice % 0.5).toBe(0);
  });

  it('generatePriceAxisTicks nao duplica e ordena labels descendentes', () => {
    const ticks = generatePriceAxisTicks({
      minPrice: 5061,
      maxPrice: 5071.5,
      desiredTickCount: 8,
      tickSize: 0.5,
    });

    expect(new Set(ticks).size).toBe(ticks.length);
    expect(ticks).toEqual([...ticks].sort((a, b) => b - a));
    expect(ticks.every((tick) => Number.isFinite(tick) && tick % 0.5 === 0)).toBe(true);
  });

  it('priceToY e yToPrice sao aproximadamente inversas', () => {
    const domain = { minPrice: 5061, maxPrice: 5071.5 };
    const price = 5067.5;
    const y = priceToY(price, domain, 6, 240);
    const restored = yToPrice(y, domain, 6, 240);

    expect(restored).toBeCloseTo(price, 8);
  });

  it('currentPrice fora do range entra no dominio vertical', () => {
    const candles = buildCandles(makeTrades([5062.5]));
    const domain = calculatePriceDomain({
      visibleCandles: candles,
      currentPrice: 5075,
      tickSize: 0.5,
      verticalPaddingTicks: 4,
      minimumVisibleRangeTicks: 20,
    });

    expect(domain.maxPrice).toBeGreaterThanOrEqual(5075);
  });

  it('zoom in aumenta candleWidth e reduz capacidade sem alterar OHLC', () => {
    const before = calculateChartGeometry({
      containerWidth: 600,
      previousValidChartWidth: 510,
      leftPadding: 56,
      rightPadding: 34,
      candleWidth: 5,
    });
    const after = calculateChartGeometry({
      containerWidth: 600,
      previousValidChartWidth: 510,
      leftPadding: 56,
      rightPadding: 34,
      candleWidth: 6,
    });
    const candles = buildCandles(makeTrades([5080, 5084, 5088]));

    expect(after.candleWidth).toBeGreaterThan(before.candleWidth);
    expect(after.visibleCandleCapacity).toBeLessThan(before.visibleCandleCapacity);
    expect(candles[0]).toMatchObject({ open: 5080, high: 5088, low: 5080, close: 5088 });
  });

  it('zoom out reduz candleWidth e aumenta capacidade respeitando limite minimo', () => {
    const minGeometry = calculateChartGeometry({
      containerWidth: 600,
      previousValidChartWidth: 510,
      leftPadding: 56,
      rightPadding: 34,
      candleWidth: -10,
    });
    const normalGeometry = calculateChartGeometry({
      containerWidth: 600,
      previousValidChartWidth: 510,
      leftPadding: 56,
      rightPadding: 34,
      candleWidth: 5,
    });

    expect(minGeometry.candleWidth).toBe(3);
    expect(minGeometry.visibleCandleCapacity).toBeGreaterThan(normalGeometry.visibleCandleCapacity);
  });
});
