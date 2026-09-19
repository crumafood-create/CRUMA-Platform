import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

type UseTableOptions<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
};

export function useTable<TData>({
  data,
  columns,
}: UseTableOptions<TData>) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel:
      getCoreRowModel(),
  });
}
