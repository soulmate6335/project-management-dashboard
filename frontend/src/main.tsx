import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { store } from './store/store';
import AppRoutes from './routes/AppRoutes';
import { hydrateAuth } from './features/auth/store/authSlice';

const queryClient = new QueryClient();

// 🔥 SINGLE SOURCE OF TRUTH FOR AUTH BOOT
store.dispatch(hydrateAuth());

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);