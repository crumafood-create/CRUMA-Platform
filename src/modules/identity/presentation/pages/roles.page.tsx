'use client';

import {
  PageHeader,
  SectionCard,
} from '@/shared/ui/layout';

import { Button } from '@/shared/ui/primitives/button';

import {
  IdentityLayout,
} from '../layouts';

export function RolesPage() {
  return (
    <IdentityLayout>
      <PageHeader
        title="Roles"
        description="Administra roles del sistema"
        actions={
          <Button>
            Nuevo Rol
          </Button>
        }
      />

      <SectionCard
        title="Roles"
        description="Listado de roles registrados"
      >
        Próximamente DataTable de Roles
      </SectionCard>
    </IdentityLayout>
  );
}
