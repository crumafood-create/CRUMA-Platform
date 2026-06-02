'use client';

import { ReactNode } from 'react';

import {
  ContentGrid,
} from '@/shared/ui/layout';

import {
  IdentitySidebar,
} from '../navigation';

interface Props {
  children: ReactNode;
}

export function IdentityLayout({
  children,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <IdentitySidebar />

      <ContentGrid>
        {children}
      </ContentGrid>
    </div>
  );
}
