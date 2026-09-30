import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  AuthorizationActor,
} from '@/modules/identity/guards/types';
import {
  PERMISSIONS,
} from '@/modules/identity/permissions/permissions.constants';
import {
  hasPermission,
} from '@/modules/identity/permissions/permissions.service';

function source(path: string): string {
  return readFileSync(
    resolve(process.cwd(), path),
    'utf8',
  );
}

function actor(
  role: 'admin' | 'customer',
): AuthorizationActor {
  return {
    userId:
      'a1000000-0000-4000-8000-000000000001',
    roles: [role],
    authorizationSource:
      'legacy_user_roles',
  };
}

describe(
  'autorización de liberación de producto terminado',
  () => {
    it(
      'reserva la liberación para administradores',
      () => {
        expect(
          PERMISSIONS.PRODUCTION_LOT_RELEASE,
        ).toBe('production.lot.release');

        expect(
          hasPermission(
            actor('admin'),
            'production.lot.release',
          ),
        ).toBe(true);

        expect(
          hasPermission(
            actor('customer'),
            'production.lot.release',
          ),
        ).toBe(false);
      },
    );

    it(
      'delega la liberación completa a la RPC atómica',
      () => {
        const action = source(
          'src/app/(admin)/lots/actions.ts',
        );

        expect(action).toContain(
          'PERMISSIONS.PRODUCTION_LOT_RELEASE',
        );

        expect(action).toContain(
          'buildFinishedProductQualityReleaseRequest(',
        );

        expect(action).toContain(
          'releaseFinishedProductQualityToInventory(',
        );

        expect(action).not.toContain(
          'buildProductionLotReleaseRequest(',
        );

        expect(action).not.toContain(
          ".from('product_lots')",
        );

        expect(action).not.toContain(
          ".from('inventory_movements')",
        );
      },
    );

    it(
      'captura inspección e idempotencia en el formulario',
      () => {
        const form = source(
          'src/modules/manufacturing/components/' +
            'forms/production-lot-release-form.tsx',
        );

        expect(form).toContain(
          'releaseFinishedProductQualityToInventory',
        );

        expect(form).toContain(
          'name="quality_inspection_id"',
        );

        expect(form).toContain(
          'name="idempotency_key"',
        );

        expect(form).not.toContain(
          'name="production_output_id"',
        );
      },
    );

    it(
      'consulta inspecciones aprobadas con salida pendiente',
      () => {
        const page = source(
          'src/app/(admin)/lots/release/page.tsx',
        );

        expect(page).toContain(
          ".from('quality_inspections')",
        );

        expect(page).toContain(
          ".eq('subject_type', 'production_output')",
        );

        expect(page).toContain(
          ".eq('status', 'passed')",
        );

        expect(page).toContain(
          'quality_status',
        );

        expect(page).toContain(
          "'pending'",
        );

        expect(page).toContain(
          'crypto.randomUUID()',
        );

        expect(page).not.toContain(
          ".eq('quality_status', 'released')",
        );
      },
    );

    it(
      'envía la inspección aprobada al formulario atómico',
      () => {
        const detailPage = source(
          'src/app/(admin)/qa/[id]/page.tsx',
        );

        expect(detailPage).toContain(
          "'/lots/release?inspection_id='",
        );

        expect(detailPage).toContain(
          'Preparar liberación a inventario',
        );
      },
    );
  },
);