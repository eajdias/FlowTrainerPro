// core/marketData/import.ts
// Fase 1: CSV -> MarketTrade[] (isolado de replay, EventBus, React, Zustand).
// Formato: UTF-8/Latin-1, delimitador `;`, data DD/MM/YYYY, hora HH:mm:ss,
// preco pt-BR (5.159,50). Contrato imutavel por Object.freeze.

import type { AggressorType, MarketBroker, MarketTrade } from './types';

export interface CsvImportOptions {
  now?: () => number;
}

export interface InvalidTradeLine {
  sourceLine: number;
  reasonCode: string;
  message: string;
  rawLine: string;
}

export interface ImportDiagnostics {
  physicalLineCount: number;
  blankLineCount: number;
  validTradeCount: number;
  invalidLineCount: number;
  warningCount: number;
  duplicateCount: number;
  outOfOrderCount: number;
  unknownAggressorCount: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  totalQuantity: number;
  uniqueBrokerCount: number;
  aggressorTradeCounts: Record<AggressorType, number>;
  aggressorVolumes: Record<AggressorType, number>;
  invalidLines: InvalidTradeLine[];
  elapsedParsingMs: number;
}

export interface CsvImportResult {
  trades: MarketTrade[];
  diagnostics: ImportDiagnostics;
}

const EXPECTED_HEADER = ['ATIVO', 'DATA', 'HORARIO', 'Corretora Compradora', 'Valor da Negociacao', 'Qd Lts', 'Corretora Vendedora', 'Agressor'];

function zeroAggressorMaps(): { counts: Record<AggressorType, number>; volumes: Record<AggressorType, number> } {
  const counts = { BUY: 0, SELL: 0, RLP: 0, DIRECT: 0, AUCTION: 0, UNKNOWN: 0 };
  return { counts, volumes: { ...counts } };
}

/** Mapeia o texto do agressor preservando RLP/Direto/Leilao. */
export function normalizeAggressor(raw: string): AggressorType {
  const v = raw.trim().toLowerCase();
  if (v === 'comprador') return 'BUY';
  if (v === 'vendedor') return 'SELL';
  if (v === 'rlp') return 'RLP';
  if (v === 'direto') return 'DIRECT';
  if (v === 'leilao' || v === 'leilão') return 'AUCTION';
  return 'UNKNOWN';
}

/** Numero pt-BR ("5.159,50" -> 5159.5). null se invalido. */
export function parsePtBrNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "123 - NOME" ou "NOME" -> { code, name, raw }. */
export function parseBroker(raw: string): MarketBroker {
  const trimmed = raw.trim();
  const m = /^(\d+)\s*[-–]\s*(.+)$/.exec(trimmed);
  if (m) return { code: Number(m[1]), name: m[2]!.trim(), raw: trimmed };
  const asNumber = /^\d+$/.test(trimmed) ? Number(trimmed) : null;
  return { code: asNumber, name: trimmed, raw: trimmed };
}

function toTimestamp(date: string, time: string): number | null {
  const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  const tm = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time.trim());
  if (!dm || !tm) return null;
  const ts = Date.UTC(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]), Number(tm[1]), Number(tm[2]), Number(tm[3]));
  return Number.isFinite(ts) ? ts : null;
}

function tradeIdFor(parts: string[]): string {
  let hash = 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) hash = (Math.imul(hash, 31) + s.charCodeAt(i)) | 0;
  return `ht-${(hash >>> 0).toString(16)}`;
}

export function parseCsvTrades(text: string, options: CsvImportOptions = {}): CsvImportResult {
  const startedAt = (options.now ?? Date.now)();
  const lines = text.split(/\r?\n/);
  const physicalLineCount = lines.length;

  const diagnostics = {
    blankLineCount: 0,
    validTradeCount: 0,
    invalidLineCount: 0,
    warningCount: 0,
    duplicateCount: 0,
    outOfOrderCount: 0,
    unknownAggressorCount: 0,
    firstTimestamp: null as number | null,
    lastTimestamp: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    totalQuantity: 0,
    invalidLines: [] as InvalidTradeLine[],
  };
  const { counts, volumes } = zeroAggressorMaps();
  const brokers = new Set<string>();

  const fail = (sourceLine: number, reasonCode: string, message: string, rawLine: string): void => {
    diagnostics.invalidLineCount += 1;
    diagnostics.invalidLines.push({ sourceLine, reasonCode, message, rawLine: rawLine.slice(0, 200) });
  };

  // Localiza o cabecalho (ignora linhas anteriores).
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i]!.split(';').map((c) => c.trim());
    if (EXPECTED_HEADER.every((h, j) => cells[j] === h)) {
      headerIdx = i;
      break;
    }
  }

  const trades: MarketTrade[] = [];
  const seenIds = new Set<string>();

  if (headerIdx < 0) {
    return {
      trades,
      diagnostics: {
        physicalLineCount,
        ...diagnostics,
        uniqueBrokerCount: 0,
        aggressorTradeCounts: counts,
        aggressorVolumes: volumes,
        elapsedParsingMs: Math.max(0, (options.now ?? Date.now)() - startedAt),
      },
    };
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const sourceLine = i + 1;
    if (rawLine.trim() === '') {
      diagnostics.blankLineCount += 1;
      continue;
    }
    const cells = rawLine.split(';');
    if (cells.length < EXPECTED_HEADER.length) {
      fail(sourceLine, 'TRADE_IMPORT_SHORT_LINE', `esperadas ${EXPECTED_HEADER.length} colunas`, rawLine);
      continue;
    }
    const [asset, tradeDate, tradeTime, buyerRaw, priceRaw, qtyRaw, sellerRaw, aggressorRaw] =
      cells.slice(0, 8).map((c) => c.trim());

    const timestamp = toTimestamp(tradeDate!, tradeTime!);
    const price = parsePtBrNumber(priceRaw!);
    const quantity = parsePtBrNumber(qtyRaw!);
    if (timestamp === null) {
      fail(sourceLine, 'TRADE_IMPORT_BAD_DATETIME', 'data/hora invalidas', rawLine);
      continue;
    }
    if (price === null || price <= 0) {
      fail(sourceLine, 'TRADE_IMPORT_BAD_PRICE', 'preco invalido', rawLine);
      continue;
    }
    if (quantity === null || quantity <= 0) {
      fail(sourceLine, 'TRADE_IMPORT_BAD_QTY', 'quantidade invalida', rawLine);
      continue;
    }

    const aggressor = normalizeAggressor(aggressorRaw!);
    if (aggressor === 'UNKNOWN') diagnostics.unknownAggressorCount += 1;
    const buyerBroker = parseBroker(buyerRaw!);
    const sellerBroker = parseBroker(sellerRaw!);
    const chronologicalSequence = trades.length;
    const tradeId = tradeIdFor([asset!, tradeDate!, tradeTime!, String(chronologicalSequence), String(price), String(quantity), buyerRaw!, sellerRaw!, aggressor]);

    if (seenIds.has(tradeId)) {
      diagnostics.duplicateCount += 1;
      diagnostics.warningCount += 1;
      continue;
    }
    seenIds.add(tradeId);

    trades.push({
      tradeId,
      sourceLine,
      sourceSequence: chronologicalSequence,
      chronologicalSequence,
      asset: asset!,
      tradeDate: tradeDate!,
      tradeTime: tradeTime!,
      timestamp,
      price,
      priceInTicks: Math.round(price * 2) / 2,
      quantity,
      buyerBroker,
      sellerBroker,
      aggressor,
      source: 'csv' as const,
    });
  }

  // Direcao predominante -> ordem crescente.
  let asc = 0;
  let desc = 0;
  for (let i = 1; i < trades.length; i++) {
    if (trades[i]!.timestamp > trades[i - 1]!.timestamp) asc += 1;
    else if (trades[i]!.timestamp < trades[i - 1]!.timestamp) desc += 1;
  }
  const wasDescending = desc > asc;
  trades.sort((a, b) => a.timestamp - b.timestamp || (wasDescending ? b.sourceSequence - a.sourceSequence : a.sourceSequence - b.sourceSequence));
  const frozen: MarketTrade[] = trades.map((t, idx) =>
    Object.freeze({ ...t, chronologicalSequence: idx }),
  );

  for (const t of frozen) {
    counts[t.aggressor] += 1;
    volumes[t.aggressor] += t.quantity;
    diagnostics.totalQuantity += t.quantity;
    brokers.add(t.buyerBroker.raw);
    brokers.add(t.sellerBroker.raw);
    if (diagnostics.minPrice === null || t.price < diagnostics.minPrice) diagnostics.minPrice = t.price;
    if (diagnostics.maxPrice === null || t.price > diagnostics.maxPrice) diagnostics.maxPrice = t.price;
  }
  diagnostics.validTradeCount = frozen.length;
  diagnostics.firstTimestamp = frozen[0]?.timestamp ?? null;
  diagnostics.lastTimestamp = frozen[frozen.length - 1]?.timestamp ?? null;

  return {
    trades: frozen,
    diagnostics: {
      physicalLineCount,
      ...diagnostics,
      uniqueBrokerCount: brokers.size,
      aggressorTradeCounts: counts,
      aggressorVolumes: volumes,
      elapsedParsingMs: Math.max(0, (options.now ?? Date.now)() - startedAt),
    },
  };
}
