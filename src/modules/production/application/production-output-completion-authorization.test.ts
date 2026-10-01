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

const ADMIN_ACTION =
  'src/app/(admin)/production-orders/actions.ts';

const DETAIL_PAGE =
  'src/app/(admin)/production-orders/[id]/page.tsx';

function source(path: string): string {
  return readFileSync(
    resolve(process.cwd(), path),
    'utf8',
  );
}

function actionSource(
  path: string,
  action: string,
): string {
  const file = source(path);

  const start = file.indexOf(
    `export async function ${action}`,
  );

  if (start < 0) {
    throw new Error(
      `Acción no encontrada: ${action}`,
    );
  }

  const next = file.indexOf(
    'export async function ',
    start + 1,
  );

  return file.slice(
    start,
    next < 0 ? undefined : next,
  );
}

function actor(
  role: 'admin' | 'customer',
): AuthorizationActor {
  return {
    userId:
      'fa100000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource:
      'legacy_user_roles',
  };
}

describe(
  'autorización del cierre de producción',
  () => {
    it(
      'reserva el cierre para administradores',
      () => {
        expect(
          PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
        ).toBe(
          'production.order.complete',
        );

        expect(
          hasPermission(
            actor('admin'),
            PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
          ),
        ).toBe(true);

        expect(
          hasPermission(
            actor('customer'),
            PERMISSIONS.PRODUCTION_ORDER_COMPLETE,
          ),
        ).toBe(false);
      },
    );

    it(
      'delega el cierre completo a la RPC protegida',
      () => {
        const action = actionSource(
          ADMIN_ACTION,
          'completeProductionOrder',
        );

        expect(action).toContain(
          'requireTypedAuthorizedAction(',
        );

        expect(action).toContain(
          'PERMISSIONS.PRODUCTION_ORDER_COMPLETE',
        );

        expect(action).toContain(
          'buildProductionOutputCompletionRequest(',
        );

        expect(action).toContain(
          "formData.get('waste_quantity')",
        );

        expect(action).toContain(
          "formData.get('variance_reason')",
        );

        expect(action).toContain(
          'completeProductionOutputToQuarantine(',
        );
      },
    );

    it(
      'elimina escrituras fragmentadas del cierre',
      () => {
        const action = actionSource(
          ADMIN_ACTION,
          'completeProductionOrder',
        );

        expect(action).not.toContain(
          'createInventoryMovement(',
        );

        expect(action).not.toContain(
          ".from('production_orders')",
        );

        expect(action).not.toContain(
          ".from('production_outputs')",
        );

        expect(action).not.toContain(
          ".from('inventory_movements')",
        );
      },
    );

    it(
      'captura producción, merma, motivo e idempotencia en el formulario',
      () => {
        const page = source(
          DETAIL_PAGE,
        );

        expect(page).toContain(
          'name="produced_quantity"',
        );

        expect(page).toContain(
          'name="waste_quantity"',
        );

        expect(page).toContain(
          'name="variance_reason"',
        );

        expect(page).toContain(
          'name="idempotency_key"',
        );

        expect(page).toContain(
          'crypto.randomUUID()',
        );

        expect(page).toContain(
          'step="1"',
        );

        expect(page).toContain(
          'completeProductionOrder.bind(',
        );
      },
    );
  },
);