import type { ReactNode } from 'react';

export function AdminHeader({
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
