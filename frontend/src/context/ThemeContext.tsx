// src/context/ThemeContext.tsx [FRONTEND]
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface ThemeContextValue {
  mode:       'light' | 'dark';
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode:       'light',
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const stored = localStorage.getItem('theme_mode') as 'light' | 'dark' | null;
  const [mode, setMode] = useState<'light' | 'dark'>(stored ?? 'light');

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme_mode', next);
      return next;
    });
  }, []);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary:   { main: '#2563eb' },
        secondary: { main: '#7c3aed' },
        background: {
          default: mode === 'light' ? '#f8fafc' : '#0f172a',
          paper:   mode === 'light' ? '#ffffff'  : '#1e293b',
        },
      },
      shape: { borderRadius: 8 },
      typography: { fontFamily: '"Inter", "system-ui", sans-serif' },
      components: {
        MuiButton: {
          defaultProps:   { disableElevation: true },
          styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
        },
        MuiPaper:  { defaultProps: { elevation: 0 } },
        MuiCard:   { defaultProps: { elevation: 0 } },
      },
    }),
  [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}