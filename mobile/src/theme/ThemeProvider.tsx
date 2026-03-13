import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appTheme } from './index';

export type ThemeMode = 'light' | 'dark';

const lightColors = appTheme.colors;

const darkColors = {
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#1E1B4B',
  primaryRing: '#312E81',
  background: '#0B1120',
  surface: '#111827',
  surfaceAlt: '#1F2937',
  text: '#F8FAFC',
  mutedText: '#CBD5F5',
  subtleText: '#94A3B8',
  border: '#1F2937',
  borderLight: '#1E293B',
  success: '#34D399',
  successLight: '#064E3B',
  successText: '#D1FAE5',
  warning: '#FBBF24',
  warningLight: '#78350F',
  warningText: '#FEF3C7',
  error: '#F87171',
  errorLight: '#7F1D1D',
  errorText: '#FECACA',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  infoText: '#BFDBFE',
} as const;

type ThemeValue = {
  mode: ThemeMode;
  colors: typeof lightColors;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);
const STORAGE_KEY = 'ojt.theme.mode';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export default function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && (stored === 'light' || stored === 'dark')) {
          setMode(stored);
        }
      } catch {
        // ignore storage errors
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // ignore storage errors
      }
    };
    void persist();
  }, [mode]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      toggle,
    }),
    [mode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
