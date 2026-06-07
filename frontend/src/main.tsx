// src/main.tsx
import { StrictMode, useEffect } from 'react';
import { createRoot }            from 'react-dom/client';
import { BrowserRouter }         from 'react-router-dom';
import { Provider }              from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster }               from 'react-hot-toast';

import { store }                 from './store/store';
import { useAppDispatch, useAppSelector } from './app/hooks';
import rehydrateAuth, { selectAuthToken } from './features/auth/store/authSlice';
import AppRoutes                 from './routes/AppRoutes';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary:   { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
  },
});

// ✅ Wrapper — calls rehydrateAuth on boot if a token exists
export function AppWrapper() {
  const dispatch = useAppDispatch();
  const token    = useAppSelector(selectAuthToken);

  useEffect(() => {
    if (token) {
      // rehydrateAuth has a non-standard typing; cast to any to satisfy dispatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch((rehydrateAuth as any)());
    }
  }, [dispatch, token]);

  return <AppRoutes />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AppWrapper />
          </BrowserRouter>
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);