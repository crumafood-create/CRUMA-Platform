'use client';

import { DataTable } from '@/shared/ui/data-table';

import { Badge } from '@/shared/ui/feedback';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/overlay';

import { Button } from '@/shared/ui/buttons';

import {
  MoreHorizontal,
  Pencil,
  Trash,
} from 'lucide-react';

import { ColumnDef } from '@tanstack/react-table';

export interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
}

interface UserTableProps {
  data: UserRow[];

  loading?: boolean;

  onEdit?: (
    user: UserRow
  ) => void;

  onDelete?: (
    user: UserRow
  ) => void;
}

export function UserTable({
  data,
  loading,
  onEdit,
  onDelete,
}: UserTableProps) {
  const columns: ColumnDef<UserRow>[] =
    [
      {
        accessorKey: 'firstName',
        header: 'Nombre',
      },

      {
        accessorFn: row =>
          `${row.firstName} ${row.lastName}`,
        header: 'Usuario',
      },

      {
        accessorKey: 'email',
        header: 'Email',
      },

      {
        accessorKey: 'role',
        header: 'Rol',
      },

      {
        accessorKey: 'active',

        header: 'Estado',

        cell: ({ row }) => (
          <Badge
            variant={
              row.original.active
                ? 'success'
                : 'secondary'
            }
          >
            {row.original.active
              ? 'Activo'
              : 'Inactivo'}
          </Badge>
        ),
      },

      {
        id: 'actions',

        header: '',

        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreHorizontal
                  className="h-4 w-4"
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
            >
              <DropdownMenuItem
                onClick={() =>
                  onEdit?.(
                    row.original
                  )
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  onDelete?.(
                    row.original
                  )
                }
              >
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
    />
  );
}
