'use client';

import { Search } from 'lucide-react';

import { Input } from '@/shared/ui/forms';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/forms';

interface UserFiltersProps {
  search?: string;

  role?: string;

  status?: string;

  onSearchChange?: (
    value: string
  ) => void;

  onRoleChange?: (
    value: string
  ) => void;

  onStatusChange?: (
    value: string
  ) => void;

  roles?: {
    label: string;
    value: string;
  }[];
}

export function UserFilters({
  search,
  role,
  status,
  roles = [],
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="relative flex-1">
        <Search
          className="
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "
        />

        <Input
          value={search}
          placeholder="Buscar usuario..."
          className="pl-9"
          onChange={e =>
            onSearchChange?.(
              e.target.value
            )
          }
        />
      </div>

      <Select
        value={role}
        onValueChange={
          onRoleChange
        }
      >
        <SelectTrigger
          className="w-full md:w-56"
        >
          <SelectValue placeholder="Rol" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            Todos
          </SelectItem>

          {roles.map(role => (
            <SelectItem
              key={role.value}
              value={role.value}
            >
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={
          onStatusChange
        }
      >
        <SelectTrigger
          className="w-full md:w-56"
        >
          <SelectValue placeholder="Estado" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            Todos
          </SelectItem>

          <SelectItem value="active">
            Activos
          </SelectItem>

          <SelectItem value="inactive">
            Inactivos
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
