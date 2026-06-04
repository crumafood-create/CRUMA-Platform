import type { ReactNode } from 'react';

interface DataTableProps {
  data?: any[];
  columns?: any[];
  children?: ReactNode;
}

export function DataTable({
  children,
}: DataTableProps) {
  return (
    <div>
      {children ?? 'DataTable'}
    </div>
  );
}
