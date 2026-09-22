import type { ReactNode } from 'react';

export function AdminSidebar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}
