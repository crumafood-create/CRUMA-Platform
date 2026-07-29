import { expect, test } from 'vitest';

import { toInternalCode, toSlug } from './product-code';

test('toSlug elimina tildes y normaliza espacios', () => {
  expect(toSlug('  Tequeños   Clásicos!  ')).toBe('tequenos-clasicos');
});

test('toInternalCode ignora stop words y usa el diccionario', () => {
  expect(toInternalCode('Empanadas de Pollo')).toBe('EMP-POL');
});

test('toInternalCode limita el código y aplica fallback', () => {
  expect(toInternalCode('Salsa Especial Grande de la Casa')).toBe(
    'SALS-ESPE-GRD',
  );
});