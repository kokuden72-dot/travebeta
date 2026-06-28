'use client';

import React, { createContext, useEffect, useMemo, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import type { Settings, ThemeMode, DisplayMode } from '../lib/types';

const SETTINGS_KEY = 'travebeta-settings';

const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'light',
  displayMode: 'desktop',
};

interface SettingsContextValue {
  settings: Settings;
  setName: (name: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setName: () => undefined,
  setTheme: () => undefined,
  setDisplayMode: () => undefined,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = loadFromStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    setSettings(stored);
  }, []);

  useEffect(() => {
    saveToStorage(SETTINGS_KEY, settings);
    document.body.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setName: (name: string) => setSettings((prev) => ({ ...prev, name })),
      setTheme: (theme: ThemeMode) => setSettings((prev) => ({ ...prev, theme })),
      setDisplayMode: (displayMode: DisplayMode) =>
        setSettings((prev) => ({ ...prev, displayMode })),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
