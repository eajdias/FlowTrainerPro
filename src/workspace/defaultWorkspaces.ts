// workspace/defaultWorkspaces.ts
// Workspaces em modo DESK: linhas × colunas fluidas (flex) que se adaptam ao
// espaço disponível — expandir/colapsar a sidebar de Training redimensiona tudo.
// Base principal: Tape Reading (tape + gráfico largo com Volume Profile ao lado).

import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceConfig, PanelConfig } from './types';

const now = () => Date.now();

// ── Panel factory (desk mode) ─────────────────────────────────────────────────

interface DeskOpts {
  col: number;
  row?: number;
  weight?: number;
  colWeight?: number;
  visible?: boolean;
}

function deskPanel(type: PanelConfig['type'], opts: DeskOpts): PanelConfig {
  return {
    id:       uuidv4(),
    type,
    mode:     'floating',
    visible:  opts.visible ?? true,
    position: { x: 0, y: 0 },
    size:     { w: 0, h: 0 },
    zIndex:   1,
    col:      opts.col,
    row:      opts.row ?? 0,
    weight:   opts.weight ?? 1,
    colWeight: opts.colWeight ?? 1,
  };
}

// ── Tape Reading — mesa principal ─────────────────────────────────────────────
//
//  ┌──────────┬───────────────┬────────────┬─────────────────────────┐
//  │  ≥25     │  Times&Trades │  SuperDOM  │  Agressão por Preço     │
//  │  Lotes   ├───────────────┤  (refs do  │  (compra×venda + heat)  │
//  │          │  ≥250 Lotes   │   dia)     │                         │
//  ├──────────┴───────┬───────┴────────────┴─────────────────────────┤
//  │ Volume Profile   │  Gráfico 8P — largo (Máx/Mín/VWAP/Abert)     │
//  └──────────────────┴─────────────────────────────────────────────┘

export function createTapeReadingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Tape Reading',
    description: 'Mesa principal: tape, DOM, agressão, gráfico e perfil',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [1.4, 1.0],
    panels: [
      // Linha 0 — trabalho
      deskPanel('MediumTradesPanel',      { col: 0, colWeight: 0.85 }),
      deskPanel('TimesTradesPanel',       { col: 1, weight: 2.2, colWeight: 1.35 }),
      deskPanel('LargeTradesPanel',       { col: 1, weight: 0.9 }),
      deskPanel('SuperDOMPanel',          { col: 2, colWeight: 1.1 }),
      deskPanel('BrokerHistoryPanel',     { col: 3, colWeight: 0.95 }),

      // Linha 1 — Volume Profile fundido ao lado do gráfico largo
      deskPanel('VolumeProfilePanel',     { col: 0, row: 1, colWeight: 0.88 }),
      deskPanel('Chart8PPanel',           { col: 1, row: 1, colWeight: 1.12 }),
    ],
  };
}

// ── Scalping — operação rápida ────────────────────────────────────────────────

export function createScalpingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Scalping',
    description: 'Operação rápida: DOM, ladder, gráfico e tape',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [0.95, 1.05],
    panels: [
      deskPanel('SuperDOMPanel',      { col: 0, colWeight: 1 }),
      deskPanel('PriceLadderPanel',   { col: 1, colWeight: 1 }),
      deskPanel('VolumeProfilePanel', { col: 2, weight: 1.6, colWeight: 1 }),
      deskPanel('TimesTradesPanel',   { col: 2, weight: 1 }),
      deskPanel('Chart8PPanel',       { col: 0, row: 1 }),
    ],
  };
}

// ── DOM Puro — foco máximo na fila ────────────────────────────────────────────

export function createDOMWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'DOM Puro',
    description: 'Fila FIFO em foco: DOM, ladder e tape',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [1],
    panels: [
      deskPanel('SuperDOMPanel',    { col: 0, colWeight: 1.2 }),
      deskPanel('PriceLadderPanel', { col: 1, colWeight: 1.2 }),
      deskPanel('TimesTradesPanel', { col: 2, colWeight: 1.2 }),
    ],
  };
}

// ── Export ────────────────────────────────────────────────────────────────────

export const DEFAULT_WORKSPACES: WorkspaceConfig[] = [
  createTapeReadingWorkspace(),
  createScalpingWorkspace(),
  createDOMWorkspace(),
];
