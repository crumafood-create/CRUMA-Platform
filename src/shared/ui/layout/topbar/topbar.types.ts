import type { ReactNode } from 'react';

export interface TopbarProps {
  title?: string;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  userMenu?: ReactNode;
  className?: string;
}
