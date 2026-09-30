import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge, Button, IconButton, Panel, ThemeProvider, flowTheme } from '../../src/ui/designSystem';
import { AppShell } from '../../src/core/AppShell';

describe('DesignSystem UX1', () => {
  it('ThemeProvider renderiza children e tema e estavel', () => {
    const html = renderToStaticMarkup(<ThemeProvider><span>ok</span></ThemeProvider>);
    expect(html).toContain('ok');
    expect(Object.isFrozen(flowTheme)).toBe(true);
    expect(flowTheme.colors.background.canvas).toBe('#0B0E13');
  });

  it('tokens principais existem e sao imutaveis', () => {
    expect(Object.isFrozen(flowTheme.colors)).toBe(true);
    expect(Object.isFrozen(flowTheme.spacing)).toBe(true);
    expect(Object.isFrozen(flowTheme.typography)).toBe(true);
    expect(flowTheme.motion.duration.fast).toBe('100ms');
  });

  it('Button variants renderizam', () => {
    const html = renderToStaticMarkup(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
      </>,
    );
    expect(html).toContain('Primary');
    expect(html).toContain('Danger');
    expect(html).toContain('Success');
  });

  it('IconButton exige aria-label via label', () => {
    const html = renderToStaticMarkup(<IconButton label="Configurar">C</IconButton>);
    expect(html).toContain('aria-label="Configurar"');
    expect(html).toContain('title="Configurar"');
  });

  it('Badge variants renderizam', () => {
    const html = renderToStaticMarkup(
      <>
        <Badge variant="buy">BUY</Badge>
        <Badge variant="sell">SELL</Badge>
        <Badge variant="warning">WARN</Badge>
      </>,
    );
    expect(html).toContain('BUY');
    expect(html).toContain('SELL');
    expect(html).toContain('WARN');
  });

  it('Panel renderiza titulo, loading, empty e error', () => {
    expect(renderToStaticMarkup(<Panel title="Painel">Body</Panel>)).toContain('Painel');
    expect(renderToStaticMarkup(<Panel title="Painel" isLoading>Body</Panel>)).toContain('Carregando');
    expect(renderToStaticMarkup(<Panel title="Painel" isEmpty>Body</Panel>)).toContain('Sem dados');
    expect(renderToStaticMarkup(<Panel title="Painel" isError>Body</Panel>)).toContain('Erro');
  });

  it('AppShell renderiza TopBar, StatusBar e preserva conteudo', () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <AppShell current="training" onNavigate={() => undefined}>
          <div>Workspace</div>
        </AppShell>
      </ThemeProvider>,
    );
    expect(html).toContain('FlowTrainerPro');
    expect(html).toContain('Order Flow Cockpit');
    expect(html).toContain('Workspace');
    expect(html).toContain('Fonte SYNTHETIC');
  });
});
