import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from './permissions.constants';
import { LEGACY_ROLE_PERMISSIONS } from './permissions.matrix';
import { unifyRoleVocabulary } from './unified-role-vocabulary';

const externalClaims = [
  { vocabulary: 'profiles', value: 'admin' },
  { vocabulary: 'tenant_members', value: 'admin' },
  { vocabulary: 'admin_permissions', value: 'permission_id' },
] as const;

describe('vocabulario unificado de roles', () => {
  it('une los cuatro vocabularios sin ampliar user_roles', () => {
    const unified = unifyRoleVocabulary([
      { vocabulary: 'user_roles', value: 'admin' },
      ...externalClaims,
    ]);

    expect(unified.permissions).toEqual(LEGACY_ROLE_PERMISSIONS.admin);
    expect(unified.permissions).toContain(PERMISSIONS.ADMIN_PANEL_ACCESS);
    expect(unified.widened).toBe(false);
  });

  it('conserva vacío el resultado cuando solo hay valores externos', () => {
    const unified = unifyRoleVocabulary([
      { vocabulary: 'user_roles', value: 'customer' },
      ...externalClaims,
    ]);

    expect(unified.permissions).toEqual([]);
    expect(unified.widened).toBe(false);
  });

  it('exige los cuatro vocabularios antes de unificar', () => {
    expect(() =>
      unifyRoleVocabulary([
        { vocabulary: 'user_roles', value: 'admin' },
      ]),
    ).toThrow(/Faltan vocabularios/);
  });

  it('rechaza un valor externo sin fila verificada', () => {
    expect(() =>
      unifyRoleVocabulary([
        { vocabulary: 'user_roles', value: 'admin' },
        { vocabulary: 'profiles', value: 'owner' },
        { vocabulary: 'tenant_members', value: 'owner' },
        { vocabulary: 'admin_permissions', value: 'permission_id' },
      ]),
    ).toThrow(/No existe equivalencia verificada/);
  });
});
