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

// ── Tape Reading — mesa principal (3 colunas × 3 blocos) ─────────────────────
//
//  ┌──────────────┬──────────────────┬──────────────────┐
//  │ Hist.        │                  │  Times & Trades  │
//  │  Corretoras  │                  ├──────────────────┤
//  │──────────────┤    SUPERDOM      │  Volume Profile  │
//  │ Histórico    │  (+ Ladder       ├──────────────────┤
//  │  ≥25         │   fundido)       │   Gráfico 8P     │
//  ├──────────────┤                  │                  │
//  │ Histórico    │                  │                  │
//  │  ≥250        │                  │                  │
//  └──────────────┴──────────────────┴──────────────────┘

export function createTapeReadingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Tape Reading',
    description: 'Mesa principal: históricos, DOM fundido, tape e gráfico',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [1],
    panels: [
      // Coluna 0 — históricos (estreita)
      deskPanel('BrokerHistoryPanel', { col: 0, weight: 1, colWeight: 0.72 }),
      deskPanel('MediumTradesPanel',  { col: 0, weight: 1.5 }),
      deskPanel('LargeTradesPanel',   { col: 0, weight: 0.9 }),

      // Coluna 1 — operação (SUPERDOM fundido, sozinho)
      deskPanel('SuperDOMPanel',      { col: 1, weight: 1, colWeight: 1.15 }),

      // Coluna 2 — tape, perfil e gráfico
      deskPanel('TimesTradesPanel',   { col: 2, weight: 1.5, colWeight: 1.1 }),
      deskPanel('VolumeProfilePanel', { col: 2, weight: 1 }),
      deskPanel('Chart8PPanel',       { col: 2, weight: 1.2 }),
    ],
  };
}

// ── Scalping — operação rápida ────────────────────────────────────────────────

export function createScalpingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Scalping',
    description: 'Operação rápida: DOM fundido, gráfico e tape',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [0.95, 1.05],
    panels: [
      deskPanel('SuperDOMPanel',      { col: 0, colWeight: 1.2 }),
      deskPanel('VolumeProfilePanel', { col: 1, weight: 1.6, colWeight: 1 }),
      deskPanel('TimesTradesPanel',   { col: 1, weight: 1 }),
      deskPanel('Chart8PPanel',       { col: 0, row: 1 }),
    ],
  };
}

// ── DOM Puro — foco máximo na fila ────────────────────────────────────────────

export function createDOMWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'DOM Puro',
    description: 'Fila FIFO em foco: DOM fundido e tape',
    createdAt:   now(),
    updatedAt:   now(),
    rowWeights:  [1],
    panels: [
      deskPanel('SuperDOMPanel',    { col: 0, colWeight: 1.6 }),
      deskPanel('TimesTradesPanel', { col: 1, colWeight: 1.2 }),
    ],
  };
}

// ── Export ────────────────────────────────────────────────────────────────────

export const DEFAULT_WORKSPACES: WorkspaceConfig[] = [
  createTapeReadingWorkspace(),
  createScalpingWorkspace(),
  createDOMWorkspace(),
];
