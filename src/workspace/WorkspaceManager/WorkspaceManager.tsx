// workspace/WorkspaceManager/WorkspaceManager.tsx
// Seletor de workspace + grade. Painéis flutuantes empilham por zIndex.
import { useWorkspaceStore, selectVisiblePanels, selectActiveWorkspace } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';
import { DockLayout } from '../LayoutManager/DockLayout';

export function WorkspaceManager() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = useWorkspaceStore(selectActiveWorkspace);
  const panels = useWorkspaceStore(selectVisiblePanels);
  const setActive = useWorkspaceStore((s) => s.setActiveWorkspace);
  const floating = panels.filter((p) => p.mode === 'floating');

  return (
    <div className="ftp-workspace">
      <div role="tablist" aria-label="Workspaces">
        {workspaces.map((w) => (
          <button
            key={w.id}
            role="tab"
            aria-selected={w.id === active?.id}
            type="button"
            onClick={() => setActive(w.id)}
          >
            {w.name}
          </button>
        ))}
      </div>
      <DockLayout />
      {floating.map((p) => {
        const Component = resolvePanel(p.type);
        if (!Component) return null;
        return (
          <div
            key={p.id}
            className="ftp-float"
            style={{
              left: p.position.x,
              top: p.position.y,
              width: p.size.w,
              height: p.size.h,
              zIndex: p.zIndex,
            }}
          >
            <Component />
          </div>
        );
      })}
    </div>
  );
}
