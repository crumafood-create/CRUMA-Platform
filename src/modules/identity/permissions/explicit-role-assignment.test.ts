import { describe, expect, it } from 'vitest';

import { assignExplicitLegacyRole } from './explicit-role-assignment';

describe('asignación explícita de roles', () => {
  it('acepta únicamente una fila admin de user_roles', () => {
    expect(
      assignExplicitLegacyRole({
        userRole: 'admin',
        profileRole: 'client',
        tenantMemberRole: 'member',
      }),
    ).toEqual({
      source: 'user_roles',
      role: 'admin',
      inferred: false,
    });
  });

  it('no infiere admin desde perfil o membresía', () => {
    expect(
      assignExplicitLegacyRole({
        userRole: null,
        profileRole: 'admin',
        tenantMemberRole: 'admin',
      }),
    ).toBeNull();
  });

  it('conserva customer aunque los otros vocabularios digan admin', () => {
    expect(
      assignExplicitLegacyRole({
        userRole: 'customer',
        profileRole: 'admin',
        tenantMemberRole: 'owner',
      }),
    ).toEqual({
      source: 'user_roles',
      role: 'customer',
      inferred: false,
    });
  });
});
