import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TextDecoder } from 'node:util';
import { parseCsvTrades } from '../src/core/marketData/import';

function decodeFile(filePath: string): { text: string; encoding: 'utf-8' | 'latin1' } {
  const buffer = readFileSync(filePath);
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(buffer), encoding: 'utf-8' };
  } catch {
    return { text: new TextDecoder('latin1').decode(buffer), encoding: 'latin1' };
  }
}
function fmtTimestamp(timestamp: number | null): string { return timestamp === null ? '-' : new Date(timestamp).toISOString(); }
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Uso: npm run validate:trade-csv -- data/imports/arquivo.csv');
  process.exitCode = 1;
} else {
  const filePath = resolve(process.cwd(), inputPath);
  if (!existsSync(filePath)) {
    console.error(JSON.stringify({ code: 'TRADE_IMPORT_FILE_NOT_FOUND', filePath, message: `Arquivo de negocios nao encontrado: ${filePath}` }, null, 2));
    process.exitCode = 1;
  } else {
    const { text, encoding } = decodeFile(filePath);
    const result = parseCsvTrades(text);
    const d = result.diagnostics;
    console.log(`arquivo: ${filePath}`);
    console.log(`encoding: ${encoding}`);
    console.log(`linhas fisicas: ${d.physicalLineCount}`);
    console.log(`linhas vazias: ${d.blankLineCount}`);
    console.log(`linhas validas: ${d.validTradeCount}`);
    console.log(`linhas invalidas: ${d.invalidLineCount}`);
    console.log(`warnings: ${d.warningCount}`);
    console.log(`ativo: ${result.trades[0]?.asset ?? '-'}`);
    console.log(`data: ${result.trades[0]?.tradeDate ?? '-'}`);
    console.log(`primeiro timestamp: ${fmtTimestamp(d.firstTimestamp)}`);
    console.log(`ultimo timestamp: ${fmtTimestamp(d.lastTimestamp)}`);
    console.log(`preco minimo: ${d.minPrice ?? '-'}`);
    console.log(`preco maximo: ${d.maxPrice ?? '-'}`);
    console.log(`quantidade total: ${d.totalQuantity}`);
    console.log(`corretoras unicas: ${d.uniqueBrokerCount}`);
    console.log(`agressores trades: ${JSON.stringify(d.aggressorTradeCounts)}`);
    console.log(`agressores volumes: ${JSON.stringify(d.aggressorVolumes)}`);
    console.log(`tempo parsing ms: ${d.elapsedParsingMs.toFixed(2)}`);
    if (d.invalidLines.length > 0) {
      console.log('linhas invalidas:');
      for (const invalid of d.invalidLines.slice(0, 10)) console.log(`- linha ${invalid.sourceLine}: ${invalid.reasonCode} (${invalid.message})`);
    }
  }
}
