import { flexRender } from '@tanstack/react-table';

import type { DataTableProps } from '../data-table.types';
import { useTable } from '../hooks/use-table';

export function DataTable<TData>({ data, columns, loading }: DataTableProps<TData>) {
  const table = useTable({ data, columns });

  if (loading) return <div role="status">Cargando…</div>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-gray-25">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-gray-25/40">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-bold">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-brand-gray-25">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
