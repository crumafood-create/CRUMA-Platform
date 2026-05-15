'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProvider({
  children
}: {
  children: React.ReactNode;
}) {

  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ThemeProvider>
  );
}
