// electron/store/workspaceStore.ts
// Persists workspace layouts using electron-store.
// Settings (layouts, theme, shortcuts) live here — NOT in SQLite.
// SQLite is reserved for: replays, sessions, scenarios, statistics, AI.

// This file runs in the Electron main process.
// It exposes IPC handlers that the renderer calls via preload bridge.

// electron-store will be imported once the package is installed:
// import Store from 'electron-store';
// import { ipcMain } from 'electron';
// import type { WorkspaceState } from '../../src/workspace/types';

// ── IPC channel names ──────────────────────────────────────────────────────────
export const WORKSPACE_IPC = {
  LOAD:  'workspace:load',
  SAVE:  'workspace:save',
  RESET: 'workspace:reset',
} as const;

// ── Schema (documents the shape stored on disk) ───────────────────────────────
// {
//   workspaces:        WorkspaceConfig[],
//   activeWorkspaceId: string | null,
// }

// ── Placeholder — implementation after electron-store is installed ─────────────
export {};
