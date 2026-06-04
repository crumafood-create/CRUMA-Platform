import type { ReactNode } from 'react';

export interface DataTableProps {
  columns: any[];
  data: any[];
  loading?: boolean;
  children?: ReactNode;
