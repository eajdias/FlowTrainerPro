// workspace/WorkspaceStore.ts
// Zustand store for workspace state.
// PERSISTED in localStorage — survives page refresh.
// Positions, sizes, visibility, active workspace — all saved.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceConfig, WorkspaceState, PanelConfig } from './types';
import { DEFAULT_WORKSPACES } from './defaultWorkspaces';

interface WorkspaceActions {
  setActiveWorkspace:   (id: string)                          => void;
  addWorkspace:         (config: WorkspaceConfig)             => void;
  removeWorkspace:      (id: string)                          => void;
  renameWorkspace:      (id: string, name: string)            => void;
  duplicateWorkspace:   (id: string)                          => void;
  setPanelVisible:      (panelId: string, visible: boolean)   => void;
  setPanelPosition:     (panelId: string, x: number, y: number) => void;
  setPanelSize:         (panelId: string, w: number, h: number) => void;
  setPanelMode:         (panelId: string, mode: PanelConfig['mode']) => void;
  bringPanelToFront:    (panelId: string)                     => void;
  setPanelZIndex:       (panelId: string, z: number)          => void;
  loadFromStore:        (state: WorkspaceState)               => void;
  resetToDefaults:      ()                                    => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      workspaces:        DEFAULT_WORKSPACES,
      activeWorkspaceId: DEFAULT_WORKSPACES[0]?.id ?? null,

      // ── Workspace management ───────────────────────────────────────────────

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      addWorkspace: (config) =>
        set((s) => ({ workspaces: [...s.workspaces, config] })),

      removeWorkspace: (id) =>
        set((s) => {
          const remaining = s.workspaces.filter((w) => w.id !== id);
          const activeId  = s.activeWorkspaceId === id
            ? (remaining[0]?.id ?? null)
            : s.activeWorkspaceId;
          return { workspaces: remaining, activeWorkspaceId: activeId };
        }),

      renameWorkspace: (id, name) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === id ? { ...w, name, updatedAt: Date.now() } : w,
          ),
        })),

      duplicateWorkspace: (id) => {
        const source = get().workspaces.find((w) => w.id === id);
        if (!source) return;
        const copy: WorkspaceConfig = {
          ...source,
          id:          uuidv4(),
          name:        `${source.name} (copy)`,
          createdAt:   Date.now(),
          updatedAt:   Date.now(),
          panels:      source.panels.map((p) => ({ ...p, id: uuidv4() })),
        };
        set((s) => ({ workspaces: [...s.workspaces, copy] }));
      },

      // ── Panel management ───────────────────────────────────────────────────

      setPanelVisible: (panelId, visible) =>
        set((s) => updateActivePanel(s, panelId, { visible })),

      setPanelPosition: (panelId, x, y) =>
        set((s) => updateActivePanel(s, panelId, { position: { x, y } })),

      setPanelSize: (panelId, w, h) =>
        set((s) => updateActivePanel(s, panelId, { size: { w, h } })),

      setPanelMode: (panelId, mode) =>
        set((s) => updateActivePanel(s, panelId, { mode })),

      bringPanelToFront: (panelId) =>
        set((s) => {
          const active = activeWorkspace(s);
          if (!active) return s;
          const maxZ = Math.max(...active.panels.map((p) => p.zIndex), 0);
          return updateActivePanel(s, panelId, { zIndex: maxZ + 1 });
        }),

      setPanelZIndex: (panelId, z) =>
        set((s) => updateActivePanel(s, panelId, { zIndex: z })),

      // ── Persistence ────────────────────────────────────────────────────────

      loadFromStore: (state) => set(state),

      resetToDefaults: () => set({
        workspaces: DEFAULT_WORKSPACES,
        activeWorkspaceId: DEFAULT_WORKSPACES[0]?.id ?? null,
      }),
    }),
    {
      name: 'flowtrainerpro-workspace', // localStorage key
      version: 15, // v15: VP alinhado ao ≥25 (assimetria) — força re-leitura
    },
  ),
);

// ── Helpers ────────────────────────────────────────────────────────────────────

function activeWorkspace(s: WorkspaceState): WorkspaceConfig | undefined {
  return s.workspaces.find((w) => w.id === s.activeWorkspaceId);
}

function updateActivePanel(
  s:       WorkspaceState,
  panelId: string,
  patch:   Partial<PanelConfig>,
): Partial<WorkspaceState> {
  const active = activeWorkspace(s);
  if (!active) return s;

  const updated: WorkspaceConfig = {
    ...active,
    updatedAt: Date.now(),
    panels: active.panels.map((p) =>
      p.id === panelId ? { ...p, ...patch } : p,
    ),
  };

  return {
    workspaces: s.workspaces.map((w) => (w.id === active.id ? updated : w)),
  };
}

export const selectActiveWorkspace = (s: WorkspaceState): WorkspaceConfig | undefined =>
  s.workspaces.find((w) => w.id === s.activeWorkspaceId);

export const selectVisiblePanels = (s: WorkspaceState): PanelConfig[] =>
  selectActiveWorkspace(s)?.panels.filter((p) => p.visible) ?? [];
