import type { ColumnDef } from '@tanstack/react-table';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean | undefined;
}
