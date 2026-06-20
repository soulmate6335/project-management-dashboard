// src/main.tsx [FRONTEND]
import { createRoot }    from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider }      from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster }       from 'react-hot-toast';
import { store }         from './store/store';
import { AppThemeProvider } from './context/ThemeContext';
import AppWrapper        from './AppWrapper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <BrowserRouter>
          <AppWrapper />
        </BrowserRouter>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
            error:   { duration: 6000 },
          }}
        />
      </AppThemeProvider>
    </QueryClientProvider>
  </Provider>
);      