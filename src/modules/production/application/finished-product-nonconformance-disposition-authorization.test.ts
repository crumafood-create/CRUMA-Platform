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
  'autorización de disposición de producto no conforme',
  () => {
    it(
      'reserva la disposición para administradores',
      () => {
        expect(
          PERMISSIONS.QUALITY_RELEASE_DECIDE,
        ).toBe('quality.release.decide');

        expect(
          hasPermission(
            actor('admin'),
            'quality.release.decide',
          ),
        ).toBe(true);

        expect(
          hasPermission(
            actor('customer'),
            'quality.release.decide',
          ),
        ).toBe(false);
      },
    );

    it(
      'delega toda la disposición a la RPC atómica',
      () => {
        const action = source(
          'src/app/(admin)/qa/actions.ts',
        );

        expect(action).toContain(
          'PERMISSIONS.QUALITY_RELEASE_DECIDE',
        );

        expect(action).toContain(
          'buildFinishedProductNonconformanceDispositionRequest(',
        );

        expect(action).toContain(
          'disposeFinishedProductNonconformance(',
        );

        expect(action).not.toContain(
          ".from('finished_product_nonconformance_disposition_operations')",
        );

        expect(action).not.toContain(
          ".from('production_orders')",
        );

        expect(action).not.toContain(
          ".from('production_order_items')",
        );
      },
    );

    it(
      'captura disposición, motivo e idempotencia',
      () => {
        const page = source(
          'src/app/(admin)/qa/[id]/page.tsx',
        );

        expect(page).toContain(
          'disposeFinishedProductNonconformance',
        );

        expect(page).toContain(
          'name="quality_inspection_id"',
        );

        expect(page).toContain(
          'name="disposition"',
        );

        expect(page).toContain(
          'name="reason"',
        );

        expect(page).toContain(
          'name="idempotency_key"',
        );

        expect(page).toContain(
          'value="scrap"',
        );

        expect(page).toContain(
          'value="rework"',
        );

        expect(page).toContain(
          'crypto.randomUUID()',
        );
      },
    );

    it(
      'elimina el rechazo fragmentado de la interfaz',
      () => {
        const page = source(
          'src/app/(admin)/qa/[id]/page.tsx',
        );

        expect(page).not.toContain(
          "(['hold', 'reject'] as const)",
        );

        expect(page).not.toContain(
          "decisionValue === 'reject'",
        );

        expect(page).toContain(
          "'hold'",
        );

        expect(page).toContain(
          'Retener',
        );
      },
    );

    it(
      'muestra la disposición y la orden de retrabajo',
      () => {
        const page = source(
          'src/app/(admin)/qa/[id]/page.tsx',
        );

        expect(page).toContain(
          ".from('finished_product_nonconformance_disposition_operations')",
        );

        expect(page).toContain(
          'rework_production_order_id',
        );

        expect(page).toContain(
          "'/production-orders/'",
        );

        expect(page).toContain(
          'Descarte',
        );

        expect(page).toContain(
          'Retrabajo',
        );
      },
    );
  },
);
