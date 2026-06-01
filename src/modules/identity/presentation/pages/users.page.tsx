'use client';

import {
  ContentGrid,
  PageHeader,
  SectionCard,
} from '@/shared/ui/layout';

import { Button } from '@/shared/ui/buttons';

import {
  UserFilters,
  UserTable,
} from '../users/components';

import {
  useUsers,
} from '../users/hooks';

export function UsersPage() {
  const {
    users,
    isLoading,
  } = useUsers();

  return (
    <ContentGrid>
      <PageHeader
        title="Usuarios"
        description="Administra usuarios, roles y accesos"
        actions={
          <Button>
            Nuevo Usuario
          </Button>
        }
      />

      <SectionCard>
        <UserFilters
          roles={[
            {
              label: 'Administrador',
              value: 'admin',
            },
            {
              label: 'Supervisor',
              value: 'supervisor',
            },
            {
              label: 'Operador',
              value: 'operator',
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Usuarios"
        description="Listado de usuarios registrados"
      >
        <UserTable
          data={users}
          loading={isLoading}
        />
      </SectionCard>
    </ContentGrid>
  );
}
