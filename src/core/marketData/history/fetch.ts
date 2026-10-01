// core/marketData/history/fetch.ts
// Aquisição COTAHIST (B3, Spec 1/4). Sem parsing aqui — só download + manifest.
// Base verificada em 2026-10-01 (HTTP 200). A B3 pode exigir CAPTCHA em alguns
// momentos; nesse caso o fallback é download manual p/ data/raw/ (ver b3quant).

import { createWriteStream, readFileSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

/** Base oficial dos arquivos de séries históricas (verificado: HTTP 200). */
export const B3_COTAHIST_BASE_URL = 'https://bvmf.bmfbovespa.com.br/InstDados/SerHist';

export const FETCH_TIMEOUT_MS = 30000;

export interface FetchManifest {
  source: 'b3-cotahist';
  year: number;
  url: string;
  fetchedAt: string;
  bytes: number;
  sha256: string;
}

export class HttpStatusError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`download falhou com HTTP ${status}: ${url}`);
    this.name = 'HttpStatusError';
    this.status = status;
    this.url = url;
  }
}

export class FetchTimeoutError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`download excedeu ${FETCH_TIMEOUT_MS}ms: ${url}`);
    this.name = 'FetchTimeoutError';
    this.url = url;
  }
}

export function cotahistFileName(year: number): string {
  return `COTAHIST_A${year}.ZIP`;
}

export function buildCotahistUrl(year: number): string {
  return `${B3_COTAHIST_BASE_URL}/${cotahistFileName(year)}`;
}

export function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function writeManifest(
  dir: string,
  input: { year: number; url: string; bytes: number; sha256: string },
  now: () => string = () => new Date().toISOString(),
): string {
  const manifest: FetchManifest = {
    source: 'b3-cotahist',
    year: input.year,
    url: input.url,
    fetchedAt: now(),
    bytes: input.bytes,
    sha256: input.sha256,
  };
  const path = join(dir, `${cotahistFileName(input.year)}.manifest.json`);
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  return path;
}

/** Baixa a URL p/ o destino. Resolve o caminho gravado; rejeita tipado em erro. */
export async function downloadFile(url: string, destPath: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (cause) {
    if (controller.signal.aborted) throw new FetchTimeoutError(url);
    throw cause;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok || !response.body) {
    throw new HttpStatusError(response.status, url);
  }
  await writeStreamToFile(response.body, destPath);
  return destPath;
}

async function writeStreamToFile(body: ReadableStream<Uint8Array>, destPath: string): Promise<void> {
  const file = createWriteStream(destPath);
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await new Promise<void>((resolve, reject) => {
        file.write(value, (err: Error | null | undefined) => (err ? reject(err) : resolve()));
      });
    }
  } finally {
    reader.releaseLock();
    await new Promise<void>((resolve) => file.close(() => resolve()));
  }
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function writeTextFile(path: string, text: string): Promise<void> {
  await writeFile(path, text, 'utf8');
}
