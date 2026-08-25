import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type ActionContract = {
  file: string;
  action: string;
  guard: string;
  table: string;
};

const INTEGRITY_ACTIONS: ActionContract[] = [
  {
    file: '../../../app/(admin)/raw-materials/actions.ts',
    action: 'createRawMaterial',
    guard: 'assertRawMaterialFamilyBelongsToCategory(',
    table: 'raw_materials',
  },
  {
    file: '../../../app/(admin)/raw-materials/actions.ts',
    action: 'updateRawMaterial',
    guard: 'assertRawMaterialFamilyBelongsToCategory(',
    table: 'raw_materials',
  },
  {
    file: '../../../app/(admin)/families/actions.ts',
    action: 'updateFamily',
    guard: 'assertFamilyCategoryCanBeChanged(',
    table: 'families',
  },
];

function actionSource(contract: ActionContract): string {
  const source = readFileSync(new URL(contract.file, import.meta.url), 'utf8');
  const declaration = `export async function ${contract.action}`;
  const start = source.indexOf(declaration);

  if (start === -1) throw new Error(`Acción no encontrada: ${contract.action}`);

  const nextAction = source.indexOf('export async function ', start + declaration.length);

  return source.slice(start, nextAction === -1 ? undefined : nextAction);
}

describe('integridad categoría-familia antes de escrituras administrativas', () => {
  it.each(INTEGRITY_ACTIONS)('protege la acción %j antes de escribir', (contract) => {
    const source = actionSource(contract);
    const guardIndex = source.indexOf(contract.guard);
    const writeIndex = source.indexOf(`.from('${contract.table}')`);

    expect(guardIndex >= 0).toBe(true);
    expect(writeIndex > guardIndex).toBe(true);
  });
});
