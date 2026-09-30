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

const MOBILE_ACTION =
  'src/app/mobile/production/[id]/actions.ts';

const MOBILE_CLIENT =
  'src/app/mobile/production/[id]/' +
  'production-detail-client.tsx';

const ADMIN_ACTION =
  'src/app/(admin)/production-orders/actions.ts';

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
      'fc100000-0000-0000-0000-000000000001',
    roles: [role],
    authorizationSource:
      'legacy_user_roles',
  };
}

describe(
  'autorización del consumo de materia prima',
  () => {
    it(
      'reserva el consumo de producción para administradores',
      () => {
        expect(
          PERMISSIONS.PRODUCTION_MATERIAL_CONSUME,
        ).toBe(
          'production.material.consume',
        );

        expect(
          hasPermission(
            actor('admin'),
            PERMISSIONS.PRODUCTION_MATERIAL_CONSUME,
          ),
        ).toBe(true);

        expect(
          hasPermission(
            actor('customer'),
            PERMISSIONS.PRODUCTION_MATERIAL_CONSUME,
          ),
        ).toBe(false);
      },
    );

    it(
      'protege la acción móvil y delega el consumo a la RPC',
      () => {
        const action = actionSource(
          MOBILE_ACTION,
          'confirmProductionItem',
        );

        expect(action).toContain(
          'requireTypedAuthorizedAction(',
        );

        expect(action).toContain(
          'PERMISSIONS.PRODUCTION_MATERIAL_CONSUME',
        );

        expect(action).toContain(
          'buildProductionMaterialConsumptionRequest(',
        );

        expect(action).toContain(
          'consumeProductionMaterialFefo(',
        );

        expect(action).not.toContain(
          'createTypedClient(',
        );

        expect(action).not.toContain(
          'consumeProductionItem(',
        );

        expect(action).not.toContain(
          ".from('production_order_items')",
        );
      },
    );

    it(
      'envía una clave idempotente desde el cliente móvil',
      () => {
        const client = source(
          MOBILE_CLIENT,
        );

        expect(client).toContain(
          'crypto.randomUUID()',
        );

        expect(client).toContain(
          'const idempotencyKey',
        );

        expect(client).toContain(
          'idempotencyKey,',
        );

                expect(client).toContain(
          'const idempotencyKeyRef',
        );

        expect(client).toContain(
          'idempotencyKeyRef.current ??',
        );

        expect(client).toContain(
          'idempotencyKeyRef.current = null',
        );
      },
    );

    it(
  'delega el cierre y su validación a la transacción',
  () => {
    const action = actionSource(
      ADMIN_ACTION,
      'completeProductionOrder',
    );

    expect(action).toContain(
      'completeProductionOutputToQuarantine(',
    );

    expect(action).not.toContain(
      ".from('production_order_items')",
    );

    expect(action).not.toContain(
      'createInventoryMovement(',
    );
  },
);

        it(
      'elimina las rutas hacia el servicio de escrituras fragmentadas',
      () => {
        expect(
          source(MOBILE_ACTION),
        ).not.toContain(
          'production-service',
        );

        expect(
          source(ADMIN_ACTION),
        ).not.toContain(
          'production-service',
        );
      },
    );

    it(
      'distingue materiales consumidos de producción terminada',
      () => {
        const client = source(
          MOBILE_CLIENT,
        );

        expect(client).toContain(
          'Materiales consumidos',
        );

        expect(client).toContain(
          'La orden está lista para registrar el producto terminado.',
        );

        expect(client).not.toContain(
          'La orden quedó registrada y el producto terminado fue generado.',
        );
      },
    );
  },
);