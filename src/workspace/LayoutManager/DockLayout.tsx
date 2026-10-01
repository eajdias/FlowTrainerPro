// workspace/LayoutManager/DockLayout.tsx
// Grade docked: resolve cada painel visível via PanelRegistry.
import { useMemo } from 'react';
import { useWorkspaceStore } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';

export function DockLayout() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const docked = useMemo(() => {
    const active = workspaces.find((w) => w.id === activeId);
    return (active?.panels ?? []).filter((p) => p.visible && p.mode === 'docked');
  }, [workspaces, activeId]);

  return (
    <div className="ftp-dockgrid">
      {docked.map((p) => {
        const Component = resolvePanel(p.type);
        if (!Component) return null;
        return (
          <div key={p.id} style={{ gridArea: p.gridArea }}>
            <Component />
          </div>
        );
      })}
    </div>
  );
}
