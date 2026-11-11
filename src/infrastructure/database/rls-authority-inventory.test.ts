import { describe, expect, it } from 'vitest';

import {
  inventoryRlsAuthority,
  summarizeRlsDependencies,
} from './rls-authority-inventory';

describe('inventario de autoridad RLS', () => {
  const policies = inventoryRlsAuthority();
  const summary = summarizeRlsDependencies();

  it('reconstruye las políticas vigentes sin perder su tabla', () => {
    expect(policies).toHaveLength(212);
    expect(summary).toEqual({
      policies: 212,
      authority: {
        is_admin_exclusive: 49,
        mixed: 0,
        not_is_admin: 163,
      },
      openReads: 35,
      openWrites: 13,
      missingReads: [],
      functionGuards: 50,
      anonWriteGrants: 136,
      authenticatedWriteGrants: 139,
    });
  });

  it('registra la lectura administrativa del plan de producción', () => {
    expect(policies).toContainEqual(
      expect.objectContaining({
        table: 'production_order_items',
        policy: 'production_order_items_admin_read',
        authority: 'is_admin_exclusive',
        command: 'select',
        open: false,
      }),
    );
  });

  it('limita la lectura de reservas de lotes de masa a administradores', () => {
    expect(policies).toContainEqual(
      expect.objectContaining({
        table: 'production_order_product_lot_reservations',
        policy: 'production_order_product_lot_reservations_admin_read',
        authority: 'is_admin_exclusive',
        command: 'select',
        open: false,
      }),
    );
  });

  it('separa la lectura abierta de almacenes de su escritura administrativa', () => {
    expect(policies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: 'warehouses',
          policy: 'warehouses_select',
          authority: 'not_is_admin',
          command: 'select',
          open: true,
        }),
        expect.objectContaining({
          table: 'warehouses',
          policy: 'warehouses_admin_write',
          authority: 'is_admin_exclusive',
        }),
      ]),
    );
  });

  it('no encuentra una política que combine is_admin con tenant', () => {
    expect(summary.authority.mixed).toBe(0);
    expect(
      policies.some(
        (policy) =>
          policy.table === 'inventory_movements' &&
          policy.command !== 'select' &&
          policy.open,
      ),
    ).toBe(true);
    expect(
      policies.some((policy) =>
        ['organizations', 'plants'].includes(policy.table),
      ),
    ).toBe(false);
  });
});
