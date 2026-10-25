import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from './permissions.constants';
import { LEGACY_ROLE_PERMISSIONS } from './permissions.matrix';
import {
  equivalentPermissions,
  PUBLISHED_PERMISSION_COUNT,
  ROLE_VOCABULARIES,
  ROLE_VOCABULARY_EQUIVALENCE,
} from './role-vocabulary-equivalence';

describe('matriz de equivalencia de roles', () => {
  it('cubre los cuatro vocabularios sin promover autoridad nueva', () => {
    expect(ROLE_VOCABULARIES).toEqual([
      'user_roles',
      'profiles',
      'tenant_members',
      'admin_permissions',
    ]);
    expect(
      new Set(ROLE_VOCABULARY_EQUIVALENCE.map((entry) => entry.vocabulary)),
    ).toEqual(new Set(ROLE_VOCABULARIES));
    expect(
      ROLE_VOCABULARY_EQUIVALENCE.filter((entry) => entry.authorizes),
    ).toEqual([
      expect.objectContaining({
        vocabulary: 'user_roles',
        value: 'admin',
      }),
      expect.objectContaining({
        vocabulary: 'user_roles',
        value: 'customer',
      }),
    ]);
  });

  it('no trata los admin homónimos como equivalentes', () => {
    expect(equivalentPermissions('user_roles', 'admin')).toEqual(
      LEGACY_ROLE_PERMISSIONS.admin,
    );
    expect(equivalentPermissions('profiles', 'admin')).toEqual([]);
    expect(equivalentPermissions('tenant_members', 'admin')).toEqual([]);
    expect(equivalentPermissions('admin_permissions', 'permission_id')).toEqual(
      [],
    );
  });

  it('conserva el catálogo publicado solo en el admin efectivo', () => {
    expect(PUBLISHED_PERMISSION_COUNT).toBe(37);
    expect(LEGACY_ROLE_PERMISSIONS.admin).toEqual(Object.values(PERMISSIONS));
    expect(equivalentPermissions('user_roles', 'customer')).toEqual([]);
    expect(equivalentPermissions('profiles', 'client')).toEqual([]);
    expect(equivalentPermissions('profiles', 'b2b')).toEqual([]);
    expect(equivalentPermissions('tenant_members', 'owner')).toEqual([]);
    expect(equivalentPermissions('tenant_members', 'member')).toEqual([]);
    expect(equivalentPermissions('tenant_members', 'viewer')).toEqual([]);
  });

  it('rechaza una equivalencia no verificada', () => {
    expect(() => equivalentPermissions('profiles', 'owner')).toThrow(
      /No existe equivalencia verificada/,
    );
  });
});
