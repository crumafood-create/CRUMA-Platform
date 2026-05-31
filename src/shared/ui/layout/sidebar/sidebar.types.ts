import type { ReactNode } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
  isActive?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}
