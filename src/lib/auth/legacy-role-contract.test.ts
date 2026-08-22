import { describe, expect, it } from 'vitest';

import {
  LEGACY_ROLES,
  LegacyRoleLookupError,
  normalizeLegacyRoles,
} from './legacy-role-contract';

describe('contrato tipado de roles legacy', () => {
  it('limita los roles admitidos al contrato autorizado', () => {
    expect(LEGACY_ROLES).toEqual(['admin', 'customer']);
  });

  it('conserva el orden y elimina roles duplicados', () => {
    expect(
      normalizeLegacyRoles([
        { role: 'customer' },
        { role: 'admin' },
        { role: 'customer' },
      ]),
    ).toEqual(['customer', 'admin']);
  });

  it('acepta un inventario vacío', () => {
    expect(normalizeLegacyRoles([])).toEqual([]);
  });

  it.each([
    [{ role: 'manager' }],
    [{ role: null }],
    [{ role: 1 }],
    [{}],
    [null],
  ])('rechaza filas fuera del contrato autorizado: %j', (row) => {
    expect(() => normalizeLegacyRoles([row])).toThrow(
      'Se encontró un rol legacy fuera del contrato autorizado.',
    );
  });

  it('conserva el error específico usado por autorización', () => {
    const error = new LegacyRoleLookupError('consulta fallida');

    expect(error.name).toBe('LegacyRoleLookupError');
    expect(error.message).toBe('consulta fallida');
  });
});
