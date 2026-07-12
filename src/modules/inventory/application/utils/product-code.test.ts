import { strictEqual } from 'node:assert';
import { test } from 'node:test';

import { toSlug, toInternalCode } from './product-code';

test('toSlug elimina tildes', () => {
  strictEqual(toSlug('Tequeños Clásicos'), 'tequenos-clasicos');
});

test('toInternalCode ignora stop words', () => {
  strictEqual(toInternalCode('Empanadas de Pollo'), 'EMP-POL');
});
