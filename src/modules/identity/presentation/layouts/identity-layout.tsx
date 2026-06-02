'use client';

import type { ReactNode } from 'react';

import {
  ContentGrid,
} from '@/shared/ui/layout';

import {
  IdentitySidebar,
} from '../navigation';

interface IdentityLayoutProps {
  children: ReactNode;
}

export function IdentityLayout({
  children,
}: IdentityLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <IdentitySidebar />

      <ContentGrid>
        {children}
      </ContentGrid>
    </div>
  );
}
