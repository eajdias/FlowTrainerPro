import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AppShell,
  getGlobalSessionStatus,
  getSourceMeta,
} from '../../src/core/AppShell';
import {
  formatReplayTime,
  getNextReplaySpeed,
  getReplayControlStatus,
  ReplayToolbar,
} from '../../src/panels/ReplayToolbar/ReplayToolbar';
import { ThemeProvider } from '../../src/ui/designSystem';

describe('Global trading controls UX2', () => {
  it('Header renderiza ativo ausente sem valor falso e preserva conteudo', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <AppShell current="training" onNavigate={() => undefined}>
          <div>Workspace</div>
        </AppShell>
      </ThemeProvider>,
    );

    expect(html).toContain('FlowTrainerPro');
    expect(html).toContain('Nenhum ativo');
    expect(html).toContain('Workspace');
  });

  it('Header renderiza source mode oficial com tooltip', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <AppShell current="training" onNavigate={() => undefined}>
          <div />
        </AppShell>
      </ThemeProvider>,
    );

    expect(html).toContain('SYNTHETIC');
    expect(html).toContain('Mercado gerado pelo simulador.');
  });

  it('source modes possuem vocabulário e tooltips oficiais', () => {
    expect(getSourceMeta('SYNTHETIC').label).toBe('SYNTHETIC');
    expect(getSourceMeta('SCENARIO').tooltip).toContain('Cenário didático controlado');
    expect(getSourceMeta('HISTORICAL_FILE').label).toBe('HISTORICAL');
    expect(getSourceMeta('LIVE_FUTURE').label).toBe('LIVE FUTURE');
  });

  it('mapeia status globais READY, RUNNING, PAUSED e COMPLETED', () => {
    expect(getGlobalSessionStatus({
      isRunning: false,
      trainingStatus: 'idle',
      tickCount: 10,
      sourceMode: 'SYNTHETIC',
      hasHistoricalSession: false,
    })).toBe('READY');
    expect(getGlobalSessionStatus({
      isRunning: true,
      trainingStatus: 'idle',
      tickCount: 0,
      sourceMode: 'SYNTHETIC',
      hasHistoricalSession: false,
    })).toBe('RUNNING');
    expect(getGlobalSessionStatus({
      isRunning: false,
      trainingStatus: 'paused',
      tickCount: 1,
      sourceMode: 'SYNTHETIC',
      hasHistoricalSession: false,
    })).toBe('PAUSED');
    expect(getGlobalSessionStatus({
      isRunning: false,
      trainingStatus: 'finished',
      tickCount: 1,
      sourceMode: 'SYNTHETIC',
      hasHistoricalSession: false,
    })).toBe('COMPLETED');
  });

  it('StatusBar renderiza kernel, fonte, replay, flow e broker flow', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <AppShell current="training" onNavigate={() => undefined}>
          <div />
        </AppShell>
      </ThemeProvider>,
    );

    expect(html).toContain('Kernel');
    expect(html).toContain('Fonte');
    expect(html).toContain('Replay');
    expect(html).toContain('Broker Flow');
  });

  it('ReplayToolbar renderiza play, pause, stop, reset, velocidade e progresso', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ReplayToolbar />
      </ThemeProvider>,
    );

    expect(html).toContain('PLAY');
    expect(html).toContain('PAUSE');
    expect(html).toContain('STOP');
    expect(html).toContain('RESET');
    expect(html).toContain('1x');
    expect(html).toContain('Barra visual de progresso');
  });

  it('ReplayToolbar expõe tooltips e motivos de disabled', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <ReplayToolbar />
      </ThemeProvider>,
    );

    expect(html).toContain('Atalho: Space');
    expect(html).toContain('O replay não está em execução');
    expect(html).toContain('O replay já está no início');
  });

  it('mapeia estados de controle do replay', () => {
    expect(getReplayControlStatus({
      isRunning: false,
      tickCount: 0,
      historicalTotalTrades: 0,
      sourceMode: 'SYNTHETIC',
    })).toBe('IDLE');
    expect(getReplayControlStatus({
      isRunning: true,
      tickCount: 0,
      historicalTotalTrades: 0,
      sourceMode: 'SYNTHETIC',
    })).toBe('RUNNING');
    expect(getReplayControlStatus({
      isRunning: false,
      tickCount: 1,
      historicalTotalTrades: 0,
      sourceMode: 'SYNTHETIC',
    })).toBe('PAUSED');
    expect(getReplayControlStatus({
      isRunning: false,
      tickCount: 0,
      historicalTotalTrades: 1,
      sourceMode: 'HISTORICAL_FILE',
    })).toBe('READY');
  });

  it('seleciona velocidades suportadas sem sair dos limites', () => {
    expect(getNextReplaySpeed(1, 1)).toBe(2);
    expect(getNextReplaySpeed(1, -1)).toBe(0.5);
    expect(getNextReplaySpeed(16, 1)).toBe(16);
    expect(getNextReplaySpeed(0.5, -1)).toBe(0.5);
  });

  it('formata horario do replay e estado sem timestamp', () => {
    expect(formatReplayTime(null)).toBe('--:--:--');
    expect(formatReplayTime(new Date('2026-07-13T12:10:32-03:00').getTime())).toContain('12:10:32');
  });
});
