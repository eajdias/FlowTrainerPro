// electron/store/settingsStore.ts
// Persists global app settings using electron-store.

export const SETTINGS_IPC = {
  LOAD:  'settings:load',
  SAVE:  'settings:save',
} as const;

// Schema stored in settings.json:
// {
//   theme:           'dark' | 'light',
//   language:        'pt-BR' | 'en-US',
//   activeWorkspace: string,
//   shortcuts:       Record<string, string>,
// }

export {};
