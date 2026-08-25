import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ACTIONS_FILE = '../../../app/(admin)/flavors/actions.ts';

function actionSource(action: string): string {
  const source = readFileSync(new URL(ACTIONS_FILE, import.meta.url), 'utf8');
  const declaration = `export async function ${action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${action}`);

  const nextAction = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, nextAction === -1 ? undefined : nextAction);
}

describe('autorización explícita del catálogo de sabores', () => {
  it.each(['createFlavor', 'updateFlavor', 'deleteFlavor'])(
    'protege %s con el permiso de administración del catálogo',
    (action) => {
      const source = actionSource(action);
      const guard = source.indexOf('requireTypedAuthorizedAction(');
      const write = source.indexOf(".from('flavors')");

      expect(guard >= 0).toBe(true);
      expect(source.includes('PERMISSIONS.CATALOG_PRODUCT_MANAGE')).toBe(true);
      expect(write > guard).toBe(true);
    },
  );

  it('comprueba productos activos antes de eliminar un sabor', () => {
    const source = actionSource('deleteFlavor');
    const guard = source.indexOf('assertFlavorCanBeDeleted(');
    const write = source.indexOf(".from('flavors')");

    expect(guard >= 0).toBe(true);
    expect(write > guard).toBe(true);
  });

  it.each([
    '../../../app/(admin)/flavors/page.tsx',
    '../../../app/(admin)/flavors/[id]/edit/page.tsx',
  ])('utiliza exclusivamente el cliente tipado en %s', (page) => {
    const source = readFileSync(new URL(page, import.meta.url), 'utf8');

    expect(source.includes('createTypedClient(')).toBe(true);
    expect(source.includes('createClient(')).toBe(false);
  });
});
