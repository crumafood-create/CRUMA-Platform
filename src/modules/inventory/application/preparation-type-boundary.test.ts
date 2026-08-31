import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ACTIONS_FILE = '../../../app/(admin)/products/actions.ts';

function actionSource(action: string): string {
  const source = readFileSync(new URL(ACTIONS_FILE, import.meta.url), 'utf8');
  const declaration = `export async function ${action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${action}`);

  const next = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, next === -1 ? undefined : next);
}

describe('límite global de tipos de preparación', () => {
  it.each(['createProduct', 'updateProduct'])(
    'valida el tipo de preparación antes de escribir en %s',
    (action) => {
      const source = actionSource(action);
      const validation = source.indexOf('assertPreparationTypeExists(');
      const write = source.indexOf(".from('products')");

      expect(validation >= 0).toBe(true);
      expect(write > validation).toBe(true);
    },
  );

  it('conserva la autorización explícita del catálogo de productos', () => {
    const source = actionSource('createProduct');
    const authorization = source.indexOf('requireTypedAuthorizedAction(');
    const validation = source.indexOf('assertPreparationTypeExists(');

    expect(source.includes('PERMISSIONS.CATALOG_PRODUCT_MANAGE')).toBe(true);
    expect(authorization >= 0).toBe(true);
    expect(validation > authorization).toBe(true);
  });
});
