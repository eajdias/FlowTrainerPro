// workspace/types.ts
// All types for the Workspace layer.
// No React, no business logic — pure data contracts.

// ── Panel types ────────────────────────────────────────────────────────────────

/** All panel types currently registered in the platform */
export type PanelType =
  | 'BookPanel'
  | 'BrokerHistoryPanel'
  | 'TimesTradesPanel'
  | 'SuperDOMPanel'
  | 'VolumeProfilePanel'
  | 'Chart8PPanel'
  | 'OrderBookByBrokerPanel'
  | 'PriceLadderPanel'
  | 'CandleClockPanel'
  | 'TrainingPanel'
  | 'DebugPanel'
  | 'TrainingHUD'
  | 'ReplayToolbar'
  | 'LargeTradesPanel'
  | 'MediumTradesPanel'
  | 'ScenarioEditorPanel'
  | 'TradeHistoryPanel'
  | 'ScenarioInspectorPanel'
  | 'MissionInspectorPanel'
  | 'EvaluationInspectorPanel'
  | 'FeedbackInspectorPanel'
  | 'ReplayInspectorPanel'
  | 'ReplayPlayerPanel';
  // Future: 'HeatmapPanel' | 'AgressorPanel' | 'PlayerRankingPanel'

export type PanelMode = 'docked' | 'floating';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  w: number;
  h: number;
}

/** Configuration for a single panel instance */
export interface PanelConfig {
  /** Unique instance id — allows two SuperDOMs side by side */
  id:       string;
  type:     PanelType;
  mode:     PanelMode;
  visible:  boolean;
  position: PanelPosition;   // used in floating mode
  size:     PanelSize;       // used in floating mode
  zIndex:   number;          // used in floating mode
  /** Grid area name — used in docked/CSS-grid mode */
  gridArea?: string;
}

// ── Workspace types ────────────────────────────────────────────────────────────

/** A complete named workspace (saved layout) */
export interface WorkspaceConfig {
  id:          string;
  name:        string;
  description?: string;
  createdAt:   number;   // Unix ms
  updatedAt:   number;   // Unix ms
  panels:      PanelConfig[];
  /** Which panel receives keyboard focus by default */
  focusedPanelId?: string;
}

// ── Workspace store state ──────────────────────────────────────────────────────

export interface WorkspaceState {
  workspaces:          WorkspaceConfig[];
  activeWorkspaceId:   string | null;
}
