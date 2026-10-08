import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RepositoriesProvider } from '@/lib/repositories-context';
import { createQueryClient } from '@/lib/queryClient';
import '../index.css';
import { createAppRepositories } from './repositories';
import { AppRoutes } from './routes';

const queryClient = createQueryClient();
const repositories = createAppRepositories();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepositoriesProvider repositories={repositories}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </RepositoriesProvider>
  </StrictMode>,
);
