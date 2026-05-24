'use client';

import type { ReactNode } from 'react';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
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
