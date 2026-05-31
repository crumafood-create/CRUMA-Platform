import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

export function useTable({
  data,
  columns,
}: any) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel:
      getCoreRowModel(),
  });
}
