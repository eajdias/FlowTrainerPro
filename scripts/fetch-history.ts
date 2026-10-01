import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCotahistUrl,
  cotahistFileName,
  downloadFile,
  sha256File,
  writeManifest,
  HttpStatusError,
} from '../src/core/marketData/history/fetch';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : fallback;
}

const year = Number(arg('--year', '2024'));
const outDir = arg('--out', 'data/raw');
if (!Number.isInteger(year) || year < 1986 || year > 2100) {
  console.error('Uso: vite-node scripts/fetch-history.ts --year YYYY [--out data/raw]');
  process.exitCode = 1;
} else {
  const url = buildCotahistUrl(year);
  const dest = join(outDir, cotahistFileName(year));
  mkdirSync(outDir, { recursive: true });
  try {
    await downloadFile(url, dest);
    const manifest = writeManifest(outDir, {
      year,
      url,
      bytes: statSync(dest).size,
      sha256: sha256File(dest),
    });
    console.log(`ok: ${dest}\nmanifest: ${manifest}`);
  } catch (err) {
    if (err instanceof HttpStatusError) {
      console.error(`Download manual necessário (HTTP ${err.status}): página da B3 em https://www.b3.com.br/.../cotacoes-historicas/ → salvar em ${outDir}/`);
    } else {
      console.error(err instanceof Error ? err.message : err);
    }
    process.exitCode = 1;
  }
}
