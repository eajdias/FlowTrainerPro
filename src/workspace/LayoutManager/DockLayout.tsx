// workspace/LayoutManager/DockLayout.tsx
// Grade docked: resolve cada painel visível via PanelRegistry.
import { useWorkspaceStore, selectVisiblePanels } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';

export function DockLayout() {
  const panels = useWorkspaceStore(selectVisiblePanels);
  const docked = panels.filter((p) => p.mode === 'docked');

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
