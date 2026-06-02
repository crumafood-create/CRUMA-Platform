'use client';

import {
  PageHeader,
  SectionCard,
} from '@/shared/ui/layout';

import { Button } from '@/shared/ui/buttons';

import {
  IdentityLayout,
} from '../layouts';

export function PermissionsPage() {
  return (
    <IdentityLayout>
      <PageHeader
        title="Permisos"
        description="Administra permisos del sistema"
        actions={
          <Button>
            Nuevo Permiso
          </Button>
        }
      />

      <SectionCard
        title="Permisos"
        description="Listado de permisos registrados"
      >
        Próximamente DataTable de Permisos
      </SectionCard>
    </IdentityLayout>
  );
}
