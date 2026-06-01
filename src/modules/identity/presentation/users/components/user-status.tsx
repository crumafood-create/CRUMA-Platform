'use client';

import { Badge } from '@/shared/ui/feedback';

export type UserStatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'deleted';

interface UserStatusProps {
  status: UserStatusType;
}

const statusConfig = {
  active: {
    label: 'Activo',
    variant: 'success',
  },

  inactive: {
    label: 'Inactivo',
    variant: 'secondary',
  },

  pending: {
    label: 'Pendiente',
    variant: 'warning',
  },

  suspended: {
    label: 'Suspendido',
    variant: 'destructive',
  },

  deleted: {
    label: 'Eliminado',
    variant: 'outline',
  },
} as const;

export function UserStatus({
  status,
}: UserStatusProps) {
  const config =
    statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
