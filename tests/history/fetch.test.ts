import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { buildCotahistUrl, writeManifest, sha256File, downloadFile } from '../../src/core/marketData/history/fetch';

describe('history fetch (spec 1)', () => {
  it('monta URL anual terminando no ZIP do ano', () => {
    const url = buildCotahistUrl(2024);
    expect(url.startsWith('https://')).toBe(true);
    expect(url.endsWith('COTAHIST_A2024.ZIP')).toBe(true);
  });

  it('writeManifest grava os 6 campos', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ftp-manifest-'));
    const path = writeManifest(dir, {
      year: 2024,
      url: 'https://example.invalid/COTAHIST_A2024.ZIP',
      bytes: 10,
      sha256: 'abc',
    });
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(
      ['bytes', 'fetchedAt', 'sha256', 'source', 'url', 'year'].sort(),
    );
    expect(parsed.source).toBe('b3-cotahist');
  });

  it('sha256File confere conteúdo conhecido', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ftp-sha-'));
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'abc');
    expect(sha256File(file)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('downloadFile baixa bytes e falha tipado em 404', async () => {
    const server = createServer((req, res) => {
      if (req.url === '/ok.zip') {
        res.writeHead(200, { 'content-length': '3' });
        res.end('abc');
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const dir = mkdtempSync(join(tmpdir(), 'ftp-dl-'));
      const saved = await downloadFile(`http://127.0.0.1:${port}/ok.zip`, join(dir, 'ok.zip'));
      expect(readFileSync(saved, 'utf8')).toBe('abc');
      await expect(downloadFile(`http://127.0.0.1:${port}/no.zip`, join(dir, 'no.zip'))).rejects.toThrow(
        /404/,
      );
    } finally {
      server.close();
    }
  }, 15000);
});
