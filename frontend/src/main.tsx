// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { store } from './store/store';
import AppRoutes from './routes/AppRoutes';

// ---------------------------------------------------------------------------
// React Query client
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min — avoids redundant refetches
      gcTime: 1000 * 60 * 10,        // 10 min cache retention after unmount
      retry: (failureCount, error: unknown) => {
        // Never retry on 401/403/404 — retrying won't fix auth or missing resources
        const status = typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
        if ([401, 403, 404].includes(status ?? -1)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// ---------------------------------------------------------------------------
// MUI theme
// ---------------------------------------------------------------------------
const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb' },   // blue-600
    secondary: { main: '#7c3aed' },   // violet-600
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
  },
});

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found in index.html');

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                fontFamily: theme.typography.fontFamily as string,
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
              error:   { duration: 6000 },
            }}
          />
        </ThemeProvider>
        {import.meta.env.DEV && (
  <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
)}
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);