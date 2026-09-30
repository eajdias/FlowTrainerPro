// workspace/index.ts — public API
export { WorkspaceManager }         from './WorkspaceManager/WorkspaceManager';
export { DockLayout }               from './LayoutManager/DockLayout';
export { DockManager }              from './DockManager/DockManager';
export { resolvePanel, PANEL_REGISTRY } from './PanelRegistry';
export { useWorkspaceStore, selectActiveWorkspace, selectVisiblePanels } from './WorkspaceStore';
export { DEFAULT_WORKSPACES }       from './defaultWorkspaces';
export type { PanelConfig, PanelType, PanelMode, WorkspaceConfig, WorkspaceState } from './types';
