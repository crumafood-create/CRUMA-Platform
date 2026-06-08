import { toSlug, toInternalCode } from './product-code';

test('toSlug elimina tildes', () => {
  expect(toSlug('Tequeños Clásicos')).toBe('tequenos-clasicos');
});

test('toInternalCode ignora stop words', () => {
  expect(toInternalCode('Empanadas de Pollo')).toBe('EMP-POL');
});
