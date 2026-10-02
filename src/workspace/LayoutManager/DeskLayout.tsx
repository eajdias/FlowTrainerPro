// workspace/LayoutManager/DeskLayout.tsx
// Layout fluido em LINHAS × COLUNAS (desk de trading):
//  - cada linha é uma faixa horizontal (flex-row de colunas com largura proporcional)
//  - cada coluna empilha painéis (flex-column, altura proporcional pelo weight)
// Adapta-se automaticamente ao espaço disponível (ex.: sidebar expandida/colapsada).
import { useMemo } from 'react';
import { useWorkspaceStore } from '../WorkspaceStore';
import { resolvePanel } from '../PanelRegistry';
import type { PanelConfig } from '../types';

export function DeskLayout() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId),
    [workspaces, activeId],
  );

  // rows: rowIdx → cols: colIdx → panels[]
  const rows = useMemo(() => {
    const map = new Map<number, Map<number, PanelConfig[]>>();
    for (const p of active?.panels ?? []) {
      if (!p.visible || typeof p.col !== 'number') continue;
      const rowIdx = p.row ?? 0;
      const row = map.get(rowIdx) ?? new Map<number, PanelConfig[]>();
      const col = row.get(p.col) ?? [];
      col.push(p);
      row.set(p.col, col);
      map.set(rowIdx, row);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [active]);

  const rowWeights = active?.rowWeights;

  return (
    <div className="ftp-desk">
      {rows.map(([rowIdx, cols], ri) => (
        <div
          key={rowIdx}
          className="ftp-desk-row"
          style={{ flexGrow: rowWeights?.[ri] ?? 1 }}
        >
          {[...cols.entries()]
            .sort(([a], [b]) => a - b)
            .map(([colIdx, panels]) => (
              <div
                key={colIdx}
                className="ftp-desk-col"
                style={{ flexGrow: panels[0]?.colWeight ?? 1 }}
              >
                {panels.map((p) => {
                  const Component = resolvePanel(p.type);
                  if (!Component) return null;
                  return (
                    <div key={p.id} className="ftp-desk-cell" style={{ flexGrow: p.weight ?? 1 }}>
                      <Component />
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
