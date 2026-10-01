// workspace/DockManager/DockManager.ts
// Operações de dock/float sobre o WorkspaceStore. Sem React.
import { useWorkspaceStore } from '../WorkspaceStore';

export function dockPanel(panelId: string): void {
  const s = useWorkspaceStore.getState();
  s.setPanelMode(panelId, 'docked');
  s.setPanelVisible(panelId, true);
}

export function undockPanel(panelId: string, x: number, y: number): void {
  const s = useWorkspaceStore.getState();
  s.setPanelMode(panelId, 'floating');
  s.setPanelPosition(panelId, x, y);
  s.setPanelVisible(panelId, true);
  s.bringPanelToFront(panelId);
}

export function togglePanel(panelId: string, visible: boolean): void {
  useWorkspaceStore.getState().setPanelVisible(panelId, visible);
}

export const DockManager = { dockPanel, undockPanel, togglePanel };
