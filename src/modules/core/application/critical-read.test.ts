import { describe, expect, it } from 'vitest';

import { requireRows } from './critical-read';

describe('lecturas críticas', () => {
  it('devuelve las filas cuando la consulta concluye correctamente', () => {
    expect(
      requireRows({ data: [{ id: 'row-1' }], error: null }, 'ventas'),
    ).toEqual([{ id: 'row-1' }]);
  });

  it('normaliza una respuesta correcta sin filas', () => {
    expect(requireRows({ data: null, error: null }, 'inventario')).toEqual([]);
  });

  it('no convierte una falla de Supabase en un estado vacío', () => {
    expect(() =>
      requireRows(
        { data: null, error: new Error('database unavailable') },
        'producción',
      ),
    ).toThrow('No fue posible cargar producción.');
  });
});
