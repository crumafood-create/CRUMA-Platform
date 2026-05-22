'use client';

import type { ReactNode } from 'react';

import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { ToastProvider } from './toast-provider';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({
  children,
}: AppProviderProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}

        <ToastProvider />
      </QueryProvider>
    </ThemeProvider>
  );
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({
  children,
}: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
