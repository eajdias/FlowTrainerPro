// workspace/defaultWorkspaces.ts
// Default workspace layouts with initial floating positions.
// Positions are based on a 1440×860 canvas (below the header).
// Layout reference: professional Order Flow platform (4-column grid).

import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceConfig, PanelConfig } from './types';

const now = () => Date.now();

// ── Panel factory ─────────────────────────────────────────────────────────────

function panel(
  type:     PanelConfig['type'],
  x:        number,
  y:        number,
  w:        number,
  h:        number,
  zIndex:   number = 1,
  visible:  boolean = true,
): PanelConfig {
  return {
    id:       uuidv4(),
    type,
    mode:     'floating',
    visible,
    position: { x, y },
    size:     { w, h },
    zIndex,
    gridArea: undefined,
  };
}

// ── Default layout — mirrors the reference image ──────────────────────────────
//
// Reference layout (1440×860 canvas):
//
//  ┌─────────────┬──────────────────┬──────────────────┬───────────────┐
//  │ BrokerHistory│  TimesAndTrades  │  TimesAndTrades  │ VolumeProfile │
//  │  180×420    │    260×420       │    260×420       │  220×860      │
//  ├─────────────┼──────────────────┼──────────────────┤               │
//  │             │                  │  OrderBook       │               │
//  │  Chart8P    │   SuperDOM       │  ByBroker        │               │
//  │  520×440    │   180×440        │  280×440         │               │
//  └─────────────┴──────────────────┴──────────────────┴───────────────┘
//   PriceLadder + CandleClock span the bottom

export function createDefaultWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Default',
    description: 'Estação completa de Order Flow',
    createdAt:   now(),
    updatedAt:   now(),
    panels: [
      // Left column — SuperDOM (main tool)
      panel('SuperDOMPanel',         2,   2,   340, 520, 3),

      // Center — TT + Broker History stacked
      panel('TimesTradesPanel',      346, 2,   360, 320, 2),
      panel('BrokerHistoryPanel',    346, 326, 360, 196, 1),

      // Right — Volume Profile
      panel('VolumeProfilePanel',    710, 2,   200, 520, 2),

      // Far right — Training HUD + Trade History
      panel('TrainingHUD',           914, 2,   180, 280, 4),
      panel('TradeHistoryPanel',     914, 286, 180, 236, 3),

      // Bottom row — Chart + Livro de Ofertas
      panel('Chart8PPanel',          2,   526, 540, 270, 1, true),
      panel('OrderBookByBrokerPanel',546, 526, 260, 270, 1, true),
      panel('LargeTradesPanel',      810, 526, 284, 270, 1, true),

      // Hidden panels
      panel('PriceLadderPanel',      2,   2,   1, 1, 1, false),
      panel('CandleClockPanel',      2,   2,   1, 1, 1, false),
      panel('TrainingPanel',         2,   2,   1, 1, 1, false),
      panel('ScenarioEditorPanel',   2,   2,   500, 600, 5, false),
      panel('ScenarioInspectorPanel',2,   2,   260, 400, 5, false),
      panel('MissionInspectorPanel', 2,  2,   300, 500, 5, false),

      // Toolbar
      {
        id:       uuidv4(),
        type:     'ReplayToolbar',
        mode:     'floating',
        visible:  true,
        position: { x: 0, y: 0 },
        size:     { w: 0, h: 0 },
        zIndex:   0,
      },
    ],
  };
}

// ── Tape Reading ──────────────────────────────────────────────────────────────

export function createTapeReadingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Tape Reading',
    description: 'Foco em TT, Gráfico Tape Reading e Book',
    createdAt:   now(),
    updatedAt:   now(),
    panels: [
      panel('Chart8PPanel',          2,   2,  520, 560, 2),
      panel('MediumTradesPanel',     2,   566, 520, 290, 1),
      panel('TimesTradesPanel',      526, 2,  280, 428, 1),
      panel('LargeTradesPanel',      526, 434, 280, 422, 1),
      panel('SuperDOMPanel',         810, 2,  300, 856, 3),
      panel('VolumeProfilePanel',    1114,2,  220, 856, 1),
      panel('OrderBookByBrokerPanel',2,   2,  1,   1,  1, false),
      panel('PriceLadderPanel',      2,   2,  1,   1,  1, false),
      panel('CandleClockPanel',      2,   2,  1,   1,  1, false),
      { id: uuidv4(), type: 'ReplayToolbar', mode: 'floating', visible: true, position: { x:0, y:0 }, size: { w:0, h:0 }, zIndex: 0 },
    ],
  };
}

// ── Scalping ─────────────────────────────────────────────────────────────────

export function createScalpingWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'Scalping',
    description: 'SuperDOM dominante com gráfico',
    createdAt:   now(),
    updatedAt:   now(),
    panels: [
      panel('SuperDOMPanel',         2,   2,  220, 856, 3),
      panel('PriceLadderPanel',      226, 2,  280, 856, 2),
      panel('Chart8PPanel',          510, 2,  700, 856, 1),
      panel('VolumeProfilePanel',    1214,2,  224, 856, 1),
      panel('TimesTradesPanel',      2,   2,  1,   1,  1, false),
      panel('BrokerHistoryPanel',    2,   2,  1,   1,  1, false),
      panel('OrderBookByBrokerPanel',2,   2,  1,   1,  1, false),
      panel('CandleClockPanel',      2,   2,  1,   1,  1, false),
      { id: uuidv4(), type: 'ReplayToolbar', mode: 'floating', visible: true, position: { x:0, y:0 }, size: { w:0, h:0 }, zIndex: 0 },
    ],
  };
}

// ── DOM Puro ──────────────────────────────────────────────────────────────────

export function createDOMWorkspace(): WorkspaceConfig {
  return {
    id:          uuidv4(),
    name:        'DOM Puro',
    description: 'Apenas SuperDOM — foco máximo',
    createdAt:   now(),
    updatedAt:   now(),
    panels: [
      panel('SuperDOMPanel',         2,   2,  300, 856, 3),
      panel('PriceLadderPanel',      306, 2,  320, 856, 2),
      panel('TimesTradesPanel',      630, 2,  320, 856, 1),
      panel('Chart8PPanel',          2,   2,  1,   1,  1, false),
      panel('VolumeProfilePanel',    2,   2,  1,   1,  1, false),
      panel('BrokerHistoryPanel',    2,   2,  1,   1,  1, false),
      panel('OrderBookByBrokerPanel',2,   2,  1,   1,  1, false),
      panel('CandleClockPanel',      2,   2,  1,   1,  1, false),
      { id: uuidv4(), type: 'ReplayToolbar', mode: 'floating', visible: true, position: { x:0, y:0 }, size: { w:0, h:0 }, zIndex: 0 },
    ],
  };
}

// ── Replay ────────────────────────────────────────────────────────────────────

export function createReplayWorkspace(): WorkspaceConfig {
  return createDefaultWorkspace();
}

// ── Export ────────────────────────────────────────────────────────────────────

export const DEFAULT_WORKSPACES: WorkspaceConfig[] = [
  createDefaultWorkspace(),
  createTapeReadingWorkspace(),
  createScalpingWorkspace(),
  createDOMWorkspace(),
  createReplayWorkspace(),
];
