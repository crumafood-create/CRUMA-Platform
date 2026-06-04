import type { ReactNode } from 'react';

export interface DataTableProps {
  data?: any[] | undefined;
  columns?: any[] | undefined;
  loading?: boolean | undefined;
  children?: ReactNode;
}

export interface DataTableProps ({
  children,
}: DataTableProps) {
  return (
    <div>
      {children ?? 'DataTable'}
    </div>
  );
}
