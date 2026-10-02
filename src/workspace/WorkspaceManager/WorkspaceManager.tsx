// workspace/WorkspaceManager/WorkspaceManager.tsx
// Seletor de workspace + layout. Modos:
//  - desk: colunas fluidas (padrão novo) — adapta-se ao espaço disponível
//  - docked/floating: modos legados (compatibilidade)
import { useMemo } from 'react';
import { useWorkspaceStore } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';
import { DockLayout } from '../LayoutManager/DockLayout';
import { DeskLayout } from '../LayoutManager/DeskLayout';

export function WorkspaceManager() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActive = useWorkspaceStore((s) => s.setActiveWorkspace);

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId),
    [workspaces, activeId],
  );

  const isDesk = useMemo(
    () => (active?.panels ?? []).some((p) => p.visible && typeof p.col === 'number'),
    [active],
  );

  const floating = useMemo(
    () => (active?.panels ?? []).filter((p) => p.visible && p.mode === 'floating' && typeof p.col !== 'number'),
    [active],
  );

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
      {isDesk ? (
        <DeskLayout />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
