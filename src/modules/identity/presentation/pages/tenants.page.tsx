'use client';

import {
  PageHeader,
  SectionCard,
} from '@/shared/ui/layout';

import { Button } from '@/shared/ui/buttons';

import {
  IdentityLayout,
} from '../layouts';

export function TenantsPage() {
  return (
    <IdentityLayout>
      <PageHeader
        title="Empresas"
        description="Administra empresas y organizaciones"
        actions={
          <Button>
            Nueva Empresa
          </Button>
        }
      />

      <SectionCard
        title="Empresas"
        description="Listado de empresas registradas"
      >
        Próximamente DataTable de Empresas
      </SectionCard>
    </IdentityLayout>
  );
}
