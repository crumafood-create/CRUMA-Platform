import type { ReactNode } from 'react';

interface DataTableProps {
  data?: any[] | undefined;
  columns?: any[] | undefined;
  loading?: boolean | undefined;
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
