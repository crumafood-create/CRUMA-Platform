import { describe, expect, it } from 'vitest';

import {
  inventoryRlsAuthority,
  summarizeRlsDependencies,
} from './rls-authority-inventory';

describe('inventario de autoridad RLS', () => {
  const policies = inventoryRlsAuthority();
  const summary = summarizeRlsDependencies();

  it('reconstruye las políticas vigentes sin perder su tabla', () => {
    expect(policies).toHaveLength(213);
    expect(summary).toEqual({
      policies: 213,
      authority: {
        is_admin_exclusive: 50,
        mixed: 0,
        not_is_admin: 163,
      },
      openReads: 35,
      openWrites: 13,
      missingReads: [],
      functionGuards: 39,
      anonWriteGrants: 136,
      authenticatedWriteGrants: 141,
    });
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
          table: 'organizations',
          policy: 'organizations_admin_write',
          authority: 'is_admin_exclusive',
        }),
        expect.objectContaining({
          table: 'plants',
          policy: 'plants_admin_write',
          authority: 'is_admin_exclusive',
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
      policies.filter((policy) =>
        ['organizations', 'plants'].includes(policy.table),
      ),
    ).toEqual([
      expect.objectContaining({
        table: 'organizations',
        command: 'all',
        authority: 'is_admin_exclusive',
      }),
      expect.objectContaining({
        table: 'plants',
        command: 'all',
        authority: 'is_admin_exclusive',
      }),
    ]);
  });
});
