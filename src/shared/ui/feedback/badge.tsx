import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span className="rounded bg-gray-100 px-2 py-1 text-sm">
      {children}
    </span>
  );
}
