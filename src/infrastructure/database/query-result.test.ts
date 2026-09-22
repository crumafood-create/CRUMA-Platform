import { describe, expect, it } from 'vitest';

import {
  DatabaseQueryError,
  requireOptional,
  requireRows,
  requireSingle,
} from './query-result';

describe('contrato de respuestas Supabase', () => {
  it('normaliza listas y opcionales exitosos', () => {
    expect(requireRows({ data: null, error: null }, 'productos')).toEqual([]);
    expect(requireOptional({ data: null, error: null }, 'producto')).toBeNull();
  });

  it('exige un registro cuando el contrato es singular', () => {
    expect(() =>
      requireSingle({ data: null, error: null }, 'orden de venta'),
    ).toThrow('No se encontró orden de venta.');
  });

  it('convierte errores del proveedor en un error estable de aplicación', () => {
    const providerError = {
      code: 'PGRST001',
      message: 'provider detail',
    };

    expect(() =>
      requireRows({ data: null, error: providerError }, 'inventario'),
    ).toThrow(
      expect.objectContaining<Partial<DatabaseQueryError>>({
        name: 'DatabaseQueryError',
        code: 'PGRST001',
        message: 'No fue posible cargar inventario.',
      }),
    );
  });
});
