// workspace/WorkspaceManager/WorkspaceManager.tsx
// Seletor de workspace + grade. Painéis flutuantes empilham por zIndex.
import { useMemo } from 'react';
import { useWorkspaceStore } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';
import { DockLayout } from '../LayoutManager/DockLayout';

export function WorkspaceManager() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActive = useWorkspaceStore((s) => s.setActiveWorkspace);
  const floating = useMemo(() => {
    const active = workspaces.find((w) => w.id === activeId);
    return (active?.panels ?? []).filter((p) => p.visible && p.mode === 'floating');
  }, [workspaces, activeId]);

  return (
    <div className="ftp-workspace">
      <div role="tablist" aria-label="Workspaces">
        {workspaces.map((w) => (
          <button
            key={w.id}
            role="tab"
            aria-selected={w.id === activeId}
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
